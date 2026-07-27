import {
  InventoryFoundationConflictError,
  InventoryFoundationNotFoundError,
  InventoryFoundationPermissionError,
  InventoryFoundationValidationError,
} from '#/modules/inventory/application/foundation/errors'

export function toInventoryRpcError(error: unknown): {
  code: string
  message: string
  fieldErrors?: Record<string, string>
} {
  if (error instanceof InventoryFoundationPermissionError) {
    return { code: error.code, message: error.message }
  }
  if (error instanceof InventoryFoundationNotFoundError) {
    return { code: error.code, message: error.message }
  }
  if (error instanceof InventoryFoundationConflictError) {
    return { code: error.code, message: error.message }
  }
  if (error instanceof InventoryFoundationValidationError) {
    return {
      code: 'validation_error',
      message: 'validation_error',
      fieldErrors: error.fieldErrors,
    }
  }
  if (error instanceof Error) {
    return { code: 'internal_error', message: error.message }
  }
  return { code: 'internal_error', message: 'unknown_error' }
}
