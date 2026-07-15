import { useAuth } from '@/context/AuthContext'
import { Wordmark } from '@/components/Wordmark'

export default function Home() {
  const { user, signOut } = useAuth()

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
              Tudo o que você exportou do Figma, em um só lugar.
            </p>
          </div>
          <button
            className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white opacity-60 transition"
            disabled
            title="Disponível no próximo passo"
          >
            Adicionar design
          </button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-lg text-accent">
            ◳
          </div>
          <h2 className="font-display text-lg font-medium">Ainda não há designs</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Quando o upload estiver ativo, seus frames do Figma aparecerão aqui como um grid de
            cards.
          </p>
        </div>
      </main>
    </div>
  )
}
