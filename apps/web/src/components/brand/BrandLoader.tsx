import { cn } from '#/lib/utils'

/**
 * Brand loading state — three-bar mark with calm opacity stagger.
 */
export function BrandLoader({
  className,
  label = 'Carregando…',
  showLabel = true,
}: {
  className?: string
  label?: string
  showLabel?: boolean
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-4', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        viewBox="0 0 32 32"
        className="size-8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {[7, 14.9, 22.8].map((y, index) => (
          <rect
            key={y}
            x="4"
            y={y}
            width="24"
            height="2.2"
            rx="1.1"
            fill="var(--color-primary)"
            className="brand-bar"
            style={{ animationDelay: `${index * 80}ms` }}
          />
        ))}
      </svg>
      {showLabel ? (
        <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
      ) : null}
    </div>
  )
}
