import { cn } from '#/lib/utils'

export function MetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string
  hint?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3.5 py-2.5',
        className,
      )}
    >
      <p className="text-[11px] font-medium tracking-wide text-[var(--color-muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg leading-none font-medium tracking-tight tabular-nums text-[var(--color-ink)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] leading-tight text-[var(--color-text-secondary)]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
