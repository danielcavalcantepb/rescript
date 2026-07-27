import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

/**
 * Home block shell — the single surface primitive for the operational
 * workspace. Every block is an independent unit that composes into the Home
 * grid; new blocks reuse this shell without touching the page layout.
 */
export function HomeBlock({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: string
  hint?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 md:p-5',
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-medium tracking-tight text-[var(--color-ink)]">
            {title}
          </h2>
          {hint ? (
            <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
              {hint}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  )
}

/**
 * Compact, honest empty state used inside blocks while a data source is not
 * yet available. No fabricated data — just a calm, branded placeholder.
 */
export function BlockEmpty({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-5 py-8 text-center">
      <span
        className="size-1.5 rounded-full bg-[var(--color-success)]"
        aria-hidden
      />
      <p className="mt-3 text-[13px] font-medium text-[var(--color-ink)]">
        {title}
      </p>
      <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
        {description}
      </p>
    </div>
  )
}
