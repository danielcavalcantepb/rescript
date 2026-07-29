import {
  CustomerArchivedError,
  CustomerConflictError,
  CustomerNotFoundError,
  CustomerPermissionError,
  CustomerValidationError,
} from '#/modules/customers/application/errors'
import type { CustomerRpcError } from '#/modules/customers/ui/api/contracts'

export function toCustomerRpcError(error: unknown): CustomerRpcError {
  if (error instanceof CustomerValidationError) {
    return {
      code: 'validation_failed',
      message: 'Verifique os campos e tente novamente.',
      fieldErrors: error.fieldErrors,
    }
  }
  if (error instanceof CustomerPermissionError) {
    return { code: 'permission_denied', message: 'Você não tem permissão para esta ação.' }
  }
  if (error instanceof CustomerNotFoundError) {
    return { code: 'customer_not_found', message: 'Cliente não encontrado.' }
  }
  if (error instanceof CustomerConflictError) {
    return { code: 'conflict', message: error.message }
  }
  if (error instanceof CustomerArchivedError) {
    return { code: 'customer_archived', message: error.message }
  }
  if (error instanceof Error) {
    if (error.message.startsWith('invalid_customer_transition')) {
      return {
        code: 'invalid_transition',
        message: 'Transição de status não permitida.',
      }
    }
    if (error.message === 'not_authenticated' || error.message === 'not_org_member') {
      return { code: error.message, message: 'Sessão inválida ou sem acesso à organização.' }
    }
    if (
      error.message === 'default_branch_not_found' ||
      error.message === 'default_branch_unavailable'
    ) {
      return {
        code: 'default_branch_unavailable',
        message:
          'Não foi possível preparar a unidade principal da empresa. Atualize a página e tente novamente.',
      }
    }
  }
  return {
    code: 'unexpected',
    message: 'Não foi possível concluir a operação. Tente novamente.',
  }
}

export class CustomerRpcClientError extends Error {
  readonly code: string
  readonly fieldErrors?: Record<string, string>

  constructor(error: CustomerRpcError) {
    super(error.message)
    this.name = 'CustomerRpcClientError'
    this.code = error.code
    this.fieldErrors = error.fieldErrors
  }
}

export function unwrapCustomerRpc<T>(
  result: { ok: true; data: T } | { ok: false; error: CustomerRpcError },
): T {
  if (!result.ok) throw new CustomerRpcClientError(result.error)
  return result.data
}
