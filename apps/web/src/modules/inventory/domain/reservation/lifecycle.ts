import type { InventoryReservationStatus } from './types'

const transitions: Record<
  InventoryReservationStatus,
  readonly InventoryReservationStatus[]
> = {
  draft: ['active', 'cancelled'],
  active: ['partially_released', 'released', 'cancelled'],
  partially_released: ['released', 'cancelled'],
  released: [],
  cancelled: [],
}

export function assertReservationTransition(
  from: InventoryReservationStatus,
  to: InventoryReservationStatus,
) {
  if (!transitions[from].includes(to)) {
    throw new Error('invalid_reservation_transition')
  }
}

export function reservationStatusLabel(status: InventoryReservationStatus) {
  return {
    draft: 'Rascunho',
    active: 'Ativa',
    partially_released: 'Parcialmente liberada',
    released: 'Liberada',
    cancelled: 'Cancelada',
  }[status]
}

export function reservationOpenQuantity(
  quantityReserved: string | number,
  quantityReleased: string | number,
) {
  const reserved = Number(quantityReserved)
  const released = Number(quantityReleased)
  if (!Number.isFinite(reserved) || !Number.isFinite(released)) {
    throw new Error('invalid_reservation_quantity')
  }
  if (reserved < 0 || released < 0 || released > reserved) {
    throw new Error('invalid_reservation_quantity')
  }
  return reserved - released
}
