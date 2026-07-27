import { cn } from '#/lib/utils'

/**
 * Shared filter / segment chip — one visual language for all list screens.
 */
export function FilterChip({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium',
        'transition-[color,background-color,border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]',
        selected
          ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]'
          : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-ink)]',
      )}
    >
      {label}
    </button>
  )
}
