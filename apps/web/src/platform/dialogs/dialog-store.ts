export type DialogTone = 'default' | 'danger'

export type ConfirmDialogRequest = {
  kind: 'confirm' | 'delete' | 'discard' | 'danger' | 'prompt'
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: DialogTone
  /** Future: prompt dialogs */
  promptPlaceholder?: string
  promptDefaultValue?: string
}

type PendingDialog = ConfirmDialogRequest & {
  id: string
  resolve: (result: DialogResult) => void
}

export type DialogResult =
  | { confirmed: true; value?: string }
  | { confirmed: false }

type Listener = (dialog: PendingDialog | null) => void

let current: PendingDialog | null = null
let seq = 0
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((l) => l(current))
}

function open(request: ConfirmDialogRequest): Promise<DialogResult> {
  return new Promise((resolve) => {
    if (current) {
      current.resolve({ confirmed: false })
    }
    current = {
      ...request,
      id: `dialog_${++seq}`,
      resolve,
    }
    emit()
  })
}

export const dialogStore = {
  subscribe(listener: Listener) {
    listeners.add(listener)
    listener(current)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot() {
    return current
  },
  confirm(request: Omit<ConfirmDialogRequest, 'kind'>) {
    return open({ kind: 'confirm', tone: 'default', ...request })
  },
  delete(request: Omit<ConfirmDialogRequest, 'kind' | 'tone'>) {
    return open({
      kind: 'delete',
      tone: 'danger',
      confirmLabel: 'Excluir',
      ...request,
    })
  },
  discard(request?: Partial<Omit<ConfirmDialogRequest, 'kind'>>) {
    return open({
      kind: 'discard',
      title: 'Descartar alterações?',
      description: 'As alterações não salvas serão perdidas.',
      confirmLabel: 'Descartar',
      tone: 'danger',
      ...request,
    })
  },
  danger(request: Omit<ConfirmDialogRequest, 'kind'>) {
    return open({ kind: 'danger', tone: 'danger', ...request })
  },
  /** Reserved for future prompt dialogs */
  prompt(request: Omit<ConfirmDialogRequest, 'kind'>) {
    return open({ kind: 'prompt', tone: 'default', ...request })
  },
  resolve(result: DialogResult) {
    if (!current) return
    const pending = current
    current = null
    emit()
    pending.resolve(result)
  },
}

export const dialogs = dialogStore
