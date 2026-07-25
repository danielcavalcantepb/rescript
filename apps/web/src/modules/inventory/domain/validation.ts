import type { InventoryMovementType } from '@rescript/database'
import {
  movementDelta,
  stockStatus,
} from '#/modules/inventory/domain/balance'
import type { CreateMovementInput } from '#/modules/inventory/domain/types'

export type FieldErrors = Record<string, string>

export const INVENTORY_LIMITS = {
  reason: 500,
  notes: 2000,
} as const

export const MOVEMENT_TYPES: readonly InventoryMovementType[] = [
  'entry',
  'exit',
  'adjustment_in',
  'adjustment_out',
] as const

/** Re-export official helpers (single source: domain/balance). */
export { movementDelta, stockStatus }

export function isMovementType(value: string): value is InventoryMovementType {
  return (MOVEMENT_TYPES as readonly string[]).includes(value)
}

function coerceQuantity(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return Number.NaN
}

export function validateCreateMovement(
  input: CreateMovementInput,
): FieldErrors {
  const errors: FieldErrors = {}

  const productId = input.productId?.trim() ?? ''
  if (productId.length < 1) {
    errors.productId = 'Selecione um produto.'
  }

  if (!isMovementType(input.type)) {
    errors.type = 'Tipo de movimento inválido.'
  }

  const quantity = coerceQuantity(input.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.quantity = 'Informe uma quantidade maior que zero.'
  }

  const reason = input.reason?.trim() ?? ''
  if (reason.length < 1) {
    errors.reason = 'Informe o motivo.'
  } else if (reason.length > INVENTORY_LIMITS.reason) {
    errors.reason = `Motivo deve ter no máximo ${INVENTORY_LIMITS.reason} caracteres.`
  }

  if (
    input.notes !== undefined &&
    input.notes !== null &&
    input.notes.trim().length > INVENTORY_LIMITS.notes
  ) {
    errors.notes = `Observações devem ter no máximo ${INVENTORY_LIMITS.notes} caracteres.`
  }

  return errors
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}
