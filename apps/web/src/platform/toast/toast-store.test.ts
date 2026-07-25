import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toastStore } from '#/platform/toast/toast-store'

describe('toastStore', () => {
  beforeEach(() => {
    toastStore.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    toastStore.clear()
  })

  it('shows success toast', () => {
    toastStore.success('Salvo')
    expect(toastStore.getSnapshot()[0]?.variant).toBe('success')
    expect(toastStore.getSnapshot()[0]?.title).toBe('Salvo')
  })

  it('deduplicates by key', () => {
    toastStore.show({ title: 'Aviso', variant: 'warning', dedupeKey: 'same' })
    toastStore.show({ title: 'Aviso 2', variant: 'warning', dedupeKey: 'same' })
    expect(toastStore.getSnapshot()).toHaveLength(1)
    expect(toastStore.getSnapshot()[0]?.title).toBe('Aviso 2')
  })

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers()
    toastStore.info('Info')
    expect(toastStore.getSnapshot()).toHaveLength(1)
    vi.advanceTimersByTime(5000)
    expect(toastStore.getSnapshot()).toHaveLength(0)
  })

  it('resolves promise toasts', async () => {
    const promise = toastStore.promise(Promise.resolve(1), {
      loading: '…',
      success: 'ok',
      error: 'fail',
    })
    expect(toastStore.getSnapshot()[0]?.variant).toBe('loading')
    await promise
    expect(toastStore.getSnapshot()[0]?.variant).toBe('success')
  })
})
