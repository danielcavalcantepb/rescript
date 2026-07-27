import {
  SupplierArchivedError,
  SupplierConflictError,
  SupplierNotFoundError,
  SupplierPermissionError,
  SupplierValidationError,
} from '#/modules/suppliers/application/errors'
import type { SupplierRpcError } from '#/modules/suppliers/ui/api/contracts'

export function toSupplierRpcError(error: unknown): SupplierRpcError {
  if (error instanceof SupplierValidationError) {
    return {
      code: 'validation_failed',
      message: 'Verifique os campos e tente novamente.',
      fieldErrors: error.fieldErrors,
    }
  }
  if (error instanceof SupplierPermissionError) {
    return { code: 'permission_denied', message: 'Você não tem permissão para esta ação.' }
  }
  if (error instanceof SupplierNotFoundError) {
    return { code: 'supplier_not_found', message: 'Fornecedor não encontrado.' }
  }
  if (error instanceof SupplierConflictError) {
    return { code: 'conflict', message: error.message }
  }
  if (error instanceof SupplierArchivedError) {
    return { code: 'supplier_archived', message: error.message }
  }
  if (error instanceof Error) {
    if (error.message.startsWith('invalid_supplier_transition')) {
      return {
        code: 'invalid_transition',
        message: 'Transição de status não permitida.',
      }
    }
    if (error.message === 'not_authenticated' || error.message === 'not_org_member') {
      return { code: error.message, message: 'Sessão inválida ou sem acesso à organização.' }
    }
  }
  return {
    code: 'unexpected',
    message: 'Não foi possível concluir a operação. Tente novamente.',
  }
}

export class SupplierRpcClientError extends Error {
  readonly code: string
  readonly fieldErrors?: Record<string, string>

  constructor(error: SupplierRpcError) {
    super(error.message)
    this.name = 'SupplierRpcClientError'
    this.code = error.code
    this.fieldErrors = error.fieldErrors
  }
}

export function unwrapSupplierRpc<T>(
  result: { ok: true; data: T } | { ok: false; error: SupplierRpcError },
): T {
  if (!result.ok) throw new SupplierRpcClientError(result.error)
  return result.data
}
