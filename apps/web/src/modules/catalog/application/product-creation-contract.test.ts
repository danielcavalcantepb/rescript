import { describe, expect, it } from 'vitest'
import {
  calculateDerivedMargin,
  deriveProductCreationKeys,
  validateInitialValuation,
} from './product-creation-contract'

describe('ProductCreationOrchestrator contract', () => {
  it('derives deterministic and isolated keys per variant/location', () => {
    const first = deriveProductCreationKeys({ globalKey: 'request-1', variantIdentity: 'black-p', branchId: 'branch-a', locationId: 'location-a' })
    const second = deriveProductCreationKeys({ globalKey: 'request-1', variantIdentity: 'black-p', branchId: 'branch-a', locationId: 'location-a' })
    const otherLocation = deriveProductCreationKeys({ globalKey: 'request-1', variantIdentity: 'black-p', branchId: 'branch-a', locationId: 'location-b' })
    expect(first).toEqual(second)
    expect(first.inventory).not.toEqual(otherLocation.inventory)
    expect(first.valuation).toBe('valuation:request-1:black-p:branch-a:location-a')
  })

  it('keeps margin derived and unavailable without a usable price/cost', () => {
    expect(calculateDerivedMargin(100, 40)).toBe(60)
    expect(calculateDerivedMargin(100, 140)).toBe(-40)
    expect(calculateDerivedMargin(0, 40)).toBeNull()
    expect(calculateDerivedMargin(100, null)).toBeNull()
  })

  it('requires a positive quantity and explicit authorization for zero cost', () => {
    expect(validateInitialValuation({ quantity: 0, unitCost: 10 })).toBe('initial_quantity_invalid')
    expect(validateInitialValuation({ quantity: 2, unitCost: -1 })).toBe('initial_unit_cost_invalid')
    expect(validateInitialValuation({ quantity: 2, unitCost: 0 })).toBe('initial_unit_cost_invalid')
    expect(validateInitialValuation({ quantity: 2, unitCost: 0, allowZeroCost: true })).toBeNull()
  })
})
