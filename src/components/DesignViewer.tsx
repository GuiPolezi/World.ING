import { useEffect, useState } from 'react'
import type { Design } from '@/types/database'
import { signedUrl } from '@/lib/storage'
import { deleteDesign } from '@/lib/designs'

export function DesignViewer({
  design,
  onClose,
  onDeleted,
}: {
  design: Design
  onClose: () => void
  onDeleted: (id: string) => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    signedUrl(design.storage_path)
      .then((u) => {
        if (active) {
          setUrl(u)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar o arquivo.')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [design.storage_path])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleDelete = async () => {
    if (!window.confirm('Excluir este design? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    try {
      await deleteDesign(design)
      onDeleted(design.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir.')
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-medium">{design.title}</h2>
            {design.description && (
              <p className="truncate text-xs text-muted">{design.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-ink/20"
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
        </div>

        <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-auto bg-canvas p-4">
          {loading && <span className="text-sm text-muted">Carregando…</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
          {!loading &&
            !error &&
            url &&
            (design.file_type === 'pdf' ? (
              <iframe
                title={design.title}
                src={url}
                className="h-[75vh] w-full rounded-lg border border-line bg-white"
              />
            ) : (
              <img
                src={url}
                alt={design.title}
                className="max-h-[75vh] max-w-full rounded-lg object-contain"
              />
            ))}
        </div>
      </div>
    </div>
  )
}
