import { initials } from '#/lib/format'
import { cn } from '#/lib/utils'

export function EntityAvatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-xs font-medium text-[var(--color-accent)]',
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  )
}
