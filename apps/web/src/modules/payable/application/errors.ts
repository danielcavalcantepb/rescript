export class PayableValidationError extends Error {
  readonly fieldErrors: Record<string, string>

  constructor(fieldErrors: Record<string, string>) {
    super('validation_failed')
    this.name = 'PayableValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class PayablePermissionError extends Error {
  constructor(message = 'permission_denied') {
    super(message)
    this.name = 'PayablePermissionError'
  }
}

export class PayableNotFoundError extends Error {
  constructor() {
    super('payable_not_found')
    this.name = 'PayableNotFoundError'
  }
}

export class PayableConflictError extends Error {
  constructor(message = 'payable_conflict') {
    super(message)
    this.name = 'PayableConflictError'
  }
}

export class PayableNotEditableError extends Error {
  constructor(message = 'Conta a pagar não está em rascunho.') {
    super(message)
    this.name = 'PayableNotEditableError'
  }
}

export function payableErrorMessage(error: unknown): string {
  if (error instanceof PayableValidationError) {
    return 'Verifique os campos e tente novamente.'
  }
  if (error instanceof PayablePermissionError) {
    return 'Você não tem permissão para esta ação.'
  }
  if (error instanceof PayableNotFoundError) {
    return 'Conta a pagar não encontrada.'
  }
  if (error instanceof PayableConflictError || error instanceof PayableNotEditableError) {
    return error.message
  }
  if (typeof error === 'object' && error && 'message' in error) {
    const message = String((error as { message?: string }).message ?? '')
    if (/Failed to fetch|NetworkError|fetch/i.test(message)) {
      return 'Falha de rede. Verifique a conexão e tente novamente.'
    }
    if (message.includes('installments_total_mismatch')) {
      return 'A soma das parcelas deve igualar o valor total.'
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
    throw new PayableConflictError(
      'Conflito: já existe conta a pagar para este recebimento ou número.',
    )
  }
  if (code === 'PGRST116') {
    throw new PayableNotFoundError()
  }
  throw error
}
