import { Link } from '@tanstack/react-router'
import { icons } from '#/platform/icons/catalog'

export function AppBreadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>
}) {
  if (items.length < 2) return null
  const ChevronRight = icons.chevronRight
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="size-3.5 text-[var(--color-ink-muted)]" />
            ) : null}
            {last || !item.href ? (
              <span className="text-[var(--color-ink-muted)]">{item.label}</span>
            ) : (
              <Link
                to={item.href as '/'}
                className="text-[var(--color-accent)] hover:underline"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
