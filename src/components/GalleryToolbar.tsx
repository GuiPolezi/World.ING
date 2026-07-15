import type { Project } from '@/types/database'

export function GalleryToolbar({
  search,
  onSearch,
  projects,
  projectFilter,
  onProjectFilter,
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
}: {
  search: string
  onSearch: (v: string) => void
  projects: Project[]
  projectFilter: string
  onProjectFilter: (v: string) => void
  allTags: string[]
  selectedTags: string[]
  onToggleTag: (t: string) => void
  onClearTags: () => void
}) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por título…"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
        </div>

        <select
          value={projectFilter}
          onChange={(e) => onProjectFilter(e.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 sm:w-56"
        >
          <option value="all">Todos os projetos</option>
          <option value="none">Sem projeto</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ' +
                  (active
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-surface text-muted hover:border-ink/20 hover:text-ink')
                }
              >
                #{tag}
              </button>
            )
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={onClearTags}
              className="shrink-0 px-2 py-1 text-xs text-muted underline transition hover:text-ink"
            >
              limpar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
