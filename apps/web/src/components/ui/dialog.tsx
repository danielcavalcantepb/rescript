import * as DialogPrimitive from '@radix-ui/react-dialog'
import type * as React from 'react'
import { cn } from '#/lib/utils'
import { icons } from '#/platform/icons/catalog'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

const sizeClass = {
  sm: 'w-[min(92vw,440px)]',
  md: 'w-[min(92vw,560px)]',
  lg: 'w-[min(92vw,640px)]',
} as const

export function DialogContent({
  className,
  children,
  size = 'sm',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  size?: keyof typeof sizeClass
}) {
  const Close = icons.close
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-[var(--color-overlay)] animate-[auth-fade-in_var(--motion-base)_var(--ease-out)]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-[var(--z-modal)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-modal)]',
          'animate-[auth-fade-up_var(--motion-base)_var(--ease-out)]',
          sizeClass[size],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] transition-colors duration-[var(--motion-fast)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]">
          <Close className="size-4" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-medium text-[var(--color-ink)]', className)}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('mt-2 text-sm text-[var(--color-ink-muted)]', className)}
      {...props}
    />
  )
}
