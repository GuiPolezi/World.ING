import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className={
        'flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink transition hover:border-ink/20 ' +
        className
      }
    >
      <span className="relative block h-[18px] w-[18px]">
        {/* Sol */}
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={
            'absolute inset-0 h-full w-full transition-all duration-300 ' +
            (isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0')
          }
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 1.8v2M10 16.2v2M3.1 3.1l1.4 1.4M15.5 15.5l1.4 1.4M1.8 10h2M16.2 10h2M3.1 16.9l1.4-1.4M15.5 4.5l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {/* Lua */}
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={
            'absolute inset-0 h-full w-full transition-all duration-300 ' +
            (isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100')
          }
          aria-hidden="true"
        >
          <path
            d="M16.5 11.8A6.8 6.8 0 0 1 8.2 3.5a6.8 6.8 0 1 0 8.3 8.3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )
}
