import * as React from 'react'
import { cn } from '#/lib/utils'

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)]',
        className,
      )}
      {...props}
    />
  )
}
