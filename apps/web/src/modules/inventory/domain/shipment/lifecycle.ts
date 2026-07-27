import type { InventoryShipmentStatus } from './types'

const transitions: Record<
  InventoryShipmentStatus,
  readonly InventoryShipmentStatus[]
> = {
  draft: ['ready', 'cancelled'],
  ready: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function assertShipmentTransition(
  from: InventoryShipmentStatus,
  to: InventoryShipmentStatus,
) {
  if (!transitions[from].includes(to)) {
    throw new Error('invalid_shipment_transition')
  }
}

export function shipmentStatusLabel(status: InventoryShipmentStatus) {
  return {
    draft: 'Rascunho',
    ready: 'Pronto para expedição',
    dispatched: 'Despachado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  }[status]
}
