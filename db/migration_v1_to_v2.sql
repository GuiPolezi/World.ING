-- ============================================================
-- World.ING — Migração v1 -> v2
-- ------------------------------------------------------------
-- Use este arquivo se você JÁ rodou o schema da v1 (com dados ou não).
-- Ele cria a tabela de telas, move o arquivo único de cada design
-- para uma tela, e remove as colunas de arquivo da tabela designs.
-- É seguro rodar mais de uma vez.
-- ============================================================

-- 1. Nova tabela de telas
create table if not exists public.design_screens (
  id             uuid primary key default gen_random_uuid(),
  design_id      uuid not null references public.designs (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  storage_path   text not null,
  thumbnail_path text,
  file_type      text not null,
  file_size      bigint,
  width          integer,
  height         integer,
  position       integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists screens_design_id_idx on public.design_screens (design_id);
create index if not exists screens_user_id_idx   on public.design_screens (user_id);
create index if not exists screens_position_idx  on public.design_screens (design_id, position);

alter table public.design_screens enable row level security;

drop policy if exists "design_screens owner select" on public.design_screens;
drop policy if exists "design_screens owner insert" on public.design_screens;
drop policy if exists "design_screens owner update" on public.design_screens;
drop policy if exists "design_screens owner delete" on public.design_screens;

create policy "design_screens owner select" on public.design_screens for select
  using (auth.uid() = user_id);
create policy "design_screens owner insert" on public.design_screens for insert
  with check (auth.uid() = user_id);
create policy "design_screens owner update" on public.design_screens for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "design_screens owner delete" on public.design_screens for delete
  using (auth.uid() = user_id);

-- 2. Mover os arquivos existentes (v1) para telas — só se a coluna ainda existir
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'designs' and column_name = 'storage_path'
  ) then
    insert into public.design_screens
      (design_id, user_id, storage_path, thumbnail_path, file_type, file_size, width, height, position)
    select d.id, d.user_id, d.storage_path, d.thumbnail_path, d.file_type,
           d.file_size, d.width, d.height, 0
    from public.designs d
    where not exists (
      select 1 from public.design_screens s where s.design_id = d.id
    );
  end if;
end $$;

-- 3. Remover as colunas de arquivo da tabela designs
alter table public.designs
  drop column if exists storage_path,
  drop column if exists thumbnail_path,
  drop column if exists file_type,
  drop column if exists file_size,
  drop column if exists width,
  drop column if exists height;
