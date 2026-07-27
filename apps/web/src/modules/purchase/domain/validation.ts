import type {
  AddPurchaseItemInput,
  CreatePurchaseInput,
  UpdatePurchaseInput,
  UpdatePurchaseItemInput,
} from '#/modules/purchase/domain/types'

export type FieldErrors = Record<string, string>

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function validateCreatePurchase(input: CreatePurchaseInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.supplierId?.trim()) errors.supplierId = 'Fornecedor obrigatório.'
  if (input.currency && !/^[A-Z]{3}$/.test(input.currency)) {
    errors.currency = 'Moeda inválida.'
  }
  if (input.notes && input.notes.length > 4000) {
    errors.notes = 'Observações devem ter no máximo 4000 caracteres.'
  }
  return errors
}

export function validateUpdatePurchase(input: UpdatePurchaseInput): FieldErrors {
  const errors: FieldErrors = {}
  if (input.currency !== undefined && !/^[A-Z]{3}$/.test(input.currency)) {
    errors.currency = 'Moeda inválida.'
  }
  if (input.notes !== undefined && input.notes !== null && input.notes.length > 4000) {
    errors.notes = 'Observações devem ter no máximo 4000 caracteres.'
  }
  return errors
}

export function validateAddItem(input: AddPurchaseItemInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.purchaseOrderId?.trim()) {
    errors.purchaseOrderId = 'Pedido obrigatório.'
  }
  if (!input.variantId?.trim()) errors.variantId = 'Variante obrigatória.'
  if (!input.priceListId?.trim()) errors.priceListId = 'Tabela obrigatória.'
  const qty = Number(input.quantity)
  if (!Number.isFinite(qty) || qty <= 0) {
    errors.quantity = 'Quantidade deve ser maior que zero.'
  }
  if (input.discount !== undefined) {
    const discount = Number(input.discount)
    if (!Number.isFinite(discount) || discount < 0) {
      errors.discount = 'Desconto inválido.'
    }
  }
  return errors
}

export function validateUpdateItem(input: UpdatePurchaseItemInput): FieldErrors {
  const errors: FieldErrors = {}
  if (input.quantity !== undefined) {
    const qty = Number(input.quantity)
    if (!Number.isFinite(qty) || qty <= 0) {
      errors.quantity = 'Quantidade deve ser maior que zero.'
    }
  }
  if (input.unitPrice !== undefined) {
    const price = Number(input.unitPrice)
    if (!Number.isFinite(price) || price < 0) {
      errors.unitPrice = 'Preço unitário inválido.'
    }
  }
  if (input.discount !== undefined) {
    const discount = Number(input.discount)
    if (!Number.isFinite(discount) || discount < 0) {
      errors.discount = 'Desconto inválido.'
    }
  }
  return errors
}
