import { describe, expect, it } from 'vitest'
import { readCommandCenterSource } from './supabase-command-center-read-repository'

describe('Command Center source resilience', () => {
  it('degrades a stalled source instead of loading forever', async () => {
    const issues: string[] = []

    const rows = await readCommandCenterSource(
      issues,
      'Inventory',
      () => new Promise(() => undefined),
      5,
    )

    expect(rows).toEqual([])
    expect(issues).toEqual(['Inventory: timeout_after_5ms'])
  })

  it('keeps available source data', async () => {
    const issues: string[] = []
    const rows = await readCommandCenterSource(
      issues,
      'Products',
      async () => [{ id: 'product-1' }],
      5,
    )

    expect(rows).toEqual([{ id: 'product-1' }])
    expect(issues).toEqual([])
  })
})
