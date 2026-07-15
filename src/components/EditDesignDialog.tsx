import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { fileTypeFromName } from '@/lib/storage'
import { saveDesignEdits } from '@/lib/designs'
import type { FinalScreen } from '@/lib/designs'
import { createProject } from '@/lib/projects'
import type { DesignFull, ScreenWithUrl } from '@/hooks/useGallery'
import type { Project } from '@/types/database'

const inputClass =
  'w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10'

type Item =
  | { key: string; kind: 'existing'; screen: ScreenWithUrl }
  | { key: string; kind: 'new'; file: File; url: string }

export function EditDesignDialog({
  userId,
  design,
  projects,
  onClose,
  onSaved,
}: {
  userId: string
  design: DesignFull
  projects: Project[]
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(design.title)
  const [description, setDescription] = useState(design.description ?? '')
  const [tagsText, setTagsText] = useState(design.tags.join(', '))
  const [projectChoice, setProjectChoice] = useState<string>(design.project_id ?? 'none')
  const [newProjectName, setNewProjectName] = useState('')
  const [items, setItems] = useState<Item[]>(() =>
    design.screens.map((s) => ({ key: s.id, kind: 'existing', screen: s })),
  )
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Revoga as URLs de preview dos arquivos novos ao desmontar.
  useEffect(() => {
    return () => {
      items.forEach((it) => {
        if (it.kind === 'new') URL.revokeObjectURL(it.url)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addFiles = (list: FileList | null) => {
    setError(null)
    if (!list || list.length === 0) return
    const incoming = Array.from(list)
    const invalid = incoming.find((f) => !fileTypeFromName(f.name))
    if (invalid) {
      setError(`Formato não suportado: ${invalid.name}. Use PNG, JPG, SVG ou PDF.`)
      return
    }
    setItems((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        key: `new-${crypto.randomUUID()}`,
        kind: 'new' as const,
        file,
        url: URL.createObjectURL(file),
      })),
    ])
  }

  const removeItem = (key: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.key === key)
      if (target && target.kind === 'new') URL.revokeObjectURL(target.url)
      return prev.filter((it) => it.key !== key)
    })
  }

  const move = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev]
      const j = index + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const save = async () => {
    if (items.length === 0) {
      setError('O design precisa de ao menos uma tela.')
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

      const finalOrder: FinalScreen[] = items.map((it) =>
        it.kind === 'existing'
          ? { type: 'existing', id: it.screen.id }
          : { type: 'new', file: it.file },
      )

      await saveDesignEdits({
        userId,
        designId: design.id,
        title,
        description,
        tags,
        projectId,
        originalScreens: design.screens.map((s) => ({
          id: s.id,
          storage_path: s.storage_path,
          thumbnail_path: s.thumbnail_path,
        })),
        finalOrder,
      })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-scrim/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-base font-medium">Editar design</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted transition hover:text-ink"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Título</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
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

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">
                Telas <span className="text-muted/60">({items.length})</span>
              </span>
              <span className="text-xs text-muted/60">a 1ª tela é a capa</span>
            </div>

            <div className="space-y-2">
              {items.map((it, i) => (
                <div
                  key={it.key}
                  className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-2"
                >
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
                    {it.kind === 'existing' ? (
                      it.screen.thumbUrl ? (
                        <img src={it.screen.thumbUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                          {it.screen.file_type}
                        </span>
                      )
                    ) : (
                      <img src={it.url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>

                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {i === 0 && (
                      <span className="mr-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                        capa
                      </span>
                    )}
                    {it.kind === 'new' ? it.file.name : `Tela ${i + 1}`}
                  </span>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Mover para cima"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-ink disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1}
                      aria-label="Mover para baixo"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-ink disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeItem(it.key)}
                      aria-label="Remover tela"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={
                'mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center text-sm transition ' +
                (dragOver
                  ? 'border-accent bg-accent-soft/60 text-accent'
                  : 'border-line text-muted hover:border-ink/20')
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
              ＋ Adicionar telas
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/20"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </footer>
      </div>
    </div>
  )
}
