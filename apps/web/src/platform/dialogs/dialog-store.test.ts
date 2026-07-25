import { beforeEach, describe, expect, it } from 'vitest'
import { dialogStore } from '#/platform/dialogs/dialog-store'

describe('dialogStore', () => {
  beforeEach(() => {
    if (dialogStore.getSnapshot()) {
      dialogStore.resolve({ confirmed: false })
    }
  })

  it('opens confirm and resolves true', async () => {
    const pending = dialogStore.confirm({
      title: 'Confirmar?',
      description: 'Descrição',
    })
    expect(dialogStore.getSnapshot()?.kind).toBe('confirm')
    dialogStore.resolve({ confirmed: true })
    await expect(pending).resolves.toEqual({ confirmed: true })
  })

  it('opens delete with danger tone', async () => {
    const pending = dialogStore.delete({
      title: 'Excluir?',
      description: 'Irreversível',
    })
    expect(dialogStore.getSnapshot()?.tone).toBe('danger')
    dialogStore.resolve({ confirmed: false })
    await expect(pending).resolves.toEqual({ confirmed: false })
  })
})
