export class InventoryFoundationPermissionError extends Error {
  readonly code = 'permission_denied' as const
  constructor(message = 'permission_denied') {
    super(message)
    this.name = 'InventoryFoundationPermissionError'
  }
}

export class InventoryFoundationNotFoundError extends Error {
  readonly code: string
  constructor(code = 'not_found') {
    super(code)
    this.name = 'InventoryFoundationNotFoundError'
    this.code = code
  }
}

export class InventoryFoundationConflictError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.name = 'InventoryFoundationConflictError'
    this.code = code
  }
}

export class InventoryFoundationValidationError extends Error {
  readonly fieldErrors: Record<string, string>
  constructor(fieldErrors: Record<string, string>) {
    super('validation_error')
    this.name = 'InventoryFoundationValidationError'
    this.fieldErrors = fieldErrors
  }
}
