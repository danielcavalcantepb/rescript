import type { CatalogDomainError } from '#/modules/catalog/domain/errors'

export class CatalogValidationError extends Error {
  readonly fieldErrors: Record<string, string>

  constructor(fieldErrors: Record<string, string>) {
    super('validation_failed')
    this.name = 'CatalogValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class CatalogPermissionError extends Error {
  constructor(message = 'permission_denied') {
    super(message)
    this.name = 'CatalogPermissionError'
  }
}

export class CatalogNotFoundError extends Error {
  constructor(message = 'not_found') {
    super(message)
    this.name = 'CatalogNotFoundError'
  }
}

export class CatalogConflictError extends Error {
  constructor(message = 'conflict') {
    super(message)
    this.name = 'CatalogConflictError'
  }
}

export class CatalogDomainRuleError extends Error {
  readonly code: string

  constructor(error: CatalogDomainError) {
    super(error.message)
    this.name = 'CatalogDomainRuleError'
    this.code = error.code
  }
}

export function throwIfDomainError<T>(
  result: { ok: true; value: T } | { ok: false; error: CatalogDomainError },
): T {
  if (!result.ok) throw new CatalogDomainRuleError(result.error)
  return result.value
}
