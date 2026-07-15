import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useProjectStats } from '@/hooks/useProjectStats'
import type { DesignRef } from '@/hooks/useProjectStats'
import { createProject, renameProject, deleteProject } from '@/lib/projects'
import { updateDesignProject } from '@/lib/designs'
import { Wordmark } from '@/components/Wordmark'
import type { Project } from '@/types/database'

const inputClass =
  'w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10'

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default function Settings() {
  const { user, updatePassword, signOut } = useAuth()
  const { projects, designs, countByProject, noProjectCount, totals, loading, error, reload } =
    useProjectStats(user?.id)

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted transition hover:text-ink">
            <span aria-hidden="true">‹</span> Galeria
          </Link>
          <Wordmark className="text-base" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="mt-1 text-sm text-muted">Gerencie projetos, sua conta e o armazenamento.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <ProjectsSection
          userId={user?.id}
          projects={projects}
          countByProject={countByProject}
          noProjectCount={noProjectCount}
          loading={loading}
          onChanged={reload}
        />

        <DesignsSection
          designs={designs}
          projects={projects}
          loading={loading}
          onChanged={reload}
        />

        <StorageSection totals={totals} />

        <AccountSection
          email={user?.email ?? ''}
          onUpdatePassword={updatePassword}
          onSignOut={signOut}
        />
      </main>
    </div>
  )
}

/* ---------------- Projetos ---------------- */

function ProjectsSection({
  userId,
  projects,
  countByProject,
  noProjectCount,
  loading,
  onChanged,
}: {
  userId: string | undefined
  projects: Project[]
  countByProject: Record<string, number>
  noProjectCount: number
  loading: boolean
  onChanged: () => Promise<void>
}) {
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!userId || !newName.trim()) return
    setBusy(true)
    setError(null)
    try {
      await createProject(userId, newName)
      setNewName('')
      await onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar o projeto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Projetos" description="Agrupe seus designs. Ao excluir um projeto, seus designs voltam para “Sem projeto”.">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
          }}
          placeholder="Nome do novo projeto"
          className={inputClass}
        />
        <button
          onClick={handleCreate}
          disabled={busy || !newName.trim()}
          className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
        >
          Criar
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 divide-y divide-line">
        {loading && <p className="py-3 text-sm text-muted">Carregando…</p>}

        {!loading && projects.length === 0 && (
          <p className="py-3 text-sm text-muted">Nenhum projeto ainda.</p>
        )}

        {!loading &&
          projects.map((p) => (
            <ProjectRow
              key={p.id}
              project={p}
              count={countByProject[p.id] ?? 0}
              onChanged={onChanged}
            />
          ))}

        {!loading && (projects.length > 0 || noProjectCount > 0) && (
          <div className="flex items-center justify-between py-3 text-sm text-muted">
            <span>Sem projeto</span>
            <span>{noProjectCount} {noProjectCount === 1 ? 'design' : 'designs'}</span>
          </div>
        )}
      </div>
    </Section>
  )
}

function ProjectRow({
  project,
  count,
  onChanged,
}: {
  project: Project
  count: number
  onChanged: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(project.name)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!name.trim() || name.trim() === project.name) {
      setEditing(false)
      setName(project.name)
      return
    }
    setBusy(true)
    try {
      await renameProject(project.id, name)
      setEditing(false)
      await onChanged()
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (
      !window.confirm(
        `Excluir o projeto “${project.name}”? Os designs dele voltam para “Sem projeto”.`,
      )
    )
      return
    setBusy(true)
    try {
      await deleteProject(project.id)
      await onChanged()
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') {
              setEditing(false)
              setName(project.name)
            }
          }}
          autoFocus
          className={inputClass}
        />
        <button
          onClick={save}
          disabled={busy}
          className="shrink-0 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
        >
          Salvar
        </button>
        <button
          onClick={() => {
            setEditing(false)
            setName(project.name)
          }}
          className="shrink-0 rounded-lg px-2 py-2 text-sm text-muted transition hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{project.name}</p>
        <p className="text-xs text-muted">{count} {count === 1 ? 'design' : 'designs'}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => setEditing(true)}
          disabled={busy}
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-ink/20 disabled:opacity-60"
        >
          Renomear
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-300 disabled:opacity-60"
        >
          Excluir
        </button>
      </div>
    </div>
  )
}

