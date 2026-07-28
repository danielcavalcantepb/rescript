export type PurchaseReturnStatus = 'draft' | 'processing' | 'completed' | 'cancelled'

const transitions: Record<PurchaseReturnStatus, readonly PurchaseReturnStatus[]> = {
  draft: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function canTransitionPurchaseReturn(from: PurchaseReturnStatus, to: PurchaseReturnStatus): boolean {
  return transitions[from].includes(to)
}

export function assertReturnQuantity(availableReceived: number, quantity: number): void {
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('invalid_return_quantity')
  if (quantity > availableReceived) throw new Error('return_quantity_exceeds_received')
}
