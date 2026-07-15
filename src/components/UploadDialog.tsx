import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { fileTypeFromName } from '@/lib/storage'
import { createDesign } from '@/lib/designs'
import { createProject } from '@/lib/projects'
import type { Design, Project } from '@/types/database'

const inputClass =
  'w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10'

export function UploadDialog({
  userId,
  projects,
  defaultProjectId,
  onClose,
  onCreated,
}: {
  userId: string
  projects: Project[]
  defaultProjectId: string | null
  onClose: () => void
  onCreated: (design: Design) => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [projectChoice, setProjectChoice] = useState<string>(defaultProjectId ?? 'none')
  const [newProjectName, setNewProjectName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (list: FileList | null) => {
    setError(null)
    if (!list || list.length === 0) return
    const incoming = Array.from(list)
    const invalid = incoming.find((f) => !fileTypeFromName(f.name))
    if (invalid) {
      setError(`Formato não suportado: ${invalid.name}. Use PNG, JPG, SVG ou PDF.`)
      return
    }
    setFiles((prev) => {
      const next = [...prev, ...incoming]
      if (!title && next[0]) setTitle(next[0].name.replace(/\.[^.]+$/, ''))
      return next
    })
  }

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i))

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const submit = async () => {
    if (files.length === 0) {
      setError('Adicione ao menos uma tela.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      let projectId: string | null = null
      if (projectChoice === 'new') {
        if (!newProjectName.trim()) throw new Error('Dê um nome ao novo projeto.')
        const project = await createProject(userId, newProjectName)
        projectId = project.id
      } else if (projectChoice !== 'none') {
        projectId = projectChoice
      }

      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const design = await createDesign(
        { userId, projectId, title, description, tags, files },
        (p) => setProgress(p),
      )
      onCreated(design)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload.')
      setBusy(false)
      setProgress(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-base font-medium">Adicionar design</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted transition hover:text-ink"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-5">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ' +
              (dragOver ? 'border-accent bg-accent-soft/60' : 'border-line hover:border-ink/20')
            }
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.svg,.pdf"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <p className="text-sm font-medium text-ink">
              Arraste as telas ou clique para escolher
            </p>
            <p className="mt-1 text-xs text-muted">
              Uma ou várias — PNG, JPG, SVG ou PDF exportados do Figma
            </p>
          </div>

          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-soft text-[10px] font-medium text-accent">
                      {i + 1}
                    </span>
                    <span className="truncate text-ink">{f.name}</span>
                  </span>
                  <button
                    onClick={() => removeFile(i)}
                    className="shrink-0 text-xs text-muted transition hover:text-red-600"
                    aria-label={`Remover ${f.name}`}
                  >
                    remover
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do design"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Projeto</span>
            <select
              value={projectChoice}
              onChange={(e) => setProjectChoice(e.target.value)}
              className={inputClass}
            >
              <option value="none">Sem projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="new">＋ Novo projeto…</option>
            </select>
          </label>

          {projectChoice === 'new' && (
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Nome do novo projeto"
              className={inputClass}
              autoFocus
            />
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Descrição <span className="text-muted/60">(opcional)</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Uma nota sobre este design"
              className={inputClass + ' resize-none'}
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
              className={inputClass}
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-line px-5 py-4">
          <span className="text-xs text-muted">
            {progress
              ? `Enviando tela ${progress.done} de ${progress.total}…`
              : files.length > 0
                ? `${files.length} ${files.length === 1 ? 'tela' : 'telas'}`
                : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/20"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={busy || files.length === 0}
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? 'Enviando…' : 'Salvar design'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
