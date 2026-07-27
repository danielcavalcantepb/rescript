import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '#/lib/utils'

/**
 * Shared form field — one label/error rhythm for all module forms.
 * Injects `id` / `aria-describedby` / `aria-invalid` into a single control child.
 */
export function FormField({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string
  children: ReactNode
  className?: string
}) {
  const id = useId()
  const errorId = `${id}-error`

  const control = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    const el = child as ReactElement<Record<string, unknown>>
    return cloneElement(el, {
      id: (el.props.id as string | undefined) ?? id,
      'aria-invalid': Boolean(error) || Boolean(el.props['aria-invalid']),
      'aria-describedby': error
        ? errorId
        : (el.props['aria-describedby'] as string | undefined),
    })
  })

  return (
    <div className={cn('min-w-0', className)}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink)]"
      >
        {label}
      </label>
      {control}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs text-[var(--color-danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
