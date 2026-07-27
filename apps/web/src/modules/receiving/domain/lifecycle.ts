import type { ReceiptStatus } from '#/modules/receiving/domain/types'

const TRANSITIONS: Record<ReceiptStatus, readonly ReceiptStatus[]> = {
  draft: ['posted', 'cancelled', 'archived'],
  posted: ['archived'],
  cancelled: ['archived'],
  archived: ['draft', 'posted', 'cancelled'],
}

export function canTransitionReceiptStatus(
  from: ReceiptStatus,
  to: ReceiptStatus,
): boolean {
  if (from === to) return true
  return TRANSITIONS[from].includes(to)
}

export function assertReceiptTransition(
  from: ReceiptStatus,
  to: ReceiptStatus,
): void {
  if (!canTransitionReceiptStatus(from, to)) {
    throw new Error(`invalid_receipt_transition:${from}->${to}`)
  }
}

export function receiptStatusLabel(status: ReceiptStatus): string {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'posted':
      return 'Lançado'
    case 'cancelled':
      return 'Cancelado'
    case 'archived':
      return 'Arquivado'
  }
}

export function isReceiptEditable(status: ReceiptStatus): boolean {
  return status === 'draft'
}
