import type { CustomerStatus } from '#/modules/customers/domain/types'

const TRANSITIONS: Record<CustomerStatus, readonly CustomerStatus[]> = {
  draft: ['active', 'archived'],
  active: ['inactive', 'archived'],
  inactive: ['active', 'archived'],
  archived: ['active', 'inactive'],
}

export function canTransitionCustomerStatus(
  from: CustomerStatus,
  to: CustomerStatus,
): boolean {
  if (from === to) return true
  return TRANSITIONS[from].includes(to)
}

export function assertCustomerTransition(
  from: CustomerStatus,
  to: CustomerStatus,
): void {
  if (!canTransitionCustomerStatus(from, to)) {
    throw new Error(`invalid_customer_transition:${from}->${to}`)
  }
}

export function customerStatusLabel(status: CustomerStatus): string {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'active':
      return 'Ativo'
    case 'inactive':
      return 'Inativo'
    case 'archived':
      return 'Arquivado'
  }
}
