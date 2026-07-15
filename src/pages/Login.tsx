import { useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Wordmark } from '@/components/Wordmark'
import { ThemeToggle } from '@/components/ThemeToggle'

type Mode = 'signin' | 'signup'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    setNotice(null)
    if (!email || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    setSubmitting(true)
    const fn = mode === 'signin' ? signIn : signUp
    const { error } = await fn(email, password)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    if (mode === 'signup') {
      setNotice('Conta criada. Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.')
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(var(--line)) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--line)) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at center, black 10%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at center, black 10%, transparent 70%)',
        }}
      />

      <div className="relative flex min-h-full items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 text-center">
            <Wordmark className="justify-center text-3xl" />
            <p className="mx-auto mt-3 max-w-[300px] text-sm leading-relaxed text-muted">
              Sua galeria de designs. Reúna, organize e revisite cada tela em um só lugar.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(23,24,26,0.04)]">
            <div className="mb-6 flex gap-1 rounded-xl bg-canvas p-1">
              <TabButton active={mode === 'signin'} onClick={() => setMode('signin')}>
                Entrar
              </TabButton>
              <TabButton active={mode === 'signup'} onClick={() => setMode('signup')}>
                Criar conta
              </TabButton>
            </div>

            <div className="space-y-4">
              <Field
                label="E-mail"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="voce@exemplo.com"
                autoComplete="email"
              />
              <Field
                label="Senha"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                onEnter={handleSubmit}
              />

              {error && <p className="text-sm text-red-600">{error}</p>}
              {notice && <p className="text-sm text-accent">{notice}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-2 w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-canvas transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? 'Um instante…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Acesso privado. Só você vê os seus designs.
          </p>
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ' +
        (active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')
      }
    >
      {children}
    </button>
  )
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  onEnter,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  onEnter?: () => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) onEnter()
        }}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10"
      />
    </label>
  )
}
