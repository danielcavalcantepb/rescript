export class ProductValidationError extends Error {
  readonly fieldErrors: Record<string, string>

  constructor(fieldErrors: Record<string, string>) {
    super('validation_failed')
    this.name = 'ProductValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class ProductPermissionError extends Error {
  constructor(message = 'permission_denied') {
    super(message)
    this.name = 'ProductPermissionError'
  }
}

export class ProductNotFoundError extends Error {
  constructor() {
    super('product_not_found')
    this.name = 'ProductNotFoundError'
  }
}

export class ProductConflictError extends Error {
  constructor(message = 'sku_conflict') {
    super(message)
    this.name = 'ProductConflictError'
  }
}

export class ProductArchivedError extends Error {
  constructor(message = 'Produto arquivado — restaure para editar.') {
    super(message)
    this.name = 'ProductArchivedError'
  }
}

/** User-facing message for unexpected failures (never raw Supabase text). */
export function productErrorMessage(error: unknown): string {
  if (error instanceof ProductValidationError) {
    return 'Verifique os campos e tente novamente.'
  }
  if (error instanceof ProductPermissionError) {
    return 'Você não tem permissão para esta ação.'
  }
  if (error instanceof ProductNotFoundError) {
    return 'Produto não encontrado.'
  }
  if (error instanceof ProductConflictError) {
    return error.message
  }
  if (error instanceof ProductArchivedError) {
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
    throw new ProductConflictError(
      'Já existe um produto com este SKU nesta organização.',
    )
  }
  if (code === 'PGRST116') {
    throw new ProductNotFoundError()
  }
  throw error
}
