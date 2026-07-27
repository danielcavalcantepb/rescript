import * as DialogPrimitive from '@radix-ui/react-dialog'
import type * as React from 'react'
import { cn } from '#/lib/utils'
import { icons } from '#/platform/icons/catalog'

export const Drawer = DialogPrimitive.Root
export const DrawerTrigger = DialogPrimitive.Trigger
export const DrawerClose = DialogPrimitive.Close

export function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const Close = icons.close

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-[var(--color-overlay)] animate-[auth-fade-in_var(--motion-base)_var(--ease-out)]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 right-0 z-[var(--z-modal)] flex w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-modal)]',
          'animate-[drawer-slide-in_var(--motion-base)_var(--ease-out)] sm:w-[min(92vw,560px)]',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-[var(--radius-sm)] p-1 text-[var(--color-ink-muted)] transition-colors duration-[var(--motion-fast)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]">
          <Close className="size-4" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DrawerHeader({
  className,
  ...props
}: React.ComponentProps<'header'>) {
  return (
    <header
      className={cn(
        'border-b border-[var(--color-border-soft)] px-5 py-4 pr-12',
        className,
      )}
      {...props}
    />
  )
}

export function DrawerTitle({
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

export function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('mt-1 text-sm text-[var(--color-ink-muted)]', className)}
      {...props}
    />
  )
}

export function DrawerBody({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-5', className)}
      {...props}
    />
  )
}
