import { cn } from '#/lib/utils'

type MarkVariant = 'gradient' | 'solid' | 'muted'

/**
 * Exclusive Rescript symbol: the three-bar "E" from the official wordmark.
 * Never use as a generic menu/hamburger icon.
 */
export function RescriptMark({
  className,
  variant = 'solid',
  title = 'Rescript',
}: {
  className?: string
  variant?: MarkVariant
  title?: string
}) {
  const fill =
    variant === 'muted'
      ? 'var(--color-muted)'
      : variant === 'solid'
        ? 'var(--color-primary)'
        : undefined

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-6', className)}
      role="img"
      aria-label={title}
    >
      {variant === 'gradient' ? (
        <defs>
          <linearGradient id="rs-mark-g" x1="0" y1="16" x2="32" y2="16">
            <stop offset="0%" stopColor="var(--brand-from)" />
            <stop offset="48%" stopColor="var(--brand-via)" />
            <stop offset="100%" stopColor="var(--brand-to)" />
          </linearGradient>
        </defs>
      ) : null}
      {[7, 14.9, 22.8].map((y) => (
        <rect
          key={y}
          x="4"
          y={y}
          width="24"
          height="2.2"
          rx="1.1"
          fill={variant === 'gradient' ? 'url(#rs-mark-g)' : fill}
        />
      ))}
    </svg>
  )
}
