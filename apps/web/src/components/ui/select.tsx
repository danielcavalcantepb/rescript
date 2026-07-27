import * as React from 'react'
import { cn } from '#/lib/utils'

/** Native select styled to match Input. */
export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'flex h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-ink)]',
        'shadow-[var(--shadow-sm)]',
        'transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)]',
        'hover:border-[var(--color-primary)]/35',
        'focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/25',
        'aria-invalid:border-[var(--color-danger)] aria-invalid:ring-[var(--color-danger)]/20',
        'disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
