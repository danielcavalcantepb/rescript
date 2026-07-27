import {
  PayableConflictError,
  PayableNotEditableError,
  PayableNotFoundError,
  PayablePermissionError,
  PayableValidationError,
} from '#/modules/payable/application/errors'
import type { PayableRpcError } from '#/modules/payable/ui/api/contracts'

export function toPayableRpcError(error: unknown): PayableRpcError {
  if (error instanceof PayableValidationError) {
    return {
      code: 'validation_failed',
      message: 'Verifique os campos e tente novamente.',
      fieldErrors: error.fieldErrors,
    }
  }
  if (error instanceof PayablePermissionError) {
    return {
      code: 'permission_denied',
      message: 'Você não tem permissão para esta ação.',
    }
  }
  if (error instanceof PayableNotFoundError) {
    return {
      code: 'payable_not_found',
      message: 'Conta a pagar não encontrada.',
    }
  }
  if (error instanceof PayableConflictError) {
    return { code: 'conflict', message: error.message }
  }
  if (error instanceof PayableNotEditableError) {
    return { code: 'not_editable', message: error.message }
  }
  if (error instanceof Error) {
    if (error.message.startsWith('invalid_payable_transition')) {
      return {
        code: 'invalid_transition',
        message: 'Transição de status não permitida.',
      }
    }
    if (
      error.message === 'not_authenticated' ||
      error.message === 'not_org_member'
    ) {
      return {
        code: error.message,
        message: 'Sessão inválida ou sem acesso à organização.',
      }
    }
  }
  return {
    code: 'unexpected',
    message: 'Não foi possível concluir a operação. Tente novamente.',
  }
}

export class PayableRpcClientError extends Error {
  readonly code: string
  readonly fieldErrors?: Record<string, string>

  constructor(error: PayableRpcError) {
    super(error.message)
    this.name = 'PayableRpcClientError'
    this.code = error.code
    this.fieldErrors = error.fieldErrors
  }
}

export function unwrapPayableRpc<T>(
  result: { ok: true; data: T } | { ok: false; error: PayableRpcError },
): T {
  if (!result.ok) throw new PayableRpcClientError(result.error)
  return result.data
}
