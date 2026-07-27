import type { SupplierStatus } from '#/modules/suppliers/domain/types'

const TRANSITIONS: Record<SupplierStatus, readonly SupplierStatus[]> = {
  draft: ['active', 'archived'],
  active: ['inactive', 'archived'],
  inactive: ['active', 'archived'],
  archived: ['active', 'inactive'],
}

export function canTransitionSupplierStatus(
  from: SupplierStatus,
  to: SupplierStatus,
): boolean {
  if (from === to) return true
  return TRANSITIONS[from].includes(to)
}

export function assertSupplierTransition(
  from: SupplierStatus,
  to: SupplierStatus,
): void {
  if (!canTransitionSupplierStatus(from, to)) {
    throw new Error(`invalid_supplier_transition:${from}->${to}`)
  }
}

export function supplierStatusLabel(status: SupplierStatus): string {
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
