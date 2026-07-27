import {
  PurchaseConflictError,
  PurchaseNotEditableError,
  PurchaseNotFoundError,
  PurchasePermissionError,
  PurchaseValidationError,
} from '#/modules/purchase/application/errors'
import type { PurchaseRpcError } from '#/modules/purchase/ui/api/contracts'

export function toPurchaseRpcError(error: unknown): PurchaseRpcError {
  if (error instanceof PurchaseValidationError) {
    return {
      code: 'validation_failed',
      message: 'Verifique os campos e tente novamente.',
      fieldErrors: error.fieldErrors,
    }
  }
  if (error instanceof PurchasePermissionError) {
    return { code: 'permission_denied', message: 'Você não tem permissão para esta ação.' }
  }
  if (error instanceof PurchaseNotFoundError) {
    return { code: 'purchase_not_found', message: 'Pedido de compra não encontrado.' }
  }
  if (error instanceof PurchaseConflictError) {
    return { code: 'conflict', message: error.message }
  }
  if (error instanceof PurchaseNotEditableError) {
    return { code: 'not_editable', message: error.message }
  }
  if (error instanceof Error) {
    if (error.message.startsWith('invalid_purchase_transition')) {
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

export class PurchaseRpcClientError extends Error {
  readonly code: string
  readonly fieldErrors?: Record<string, string>

  constructor(error: PurchaseRpcError) {
    super(error.message)
    this.name = 'PurchaseRpcClientError'
    this.code = error.code
    this.fieldErrors = error.fieldErrors
  }
}

export function unwrapPurchaseRpc<T>(
  result: { ok: true; data: T } | { ok: false; error: PurchaseRpcError },
): T {
  if (!result.ok) throw new PurchaseRpcClientError(result.error)
  return result.data
}
