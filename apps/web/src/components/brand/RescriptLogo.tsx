import { cn } from '#/lib/utils'

type LogoVariant =
  | 'wordmark'
  | 'mark'
  | 'sidebar'
  | 'sidebar-collapsed'
  | 'auth'
  | 'palette'

const WORDMARK = '/brand/rescript-wordmark.png'
const MARK = '/brand/mark.png'

/**
 * Official Rescript brand assets only — never reconstruct the wordmark in text.
 * Assets are transparent PNGs (no background plate).
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
        src={MARK}
        alt="Rescript"
        className={cn(
          variant === 'sidebar-collapsed' ? 'size-8' : 'size-5',
          'select-none object-contain',
          className,
        )}
        draggable={false}
      />
    )
  }

  if (variant === 'sidebar') {
    return (
      <img
        src={WORDMARK}
        alt="Rescript"
        className={cn(
          'block h-8 w-auto max-w-full select-none object-contain object-left',
          className,
        )}
        draggable={false}
      />
    )
  }

  const sizeClass =
    variant === 'auth' ? 'h-9 w-auto sm:h-10' : 'h-7 w-auto'

  return (
    <img
      src={WORDMARK}
      alt="Rescript"
      className={cn(
        sizeClass,
        'object-contain object-left select-none',
        className,
      )}
      draggable={false}
    />
  )
}
