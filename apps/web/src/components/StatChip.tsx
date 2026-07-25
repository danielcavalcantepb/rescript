import { cn } from '#/lib/utils'

export function StatChip({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-baseline gap-2 rounded-[var(--radius-md)] bg-[var(--color-canvas)] px-3 py-2',
        className,
      )}
    >
      <span className="text-xs text-[var(--color-ink-muted)]">{label}</span>
      <span className="font-mono text-sm tabular-nums text-[var(--color-ink)]">{value}</span>
    </div>
  )
}
