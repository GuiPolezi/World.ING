import type { DesignFull } from '@/hooks/useGallery'

export function DesignCard({
  design,
  onOpen,
}: {
  design: DesignFull
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:border-ink/15 hover:shadow-[0_4px_20px_rgba(23,24,26,0.06)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-canvas">
        {design.coverThumbUrl ? (
          <img
            src={design.coverThumbUrl}
            alt={design.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            sem prévia
          </div>
        )}

        {design.screenCount > 1 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-scrim/80 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1.5" y="1.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M4.5 12.5H11a1.5 1.5 0 0 0 1.5-1.5V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {design.screenCount}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 px-4 py-3">
        <h3 className="truncate font-display text-sm font-medium text-ink">{design.title}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="shrink-0 text-xs text-muted">
            {new Date(design.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          {design.tags.length > 0 && (
            <p className="truncate text-xs text-accent">
              {design.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}
              {design.tags.length > 2 ? ' …' : ''}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
