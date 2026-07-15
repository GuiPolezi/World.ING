import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DesignFull } from '@/hooks/useGallery'
import { signedUrls } from '@/lib/storage'
import { deleteDesign } from '@/lib/designs'

export function DesignViewer({
  design,
  projectName,
  onClose,
  onDeleted,
}: {
  design: DesignFull
  projectName: string | null
  onClose: () => void
  onDeleted: (id: string) => void
}) {
  const screens = design.screens
  const [index, setIndex] = useState(0)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const current = screens[index]
  const total = screens.length

  const go = useCallback(
    (dir: number) => {
      if (total <= 1) return
      setIndex((i) => (i + dir + total) % total)
    },
    [total],
  )

  // Carrega as signed URLs dos originais de todas as telas ao abrir.
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    const paths = screens.map((s) => s.storage_path)
    signedUrls(paths)
      .then((map) => {
        if (active) {
          setUrls(map)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar os arquivos.')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [screens])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, go])

  const currentUrl = current ? (urls[current.storage_path] ?? null) : null

  const meta = useMemo(() => {
    const parts: string[] = []
    if (projectName) parts.push(projectName)
    if (total > 1) parts.push(`${total} telas`)
    return parts.join(' · ')
  }, [projectName, total])

  const handleDelete = async () => {
    if (!window.confirm('Excluir este design e todas as suas telas? Esta ação não pode ser desfeita.'))
      return
    setDeleting(true)
    try {
      await deleteDesign(design.id)
      onDeleted(design.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir.')
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-medium">{design.title}</h2>
            {(meta || design.description) && (
              <p className="truncate text-xs text-muted">
                {meta}
                {meta && design.description ? ' — ' : ''}
                {design.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {currentUrl && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-ink/20 sm:inline"
              >
                Abrir
              </a>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-300 disabled:opacity-60"
            >
              {deleting ? 'Excluindo…' : 'Excluir'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1.5 text-sm text-muted transition hover:text-ink"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-auto bg-canvas p-4">
          {loading && <span className="text-sm text-muted">Carregando…</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
          {!loading && !error && current && currentUrl && (
            current.file_type === 'pdf' ? (
              <iframe
                title={`${design.title} — tela ${index + 1}`}
                src={currentUrl}
                className="h-[70vh] w-full rounded-lg border border-line bg-white"
              />
            ) : (
              <img
                src={currentUrl}
                alt={`${design.title} — tela ${index + 1}`}
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
              />
            )
          )}

          {total > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                aria-label="Tela anterior"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/90 text-ink shadow-sm backdrop-blur transition hover:bg-surface"
              >
                ‹
              </button>
              <button
                onClick={() => go(1)}
                aria-label="Próxima tela"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/90 text-ink shadow-sm backdrop-blur transition hover:bg-surface"
              >
                ›
              </button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {index + 1} / {total}
              </span>
            </>
          )}
        </div>

        {total > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-line px-4 py-3 sm:px-5">
            {screens.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                className={
                  'relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-canvas transition ' +
                  (i === index ? 'border-accent' : 'border-transparent hover:border-line')
                }
                aria-label={`Ir para a tela ${i + 1}`}
              >
                {s.thumbUrl ? (
                  <img src={s.thumbUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                    {s.file_type}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
