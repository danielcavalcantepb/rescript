export class PurchaseValidationError extends Error {
  readonly fieldErrors: Record<string, string>

  constructor(fieldErrors: Record<string, string>) {
    super('validation_failed')
    this.name = 'PurchaseValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class PurchasePermissionError extends Error {
  constructor(message = 'permission_denied') {
    super(message)
    this.name = 'PurchasePermissionError'
  }
}

export class PurchaseNotFoundError extends Error {
  constructor() {
    super('purchase_not_found')
    this.name = 'PurchaseNotFoundError'
  }
}

export class PurchaseConflictError extends Error {
  constructor(message = 'purchase_conflict') {
    super(message)
    this.name = 'PurchaseConflictError'
  }
}

export class PurchaseNotEditableError extends Error {
  constructor(message = 'Pedido não está em rascunho.') {
    super(message)
    this.name = 'PurchaseNotEditableError'
  }
}

export function purchaseErrorMessage(error: unknown): string {
  if (error instanceof PurchaseValidationError) {
    return 'Verifique os campos e tente novamente.'
  }
  if (error instanceof PurchasePermissionError) {
    return 'Você não tem permissão para esta ação.'
  }
  if (error instanceof PurchaseNotFoundError) {
    return 'Pedido de compra não encontrado.'
  }
  if (error instanceof PurchaseConflictError) {
    return error.message
  }
  if (error instanceof PurchaseNotEditableError) {
    return error.message
  }
  if (typeof error === 'object' && error && 'message' in error) {
    const message = String((error as { message?: string }).message ?? '')
    if (/Failed to fetch|NetworkError|fetch/i.test(message)) {
      return 'Falha de rede. Verifique a conexão e tente novamente.'
    }
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function mapRepositoryError(error: unknown): never {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code)
      : ''
  if (code === '23505') {
    throw new PurchaseConflictError('Conflito ao salvar o pedido.')
  }
  if (code === 'PGRST116') {
    throw new PurchaseNotFoundError()
  }
  throw error
}
