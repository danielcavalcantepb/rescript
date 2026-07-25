export type ToastVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading'

export type ToastInput = {
  id?: string
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
  dedupeKey?: string
}

export type ToastItem = Required<Pick<ToastInput, 'title'>> & {
  id: string
  description?: string
  variant: ToastVariant
  durationMs: number
  dedupeKey?: string
  createdAt: number
}

type Listener = (toasts: ToastItem[]) => void

const MAX_VISIBLE = 4
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
  loading: 0,
}

let seq = 0
let queue: ToastItem[] = []
let snapshot: ToastItem[] = []
const listeners = new Set<Listener>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function emit() {
  snapshot = queue.slice(0, MAX_VISIBLE)
  listeners.forEach((l) => l(snapshot))
}

function clearTimer(id: string) {
  const handle = timers.get(id)
  if (handle !== undefined) {
    clearTimeout(handle)
    timers.delete(id)
  }
}

function remove(id: string) {
  clearTimer(id)
  queue = queue.filter((t) => t.id !== id)
  emit()
}

function push(input: ToastInput): string {
  const variant = input.variant ?? 'info'
  const dedupeKey = input.dedupeKey ?? `${variant}:${input.title}`

  if (dedupeKey) {
    const existing = queue.find((t) => t.dedupeKey === dedupeKey)
    if (existing) {
      remove(existing.id)
    }
  }

  const id = input.id ?? `toast_${++seq}`
  const item: ToastItem = {
    id,
    title: input.title,
    description: input.description,
    variant,
    durationMs: input.durationMs ?? DEFAULT_DURATION[variant],
    dedupeKey,
    createdAt: Date.now(),
  }

  queue = [item, ...queue].slice(0, 12)
  emit()

  if (item.durationMs > 0) {
    const handle = setTimeout(() => remove(id), item.durationMs)
    timers.set(id, handle)
  }

  return id
}

export const toastStore = {
  subscribe(listener: Listener) {
    listeners.add(listener)
    listener(snapshot)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot() {
    return snapshot
  },
  dismiss(id: string) {
    remove(id)
  },
  clear() {
    for (const id of timers.keys()) clearTimer(id)
    queue = []
    emit()
  },
  show(input: ToastInput) {
    return push(input)
  },
  success(title: string, description?: string) {
    return push({ title, description, variant: 'success' })
  },
  error(title: string, description?: string) {
    return push({ title, description, variant: 'error' })
  },
  warning(title: string, description?: string) {
    return push({ title, description, variant: 'warning' })
  },
  info(title: string, description?: string) {
    return push({ title, description, variant: 'info' })
  },
  loading(title: string, description?: string) {
    return push({ title, description, variant: 'loading', durationMs: 0 })
  },
  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((value: T) => string)
      error: string | ((error: unknown) => string)
    },
  ): Promise<T> {
    const id = push({
      title: messages.loading,
      variant: 'loading',
      durationMs: 0,
      dedupeKey: `promise:${messages.loading}`,
    })
    try {
      const value = await promise
      remove(id)
      push({
        title:
          typeof messages.success === 'function'
            ? messages.success(value)
            : messages.success,
        variant: 'success',
      })
      return value
    } catch (error) {
      remove(id)
      push({
        title:
          typeof messages.error === 'function'
            ? messages.error(error)
            : messages.error,
        variant: 'error',
      })
      throw error
    }
  },
}

export const toast = toastStore