/* ---------------- Designs: trocar de projeto ---------------- */

function DesignsSection({
  designs,
  projects,
  loading,
  onChanged,
}: {
  designs: DesignRef[]
  projects: Project[]
  loading: boolean
  onChanged: () => Promise<void>
}) {
  return (
    <Section
      title="Designs"
      description="Mova um design de projeto. Para editar título, telas e mais, use “Editar” ao abrir o design."
    >
      <div className="divide-y divide-line">
        {loading && <p className="py-3 text-sm text-muted">Carregando…</p>}

        {!loading && designs.length === 0 && (
          <p className="py-3 text-sm text-muted">Nenhum design ainda.</p>
        )}

        {!loading &&
          designs.map((d) => (
            <DesignProjectRow key={d.id} design={d} projects={projects} onChanged={onChanged} />
          ))}
      </div>
    </Section>
  )
}

function DesignProjectRow({
  design,
  projects,
  onChanged,
}: {
  design: DesignRef
  projects: Project[]
  onChanged: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)

  const change = async (value: string) => {
    setBusy(true)
    try {
      await updateDesignProject(design.id, value === 'none' ? null : value)
      await onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{design.title}</p>
      <select
        value={design.project_id ?? 'none'}
        onChange={(e) => change(e.target.value)}
        disabled={busy}
        className="shrink-0 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm outline-none transition focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10 disabled:opacity-60 sm:w-48"
      >
        <option value="none">Sem projeto</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  )
}

/* ---------------- Armazenamento ---------------- */

function StorageSection({ totals }: { totals: { projects: number; designs: number; screens: number; bytes: number } }) {
  const stats = [
    { label: 'Projetos', value: String(totals.projects) },
    { label: 'Designs', value: String(totals.designs) },
    { label: 'Telas', value: String(totals.screens) },
    { label: 'Armazenamento', value: formatBytes(totals.bytes) },
  ]
  return (
    <Section title="Armazenamento" description="Visão geral do que há na sua galeria.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-canvas px-4 py-3">
            <p className="font-display text-xl font-semibold text-ink">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ---------------- Conta ---------------- */

function AccountSection({
  email,
  onUpdatePassword,
  onSignOut,
}: {
  email: string
  onUpdatePassword: (password: string) => Promise<{ error: string | null }>
  onSignOut: () => Promise<void>
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const submit = async () => {
    setMsg(null)
    if (password.length < 6) {
      setMsg({ type: 'err', text: 'A senha deve ter ao menos 6 caracteres.' })
      return
    }
    if (password !== confirm) {
      setMsg({ type: 'err', text: 'As senhas não coincidem.' })
      return
    }
    setBusy(true)
    const { error } = await onUpdatePassword(password)
    setBusy(false)
    if (error) {
      setMsg({ type: 'err', text: error })
      return
    }
    setPassword('')
    setConfirm('')
    setMsg({ type: 'ok', text: 'Senha atualizada.' })
  }

  return (
    <Section title="Conta" description="Seus dados de acesso.">
      <div className="space-y-4">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">E-mail</span>
          <div className="rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink">
            {email}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Nova senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Confirmar senha</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
        </div>

        {msg && (
          <p className={'text-sm ' + (msg.type === 'ok' ? 'text-accent' : 'text-red-600')}>
            {msg.text}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            onClick={submit}
            disabled={busy || !password || !confirm}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
          >
            {busy ? 'Atualizando…' : 'Atualizar senha'}
          </button>
          <button
            onClick={onSignOut}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/20"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </Section>
  )
}

/* ---------------- Wrapper de seção ---------------- */

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-base font-medium text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}
