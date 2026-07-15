export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div
      className={
        'flex items-baseline font-display font-bold tracking-tight text-ink ' + className
      }
    >
      <span>World</span>
      <span className="text-accent">.</span>
      <span>ING</span>
    </div>
  )
}
