import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useDesigns } from '@/hooks/useDesigns'
import type { DesignWithThumb } from '@/hooks/useDesigns'
import { Wordmark } from '@/components/Wordmark'
import { DesignCard } from '@/components/DesignCard'
import { UploadDialog } from '@/components/UploadDialog'
import { DesignViewer } from '@/components/DesignViewer'

export default function Home() {
  const { user, signOut } = useAuth()
  const { designs, loading, error, reload, setDesigns } = useDesigns(user?.id)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [active, setActive] = useState<DesignWithThumb | null>(null)

  const handleCreated = () => {
    setUploadOpen(false)
    reload()
  }

  const handleDeleted = (id: string) => {
    setActive(null)
    setDesigns((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Wordmark className="text-lg" />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
            <button
              onClick={signOut}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink transition hover:border-ink/20"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
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
            className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
          >
            Adicionar design
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-line bg-surface">
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
              +
            </div>
            <h2 className="font-display text-lg font-medium">Ainda não há designs</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Clique em “Adicionar design” e envie um frame exportado do Figma. Ele aparece aqui como
              um card na hora.
            </p>
          </div>
        )}

        {!loading && !error && designs.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((d) => (
              <DesignCard key={d.id} design={d} onOpen={() => setActive(d)} />
            ))}
          </div>
        )}
      </main>

      {uploadOpen && user && (
        <UploadDialog
          userId={user.id}
          onClose={() => setUploadOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {active && (
        <DesignViewer design={active} onClose={() => setActive(null)} onDeleted={handleDeleted} />
      )}
    </div>
  )
}
