import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

export function DataCard({
  title,
  children,
  className,
  action,
}: {
  title?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5',
        className,
      )}
    >
      {title || action ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          {title ? (
            <h2 className="text-sm font-medium text-[var(--color-ink)]">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}
