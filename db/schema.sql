-- ============================================================
-- World.ING — Schema completo (v2)
-- ------------------------------------------------------------
-- Use este arquivo para uma instalação NOVA (banco vazio).
-- Se você já rodou a v1, use db/migration_v1_to_v2.sql em vez deste.
--
-- Hierarquia: projects -> designs -> design_screens (telas)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tabelas ----------

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Um design é um card da galeria; agrupa uma ou mais telas.
create table if not exists public.designs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete set null,
  title       text not null,
  description text,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Cada tela é um arquivo exportado do Figma, pertencente a um design.
create table if not exists public.design_screens (
  id             uuid primary key default gen_random_uuid(),
  design_id      uuid not null references public.designs (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  storage_path   text not null,
  thumbnail_path text,
  file_type      text not null,        -- 'png' | 'jpg' | 'svg' | 'pdf'
  file_size      bigint,
  width          integer,
  height         integer,
  position       integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ---------- Índices ----------

create index if not exists designs_user_id_idx        on public.designs (user_id);
create index if not exists designs_project_id_idx     on public.designs (project_id);
create index if not exists designs_created_at_idx     on public.designs (created_at desc);
create index if not exists designs_tags_idx           on public.designs using gin (tags);
create index if not exists projects_user_id_idx       on public.projects (user_id);
create index if not exists screens_design_id_idx      on public.design_screens (design_id);
create index if not exists screens_user_id_idx        on public.design_screens (user_id);
create index if not exists screens_position_idx       on public.design_screens (design_id, position);

-- ---------- updated_at ----------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists designs_set_updated_at on public.designs;
create trigger designs_set_updated_at
  before update on public.designs
  for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------

alter table public.projects       enable row level security;
alter table public.designs        enable row level security;
alter table public.design_screens enable row level security;

do $$
declare
  t text;
  op text;
begin
  foreach t in array array['projects', 'designs', 'design_screens'] loop
    foreach op in array array['select', 'insert', 'update', 'delete'] loop
      execute format('drop policy if exists "%s owner %s" on public.%I', t, op, t);
    end loop;
    execute format(
      'create policy "%s owner select" on public.%I for select using (auth.uid() = user_id)', t, t);
    execute format(
      'create policy "%s owner insert" on public.%I for insert with check (auth.uid() = user_id)', t, t);
    execute format(
      'create policy "%s owner update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format(
      'create policy "%s owner delete" on public.%I for delete using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- ---------- Storage: bucket privado 'designs' ----------
-- Caminho dos arquivos: {user_id}/{design_id}/{screen_id}/original.<ext> e thumb.png

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'designs', 'designs', false, 52428800,
  array['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "designs storage owner select" on storage.objects;
drop policy if exists "designs storage owner insert" on storage.objects;
drop policy if exists "designs storage owner update" on storage.objects;
drop policy if exists "designs storage owner delete" on storage.objects;

create policy "designs storage owner select" on storage.objects for select
  using (bucket_id = 'designs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "designs storage owner insert" on storage.objects for insert
  with check (bucket_id = 'designs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "designs storage owner update" on storage.objects for update
  using (bucket_id = 'designs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "designs storage owner delete" on storage.objects for delete
  using (bucket_id = 'designs' and (storage.foldername(name))[1] = auth.uid()::text);
