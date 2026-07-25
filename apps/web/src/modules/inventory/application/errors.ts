export class InventoryValidationError extends Error {
  readonly fieldErrors: Record<string, string>

  constructor(fieldErrors: Record<string, string>) {
    super('validation_failed')
    this.name = 'InventoryValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class PermissionError extends Error {
  constructor(message = 'permission_denied') {
    super(message)
    this.name = 'PermissionError'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'not_found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class InsufficientStockError extends Error {
  constructor(message = 'Estoque insuficiente para esta saída.') {
    super(message)
    this.name = 'InsufficientStockError'
  }
}

export class ProductArchivedError extends Error {
  constructor(
    message = 'Produto arquivado — restaure para registrar movimentos.',
  ) {
    super(message)
    this.name = 'ProductArchivedError'
  }
}

/** User-facing message for unexpected failures (never raw Supabase text). */
export function inventoryErrorMessage(error: unknown): string {
  if (error instanceof InventoryValidationError) {
    return 'Verifique os campos e tente novamente.'
  }
  if (error instanceof PermissionError) {
    return 'Você não tem permissão para esta ação.'
  }
  if (error instanceof NotFoundError) {
    return 'Produto ou movimento não encontrado.'
  }
  if (error instanceof InsufficientStockError) {
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

function errorText(error: unknown): string {
  if (typeof error !== 'object' || !error) return ''
  const parts: string[] = []
  if ('message' in error) parts.push(String((error as { message?: string }).message ?? ''))
  if ('details' in error) parts.push(String((error as { details?: string }).details ?? ''))
  if ('hint' in error) parts.push(String((error as { hint?: string }).hint ?? ''))
  if ('code' in error) parts.push(String((error as { code?: string }).code ?? ''))
  return parts.join(' ').toLowerCase()
}

/** Map PostgREST / RPC exception messages to domain errors. */
export function mapRepositoryError(error: unknown): never {
  const text = errorText(error)
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code)
      : ''

  if (text.includes('insufficient_stock')) {
    throw new InsufficientStockError()
  }
  if (text.includes('product_archived')) {
    throw new ProductArchivedError()
  }
  if (text.includes('product_not_found') || code === 'PGRST116') {
    throw new NotFoundError('product_not_found')
  }
  if (text.includes('invalid_quantity')) {
    throw new InventoryValidationError({
      quantity: 'Informe uma quantidade maior que zero.',
    })
  }
  if (text.includes('invalid_reason')) {
    throw new InventoryValidationError({
      reason: 'Informe um motivo válido.',
    })
  }
  if (text.includes('invalid_movement_type')) {
    throw new InventoryValidationError({
      type: 'Tipo de movimento inválido.',
    })
  }
  if (
    text.includes('not_authenticated') ||
    text.includes('not_org_member') ||
    code === '42501'
  ) {
    throw new PermissionError()
  }

  throw error
}
