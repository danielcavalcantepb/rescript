import { describe, expect, it } from 'vitest'
import { assertShipmentTransition, shipmentStatusLabel } from './lifecycle'
import {
  assertShipmentQuantityBounds,
  validateFreightAmount,
  validateShipmentQuantity,
} from './validation'

describe('inventory shipment domain', () => {
  it('allows only the shipment lifecycle transitions', () => {
    expect(() => assertShipmentTransition('draft', 'ready')).not.toThrow()
    expect(() => assertShipmentTransition('ready', 'dispatched')).not.toThrow()
    expect(() => assertShipmentTransition('dispatched', 'delivered')).not.toThrow()
    expect(() => assertShipmentTransition('ready', 'cancelled')).not.toThrow()
    expect(() => assertShipmentTransition('draft', 'cancelled')).not.toThrow()
    expect(() => assertShipmentTransition('delivered', 'cancelled')).toThrow(
      'invalid_shipment_transition',
    )
    expect(() => assertShipmentTransition('dispatched', 'cancelled')).toThrow(
      'invalid_shipment_transition',
    )
  })

  it('keeps operational labels stable', () => {
    expect(shipmentStatusLabel('ready')).toBe('Pronto para expedição')
    expect(shipmentStatusLabel('dispatched')).toBe('Despachado')
    expect(shipmentStatusLabel('delivered')).toBe('Entregue')
  })

  it('requires positive packed and shipped quantities', () => {
    expect(validateShipmentQuantity('1.500000')).toBe('1.500000')
    expect(() => validateShipmentQuantity('0')).toThrow(
      'invalid_shipment_quantity',
    )
    expect(() => validateShipmentQuantity('-1')).toThrow(
      'invalid_shipment_quantity',
    )
  })

  it('does not allow shipped quantity above packed quantity', () => {
    expect(() => assertShipmentQuantityBounds('2', '2')).not.toThrow()
    expect(() => assertShipmentQuantityBounds('2', '3')).toThrow(
      'shipped_quantity_exceeds_packed',
    )
  })

  it('accepts empty or non-negative freight amount', () => {
    expect(validateFreightAmount(null)).toBeNull()
    expect(validateFreightAmount('12.3400')).toBe('12.3400')
    expect(() => validateFreightAmount('-1')).toThrow('invalid_freight_amount')
  })
})
