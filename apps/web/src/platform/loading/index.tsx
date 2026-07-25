import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'
import { icons } from '#/platform/icons/catalog'

export function Spinner({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const Icon = icons.spinner
  const sizeClass =
    size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-6' : 'size-4'
  return (
    <Icon
      className={cn('animate-spin text-[var(--color-muted)]', sizeClass, className)}
      strokeWidth={1.5}
      aria-hidden
    />
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-border-soft)]',
        className,
      )}
    />
  )
}

export function PageLoading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
    </div>
  )
}

export function InlineLoading({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
      <Spinner size="sm" />
      {label}
    </span>
  )
}

export function ButtonLoading({ label = 'Aguarde…' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner size="sm" className="text-current" />
      {label}
    </span>
  )
}

export function CardLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  )
}

export function TableLoading({
  rows = 5,
  cols = 4,
}: {
  rows?: number
  cols?: number
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)]">
      <div className="grid gap-2 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-alt)] p-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-2/3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-2 border-b border-[var(--color-border-soft)] p-3 last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function LoadingSlot({
  loading,
  children,
  fallback,
}: {
  loading: boolean
  children: ReactNode
  fallback?: ReactNode
}) {
  if (loading) return <>{fallback ?? <PageLoading />}</>
  return <>{children}</>
}
