import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { fileTypeFromName } from '@/lib/storage'
import { uploadDesign } from '@/lib/designs'
import type { Design } from '@/types/database'

export function UploadDialog({
  userId,
  onClose,
  onCreated,
}: {
  userId: string
  onClose: () => void
  onCreated: (design: Design) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const pickFile = (f: File | null) => {
    setError(null)
    if (!f) return
    if (!fileTypeFromName(f.name)) {
      setError('Formato não suportado. Use PNG, JPG, SVG ou PDF.')
      return
    }
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    pickFile(e.dataTransfer.files?.[0] ?? null)
  }

  const submit = async () => {
    if (!file) {
      setError('Selecione um arquivo.')
      return
    }
    const fileType = fileTypeFromName(file.name)
    if (!fileType) {
      setError('Formato não suportado.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const design = await uploadDesign({ userId, file, fileType, title, description, tags })
      onCreated(design)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload.')
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-base font-medium">Adicionar design</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted transition hover:text-ink"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ' +
              (dragOver ? 'border-accent bg-accent-soft/60' : 'border-line hover:border-ink/20')
            }
          >
            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div>
                <p className="font-medium text-ink">{file.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {(file.size / 1024).toFixed(0)} KB · clique para trocar
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-ink">
                  Arraste um arquivo ou clique para escolher
                </p>
                <p className="mt-1 text-xs text-muted">PNG, JPG, SVG ou PDF exportado do Figma</p>
              </div>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do design"
              className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Descrição <span className="text-muted/60">(opcional)</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Uma nota sobre esta tela"
              className="w-full resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Tags <span className="text-muted/60">(separadas por vírgula)</span>
            </span>
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="landing, mobile, v2"
              className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/20"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={busy || !file}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
          >
            {busy ? 'Enviando…' : 'Salvar design'}
          </button>
        </div>
      </div>
    </div>
  )
}
