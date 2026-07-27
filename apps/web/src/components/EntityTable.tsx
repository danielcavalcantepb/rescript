import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '#/lib/utils'

export function EntityTable({
  headers,
  children,
  className,
}: {
  headers: string[]
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-alt)]/60">
            {headers.map((header) => (
              <th
                key={header}
                className="px-3.5 py-2.5 text-[11px] font-medium tracking-wide text-[var(--color-muted)] uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function EntityRow({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (!onClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <tr
      className={cn(
        'border-b border-[var(--color-border-soft)] last:border-0',
        onClick &&
          'cursor-pointer transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)] hover:bg-[var(--color-hover)] focus-visible:bg-[var(--color-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus)]',
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'link' : undefined}
    >
      {children}
    </tr>
  )
}

export function EntityCell({
  children,
  className,
  mono,
}: {
  children: ReactNode
  className?: string
  mono?: boolean
}) {
  return (
    <td
      className={cn(
        'px-3.5 py-2.5 text-[var(--color-ink)]',
        mono && 'font-mono tabular-nums',
        className,
      )}
    >
      {children}
    </td>
  )
}
