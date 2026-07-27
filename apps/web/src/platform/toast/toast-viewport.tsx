import { useSyncExternalStore } from 'react'
import { toastStore, type ToastItem } from '#/platform/toast/toast-store'
import { icons } from '#/platform/icons/catalog'
import { cn } from '#/lib/utils'

const variantStyles: Record<ToastItem['variant'], string> = {
  success: 'border-[var(--color-success)]/20 bg-[var(--color-success-bg)] text-[var(--color-success)]',
  error: 'border-[var(--color-danger)]/20 bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
  warning: 'border-[var(--color-warning)]/20 bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  info: 'border-[var(--color-info)]/20 bg-[var(--color-info-bg)] text-[var(--color-info)]',
  loading: 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)]',
}

export function ToastViewport() {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    () => [],
  )

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-toast)] flex flex-col items-end gap-2 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:w-[min(100%,380px)]"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastCard({ toast: item }: { toast: ToastItem }) {
  const Close = icons.close
  const Spinner = icons.spinner

  return (
    <div
      className={cn(
        'pointer-events-auto w-full rounded-[var(--radius-md)] border px-3 py-2.5 shadow-[var(--shadow-overlay)]',
        'animate-[auth-fade-up_var(--motion-base)_var(--ease-out)]',
        variantStyles[item.variant],
      )}
      role="status"
    >
      <div className="flex items-start gap-2">
        {item.variant === 'loading' ? (
          <Spinner className="mt-0.5 size-4 animate-spin" strokeWidth={1.5} />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--color-ink)]">{item.title}</p>
          {item.description ? (
            <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
              {item.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-[var(--radius-sm)] p-0.5 text-[var(--color-muted)] transition-colors duration-[var(--motion-fast)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          aria-label="Fechar notificação"
          onClick={() => toastStore.dismiss(item.id)}
        >
          <Close className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
