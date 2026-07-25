import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '#/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-[var(--color-canvas)] text-[var(--color-ink-muted)]',
        accent: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]',
        success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
        warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
        danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
        info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
