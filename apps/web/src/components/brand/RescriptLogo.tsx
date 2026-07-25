import { cn } from '#/lib/utils'

type LogoVariant =
  | 'wordmark'
  | 'mark'
  | 'sidebar'
  | 'sidebar-collapsed'
  | 'auth'
  | 'palette'

/**
 * Official Rescript brand assets only — never reconstruct the wordmark in text.
 */
export function RescriptLogo({
  variant = 'wordmark',
  className,
}: {
  variant?: LogoVariant
  className?: string
}) {
  if (
    variant === 'mark' ||
    variant === 'sidebar-collapsed' ||
    variant === 'palette'
  ) {
    return (
      <img
        src="/brand/mark.svg"
        alt="Rescript"
        className={cn(
          variant === 'sidebar-collapsed' ? 'size-8' : 'size-5',
          'select-none',
          className,
        )}
        draggable={false}
      />
    )
  }

  // Sidebar: prominent but balanced — readable without eating the nav.
  if (variant === 'sidebar') {
    return (
      <img
        src="/brand/rescript-wordmark.png"
        alt="Rescript"
        className={cn('block h-9 w-auto max-w-full select-none', className)}
        draggable={false}
      />
    )
  }

  const sizeClass = variant === 'auth' ? 'h-10 w-auto' : 'h-7 w-auto'

  return (
    <img
      src="/brand/rescript-wordmark.png"
      alt="Rescript"
      className={cn(sizeClass, 'object-contain object-left select-none', className)}
      draggable={false}
    />
  )
}
