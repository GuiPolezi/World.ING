import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useGallery } from '@/hooks/useGallery'
import type { DesignFull } from '@/hooks/useGallery'
import { Wordmark } from '@/components/Wordmark'
import { DesignCard } from '@/components/DesignCard'
import { UploadDialog } from '@/components/UploadDialog'
import { DesignViewer } from '@/components/DesignViewer'
import { EditDesignDialog } from '@/components/EditDesignDialog'
import { GalleryToolbar } from '@/components/GalleryToolbar'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Home() {
  const { user, signOut } = useAuth()
  const { projects, designs, loading, error, reload, setDesigns } = useGallery(user?.id)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [active, setActive] = useState<DesignFull | null>(null)
  const [editing, setEditing] = useState<DesignFull | null>(null)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Mantém o design aberto no visualizador em sincronia após recarregar
  // (por exemplo, depois de uma edição). Fecha se ele deixou de existir.
  useEffect(() => {
    if (!active) return
    const fresh = designs.find((d) => d.id === active.id)
    if (fresh !== active) setActive(fresh ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designs])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    designs.forEach((d) => d.tags.forEach((t) => set.add(t)))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [designs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return designs.filter((d) => {
      if (projectFilter === 'none' && d.project_id !== null) return false
      if (projectFilter !== 'all' && projectFilter !== 'none' && d.project_id !== projectFilter)
        return false
      if (q && !d.title.toLowerCase().includes(q)) return false
      if (selectedTags.length > 0 && !selectedTags.some((t) => d.tags.includes(t))) return false
      return true
    })
  }, [designs, search, projectFilter, selectedTags])

  const projectName = (id: string | null) =>
    id ? (projects.find((p) => p.id === id)?.name ?? null) : null

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const handleCreated = () => {
    setUploadOpen(false)
    reload()
  }

  const handleDeleted = (id: string) => {
    setActive(null)
    setDesigns((prev) => prev.filter((d) => d.id !== id))
  }

  // Agrupa por projeto quando o filtro é "todos".
  const groups = useMemo(() => {
    if (projectFilter !== 'all') return null
    const result: { key: string; name: string; items: DesignFull[] }[] = []
    for (const p of projects) {
      const items = filtered.filter((d) => d.project_id === p.id)
      if (items.length > 0) result.push({ key: p.id, name: p.name, items })
    }
    const orphan = filtered.filter((d) => d.project_id === null)
    if (orphan.length > 0) result.push({ key: 'none', name: 'Sem projeto', items: orphan })
    return result
  }, [projectFilter, projects, filtered])

  const hasFilters = search.trim() !== '' || projectFilter !== 'all' || selectedTags.length > 0

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Wordmark className="text-lg" />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
            <ThemeToggle />
            <Link
              to="/settings"
              aria-label="Configurações"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink transition hover:border-ink/20"
            >
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M10 1.8v1.6M10 16.6v1.6M3.8 3.8l1.15 1.15M15.05 15.05l1.15 1.15M1.8 10h1.6M16.6 10h1.6M3.8 16.2l1.15-1.15M15.05 4.95l1.15-1.15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            <button
              onClick={signOut}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink transition hover:border-ink/20"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Seus designs</h1>
            <p className="mt-1 text-sm text-muted">
              {designs.length > 0
                ? `${designs.length} ${designs.length === 1 ? 'design' : 'designs'} na sua galeria.`
                : 'Tudo o que você exportou do Figma, em um só lugar.'}
            </p>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition hover:opacity-90"
          >
            <span className="sm:hidden">＋</span>
            <span className="hidden sm:inline">Adicionar design</span>
          </button>
        </div>

        {!loading && !error && designs.length > 0 && (
          <GalleryToolbar
            search={search}
            onSearch={setSearch}
            projects={projects}
            projectFilter={projectFilter}
            onProjectFilter={setProjectFilter}
            allTags={allTags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onClearTags={() => setSelectedTags([])}
          />
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-line bg-surface"
              >
                <div className="aspect-[4/3] w-full bg-canvas" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-2/3 rounded bg-line" />
                  <div className="h-2 w-1/3 rounded bg-line" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm text-red-700">Não foi possível carregar seus designs: {error}</p>
            <button
              onClick={reload}
              className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {!loading && !error && designs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-lg text-accent">
              ＋
            </div>
            <h2 className="font-display text-lg font-medium">Ainda não há designs</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Clique em “Adicionar design” e envie uma ou várias telas exportadas do Figma. Elas
              aparecem aqui como um card, navegável em slider.
            </p>
          </div>
        )}

        {!loading && !error && designs.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
            <h2 className="font-display text-lg font-medium">Nenhum resultado</h2>
            <p className="mt-1 text-sm text-muted">
              Nenhum design corresponde aos filtros atuais.
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch('')
                  setProjectFilter('all')
                  setSelectedTags([])
                }}
                className="mt-4 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-ink/20"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          groups ? (
            <div className="space-y-10">
              {groups.map((g) => (
                <section key={g.key}>
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="font-display text-sm font-medium text-ink">{g.name}</h2>
                    <span className="text-xs text-muted">{g.items.length}</span>
                    <div className="h-px flex-1 bg-line" />
                  </div>
                  <Grid designs={g.items} onOpen={setActive} />
                </section>
              ))}
            </div>
          ) : (
            <Grid designs={filtered} onOpen={setActive} />
          )
        )}
      </main>

      {uploadOpen && user && (
        <UploadDialog
          userId={user.id}
          projects={projects}
          defaultProjectId={
            projectFilter !== 'all' && projectFilter !== 'none' ? projectFilter : null
          }
          onClose={() => setUploadOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {active && (
        <DesignViewer
          design={active}
          projectName={projectName(active.project_id)}
          onClose={() => setActive(null)}
          onEdit={() => setEditing(active)}
          onDeleted={handleDeleted}
        />
      )}

      {editing && user && (
        <EditDesignDialog
          userId={user.id}
          design={editing}
          projects={projects}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

function Grid({
  designs,
  onOpen,
}: {
  designs: DesignFull[]
  onOpen: (d: DesignFull) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {designs.map((d) => (
        <DesignCard key={d.id} design={d} onOpen={() => onOpen(d)} />
      ))}
    </div>
  )
}
