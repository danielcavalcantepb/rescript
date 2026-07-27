import type { PurchaseStatus } from '#/modules/purchase/domain/types'

const TRANSITIONS: Record<PurchaseStatus, readonly PurchaseStatus[]> = {
  draft: ['approved', 'cancelled', 'archived'],
  approved: ['cancelled', 'closed', 'archived'],
  cancelled: ['archived'],
  closed: ['archived'],
  archived: ['draft', 'approved', 'cancelled', 'closed'],
}

export function canTransitionPurchaseStatus(
  from: PurchaseStatus,
  to: PurchaseStatus,
): boolean {
  if (from === to) return true
  return TRANSITIONS[from].includes(to)
}

export function assertPurchaseTransition(
  from: PurchaseStatus,
  to: PurchaseStatus,
): void {
  if (!canTransitionPurchaseStatus(from, to)) {
    throw new Error(`invalid_purchase_transition:${from}->${to}`)
  }
}

export function purchaseStatusLabel(status: PurchaseStatus): string {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'approved':
      return 'Aprovado'
    case 'cancelled':
      return 'Cancelado'
    case 'closed':
      return 'Fechado'
    case 'archived':
      return 'Arquivado'
  }
}

export function isPurchaseEditable(status: PurchaseStatus): boolean {
  return status === 'draft'
}
