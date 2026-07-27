import type { PayableStatus } from '#/modules/payable/domain/types'

const TRANSITIONS: Record<PayableStatus, readonly PayableStatus[]> = {
  draft: ['approved', 'cancelled', 'archived'],
  approved: ['cancelled', 'archived'],
  partially_paid: ['archived'],
  paid: ['archived'],
  cancelled: ['archived'],
  archived: ['draft', 'approved', 'partially_paid', 'paid', 'cancelled'],
}

export function canTransitionPayableStatus(
  from: PayableStatus,
  to: PayableStatus,
): boolean {
  if (from === to) return true
  return TRANSITIONS[from].includes(to)
}

export function assertPayableTransition(
  from: PayableStatus,
  to: PayableStatus,
): void {
  if (!canTransitionPayableStatus(from, to)) {
    throw new Error(`invalid_payable_transition:${from}->${to}`)
  }
}

export function payableStatusLabel(status: PayableStatus): string {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'approved':
      return 'Aprovado'
    case 'cancelled':
      return 'Cancelado'
    case 'partially_paid':
      return 'Parcialmente pago'
    case 'paid':
      return 'Pago'
    case 'archived':
      return 'Arquivado'
  }
}

export function isPayableEditable(status: PayableStatus): boolean {
  return status === 'draft'
}

export function installmentStatusLabel(
  status: import('#/modules/payable/domain/types').InstallmentStatus,
): string {
  switch (status) {
    case 'open':
      return 'Em aberto'
    case 'cancelled':
      return 'Cancelada'
    case 'partially_paid':
      return 'Parcialmente paga'
    case 'paid':
      return 'Paga'
  }
}
