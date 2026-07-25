import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { dialogStore } from '#/platform/dialogs/dialog-store'

export function DialogHost() {
  const pending = useSyncExternalStore(
    dialogStore.subscribe,
    dialogStore.getSnapshot,
    () => null,
  )
  const [promptValue, setPromptValue] = useState('')

  useEffect(() => {
    setPromptValue(pending?.promptDefaultValue ?? '')
  }, [pending?.id, pending?.promptDefaultValue])

  if (!pending) return null

  const isPrompt = pending.kind === 'prompt'
  const confirmLabel =
    pending.confirmLabel ??
    (pending.kind === 'delete'
      ? 'Excluir'
      : pending.kind === 'discard'
        ? 'Descartar'
        : 'Confirmar')
  const cancelLabel = pending.cancelLabel ?? 'Voltar'
  const danger = pending.tone === 'danger'

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) dialogStore.resolve({ confirmed: false })
      }}
    >
      <DialogContent>
        <DialogTitle>{pending.title}</DialogTitle>
        <DialogDescription>{pending.description}</DialogDescription>
        {isPrompt ? (
          <input
            className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-focus)]"
            placeholder={pending.promptPlaceholder}
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            autoFocus
          />
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => dialogStore.resolve({ confirmed: false })}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() =>
              dialogStore.resolve({
                confirmed: true,
                value: isPrompt ? promptValue : undefined,
              })
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
