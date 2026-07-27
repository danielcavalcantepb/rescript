export class SupplierValidationError extends Error {
  readonly fieldErrors: Record<string, string>

  constructor(fieldErrors: Record<string, string>) {
    super('validation_failed')
    this.name = 'SupplierValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class SupplierPermissionError extends Error {
  constructor(message = 'permission_denied') {
    super(message)
    this.name = 'SupplierPermissionError'
  }
}

export class SupplierNotFoundError extends Error {
  constructor() {
    super('supplier_not_found')
    this.name = 'SupplierNotFoundError'
  }
}

export class SupplierConflictError extends Error {
  constructor(message = 'document_conflict') {
    super(message)
    this.name = 'SupplierConflictError'
  }
}

export class SupplierArchivedError extends Error {
  constructor(message = 'Fornecedor arquivado — restaure para editar.') {
    super(message)
    this.name = 'SupplierArchivedError'
  }
}

/** User-facing message for unexpected failures (never raw Supabase text). */
export function supplierErrorMessage(error: unknown): string {
  if (error instanceof SupplierValidationError) {
    return 'Verifique os campos e tente novamente.'
  }
  if (error instanceof SupplierPermissionError) {
    return 'Você não tem permissão para esta ação.'
  }
  if (error instanceof SupplierNotFoundError) {
    return 'Fornecedor não encontrado.'
  }
  if (error instanceof SupplierConflictError) {
    return error.message
  }
  if (error instanceof SupplierArchivedError) {
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
    throw new SupplierConflictError(
      'Já existe um fornecedor com este documento nesta organização.',
    )
  }
  if (code === 'PGRST116') {
    throw new SupplierNotFoundError()
  }
  throw error
}
