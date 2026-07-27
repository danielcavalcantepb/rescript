export class ReceivingValidationError extends Error {
  readonly fieldErrors: Record<string, string>

  constructor(fieldErrors: Record<string, string>) {
    super('validation_failed')
    this.name = 'ReceivingValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class ReceivingPermissionError extends Error {
  constructor(message = 'permission_denied') {
    super(message)
    this.name = 'ReceivingPermissionError'
  }
}

export class ReceivingNotFoundError extends Error {
  constructor() {
    super('receipt_not_found')
    this.name = 'ReceivingNotFoundError'
  }
}

export class ReceivingConflictError extends Error {
  constructor(message = 'receipt_conflict') {
    super(message)
    this.name = 'ReceivingConflictError'
  }
}

export class ReceivingNotEditableError extends Error {
  constructor(message = 'Recebimento não está em rascunho.') {
    super(message)
    this.name = 'ReceivingNotEditableError'
  }
}

export function receivingErrorMessage(error: unknown): string {
  if (error instanceof ReceivingValidationError) {
    return 'Verifique os campos e tente novamente.'
  }
  if (error instanceof ReceivingPermissionError) {
    return 'Você não tem permissão para esta ação.'
  }
  if (error instanceof ReceivingNotFoundError) {
    return 'Recebimento não encontrado.'
  }
  if (error instanceof ReceivingConflictError) {
    return error.message
  }
  if (error instanceof ReceivingNotEditableError) {
    return error.message
  }
  if (typeof error === 'object' && error && 'message' in error) {
    const message = String((error as { message?: string }).message ?? '')
    if (/Failed to fetch|NetworkError|fetch/i.test(message)) {
      return 'Falha de rede. Verifique a conexão e tente novamente.'
    }
    if (message.includes('purchase_not_receivable')) {
      return 'Pedido não está aprovado para recebimento.'
    }
    if (message.includes('receive_exceeds')) {
      return 'Quantidade excede o pendente do pedido.'
    }
    if (message.includes('no_items_to_receive')) {
      return 'Informe ao menos uma quantidade a receber.'
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
    throw new ReceivingConflictError('Conflito ao salvar o recebimento.')
  }
  if (code === 'PGRST116') {
    throw new ReceivingNotFoundError()
  }
  throw error
}
