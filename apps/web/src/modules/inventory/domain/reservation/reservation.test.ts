import { describe, expect, it } from 'vitest'
import {
  assertReservationTransition,
  reservationOpenQuantity,
  reservationStatusLabel,
} from './lifecycle'
import {
  validateReservationQuantity,
  validateReservationReleaseItems,
} from './validation'

describe('inventory reservation domain', () => {
  it('allows only the reservation lifecycle transitions', () => {
    expect(() => assertReservationTransition('draft', 'active')).not.toThrow()
    expect(() =>
      assertReservationTransition('active', 'partially_released'),
    ).not.toThrow()
    expect(() =>
      assertReservationTransition('partially_released', 'released'),
    ).not.toThrow()
    expect(() => assertReservationTransition('active', 'cancelled')).not.toThrow()
    expect(() => assertReservationTransition('released', 'active')).toThrow(
      'invalid_reservation_transition',
    )
  })

  it('keeps operational labels stable', () => {
    expect(reservationStatusLabel('active')).toBe('Ativa')
    expect(reservationStatusLabel('partially_released')).toBe(
      'Parcialmente liberada',
    )
  })

  it('rejects negative or malformed reservation quantities', () => {
    expect(validateReservationQuantity('1.500000')).toBe('1.500000')
    expect(() => validateReservationQuantity('-1')).toThrow(
      'invalid_reservation_quantity',
    )
    expect(() => validateReservationQuantity('1.1234567')).toThrow(
      'invalid_reservation_quantity',
    )
  })

  it('does not allow released quantity above reserved quantity', () => {
    expect(reservationOpenQuantity('10', '3')).toBe(7)
    expect(() => reservationOpenQuantity('10', '11')).toThrow(
      'invalid_reservation_quantity',
    )
  })

  it('validates partial release item commands', () => {
    expect(() =>
      validateReservationReleaseItems([{ itemId: 'a', quantity: '2' }]),
    ).not.toThrow()
    expect(() =>
      validateReservationReleaseItems([
        { itemId: 'a', quantity: '2' },
        { itemId: 'a', quantity: '1' },
      ]),
    ).toThrow('invalid_release_items')
  })
})
