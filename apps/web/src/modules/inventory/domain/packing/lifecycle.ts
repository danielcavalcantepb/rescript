import type { InventoryPackingStatus } from './types'

const transitions: Record<
  InventoryPackingStatus,
  readonly InventoryPackingStatus[]
> = {
  draft: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function assertPackingTransition(
  from: InventoryPackingStatus,
  to: InventoryPackingStatus,
) {
  if (!transitions[from].includes(to)) {
    throw new Error('invalid_packing_transition')
  }
}

export function packingStatusLabel(status: InventoryPackingStatus) {
  return {
    draft: 'Rascunho',
    in_progress: 'Em embalagem',
    completed: 'Embalado',
    cancelled: 'Cancelado',
  }[status]
}
