export class CustomerValidationError extends Error {
  readonly fieldErrors: Record<string, string>

  constructor(fieldErrors: Record<string, string>) {
    super('validation_failed')
    this.name = 'CustomerValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class CustomerPermissionError extends Error {
  constructor(message = 'permission_denied') {
    super(message)
    this.name = 'CustomerPermissionError'
  }
}

export class CustomerNotFoundError extends Error {
  constructor() {
    super('customer_not_found')
    this.name = 'CustomerNotFoundError'
  }
}

export class CustomerConflictError extends Error {
  constructor(message = 'document_conflict') {
    super(message)
    this.name = 'CustomerConflictError'
  }
}

export class CustomerArchivedError extends Error {
  constructor(message = 'Cliente arquivado — restaure para editar.') {
    super(message)
    this.name = 'CustomerArchivedError'
  }
}

/** User-facing message for unexpected failures (never raw Supabase text). */
export function customerErrorMessage(error: unknown): string {
  if (error instanceof CustomerValidationError) {
    return 'Verifique os campos e tente novamente.'
  }
  if (error instanceof CustomerPermissionError) {
    return 'Você não tem permissão para esta ação.'
  }
  if (error instanceof CustomerNotFoundError) {
    return 'Cliente não encontrado.'
  }
  if (error instanceof CustomerConflictError) {
    return error.message
  }
  if (error instanceof CustomerArchivedError) {
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
    throw new CustomerConflictError(
      'Já existe um cliente com este documento nesta organização.',
    )
  }
  if (code === 'PGRST116') {
    throw new CustomerNotFoundError()
  }
  throw error
}
