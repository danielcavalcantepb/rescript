import { formatDateTime } from '#/lib/format'

export function Timeline({
  items,
}: {
  items: Array<{ at: string; label: string; by: string }>
}) {
  return (
    <ol className="space-y-4 border-l border-[var(--color-line)] pl-4">
      {items.map((item) => (
        <li key={`${item.at}-${item.label}`} className="relative">
          <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-ink)]">{item.label}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            {formatDateTime(item.at)} · {item.by}
          </p>
        </li>
      ))}
    </ol>
  )
}
