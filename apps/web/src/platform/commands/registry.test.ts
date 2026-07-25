import { describe, expect, it, beforeEach } from 'vitest'
import { commandRegistry, rankCommand } from '#/platform/commands/registry'
import type { AppCommand } from '#/platform/commands/types'

const sample: AppCommand = {
  id: 'test.nav',
  label: 'Ir para Estoque',
  category: 'navigate',
  keywords: ['estoque', 'inventory'],
  priority: 40,
  run: () => undefined,
}

describe('commandRegistry', () => {
  beforeEach(() => {
    for (const cmd of commandRegistry.getAll()) {
      commandRegistry.unregister(cmd.id)
    }
  })

  it('registers and unregisters commands', () => {
    const dispose = commandRegistry.register(sample)
    expect(commandRegistry.getAll()).toHaveLength(1)
    dispose()
    expect(commandRegistry.getAll()).toHaveLength(0)
  })

  it('ranks exact and partial matches', () => {
    expect(rankCommand(sample, 'Ir para Estoque')).toBeGreaterThan(
      rankCommand(sample, 'estoque'),
    )
    expect(rankCommand(sample, 'xyz')).toBe(-1)
  })
})
