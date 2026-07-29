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
    const databaseCode =
      typeof (error as Error & { code?: unknown }).code === 'string'
        ? (error as Error & { code: string }).code
        : ''

    if (
      databaseCode === '42501' ||
      error.message === 'not_authenticated' ||
      error.message === 'not_org_member' ||
      /row-level security|permission denied/i.test(error.message)
    ) {
      return {
        code: 'permission_denied',
        message: 'Sua sessão não tem permissão para concluir este cadastro. Atualize a página e entre novamente.',
      }
    }

    if (
      databaseCode === '22023' ||
      /customer_scope_invalid|customer_acquisition_source_invalid/i.test(
        error.message,
      )
    ) {
      return {
        code: 'organization_scope_invalid',
        message: 'A unidade selecionada não está disponível para esta empresa. Atualize a página e tente novamente.',
      }
    }

    if (databaseCode === '23503') {
      return {
        code: 'reference_invalid',
        message: 'Um dado relacionado ao cliente não está mais disponível. Atualize a página e tente novamente.',
      }
    }

    if (error.message.startsWith('invalid_customer_transition')) {
      return {
        code: 'invalid_transition',
        message: 'Transição de status não permitida.',
      }
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
