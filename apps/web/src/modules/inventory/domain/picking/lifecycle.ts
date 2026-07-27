import type { InventoryPickingStatus } from './types'

const transitions: Record<
  InventoryPickingStatus,
  readonly InventoryPickingStatus[]
> = {
  draft: ['in_progress', 'cancelled'],
  in_progress: ['partially_picked', 'completed', 'cancelled'],
  partially_picked: ['completed', 'cancelled', 'in_progress'],
  completed: [],
  cancelled: [],
}

export function assertPickingTransition(
  from: InventoryPickingStatus,
  to: InventoryPickingStatus,
) {
  if (!transitions[from].includes(to)) {
    throw new Error('invalid_picking_transition')
  }
}

export function pickingStatusLabel(status: InventoryPickingStatus) {
  return {
    draft: 'Rascunho',
    in_progress: 'Em separação',
    partially_picked: 'Separado parcialmente',
    completed: 'Separado',
    cancelled: 'Cancelado',
  }[status]
}

export function pickingOpenQuantity(
  quantityReserved: string | number,
  quantityPicked: string | number,
) {
  const reserved = Number(quantityReserved)
  const picked = Number(quantityPicked)
  if (!Number.isFinite(reserved) || !Number.isFinite(picked)) {
    throw new Error('invalid_picking_quantity')
  }
  if (reserved < 0 || picked < 0 || picked > reserved) {
    throw new Error('invalid_picking_quantity')
  }
  return reserved - picked
}
