import type { ReactNode } from 'react'

export function CatalogToolbar({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-medium tracking-tight text-[var(--color-ink)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
