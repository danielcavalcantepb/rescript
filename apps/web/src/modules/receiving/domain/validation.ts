import type {
  CreateReceiptInput,
  PostReceiptInput,
  UpdateReceiptItemInput,
} from '#/modules/receiving/domain/types'

export type FieldErrors = Record<string, string>

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function validateCreateReceipt(input: CreateReceiptInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.purchaseOrderId?.trim()) {
    errors.purchaseOrderId = 'Pedido de compra obrigatório.'
  }
  if (!input.locationId?.trim()) {
    errors.locationId = 'Local de estoque obrigatório.'
  }
  if (input.notes && input.notes.length > 4000) {
    errors.notes = 'Observações devem ter no máximo 4000 caracteres.'
  }
  if (input.items) {
    for (const [index, item] of input.items.entries()) {
      const qty = Number(item.receivedQuantity)
      if (!Number.isFinite(qty) || qty < 0) {
        errors[`items.${index}.receivedQuantity`] = 'Quantidade inválida.'
      }
    }
  }
  return errors
}

export function validateUpdateReceiptItem(
  input: UpdateReceiptItemInput,
): FieldErrors {
  const errors: FieldErrors = {}
  if (input.receivedQuantity !== undefined) {
    const qty = Number(input.receivedQuantity)
    if (!Number.isFinite(qty) || qty < 0) {
      errors.receivedQuantity = 'Quantidade inválida.'
    }
  }
  return errors
}

export function validatePostReceipt(input: PostReceiptInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.goodsReceiptId?.trim()) {
    errors.goodsReceiptId = 'Recebimento obrigatório.'
  }
  const key = input.idempotencyKey?.trim() ?? ''
  if (!key || key.length > 128) {
    errors.idempotencyKey = 'Chave de idempotência obrigatória (máx. 128).'
  }
  return errors
}
