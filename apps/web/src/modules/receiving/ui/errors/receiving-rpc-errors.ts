import {
  ReceivingConflictError,
  ReceivingNotEditableError,
  ReceivingNotFoundError,
  ReceivingPermissionError,
  ReceivingValidationError,
} from '#/modules/receiving/application/errors'
import type { ReceivingRpcError } from '#/modules/receiving/ui/api/contracts'

export function toReceivingRpcError(error: unknown): ReceivingRpcError {
  if (error instanceof ReceivingValidationError) {
    return {
      code: 'validation_failed',
      message: 'Verifique os campos e tente novamente.',
      fieldErrors: error.fieldErrors,
    }
  }
  if (error instanceof ReceivingPermissionError) {
    return { code: 'permission_denied', message: 'Você não tem permissão para esta ação.' }
  }
  if (error instanceof ReceivingNotFoundError) {
    return { code: 'receipt_not_found', message: 'Recebimento não encontrado.' }
  }
  if (error instanceof ReceivingConflictError) {
    return { code: 'conflict', message: error.message }
  }
  if (error instanceof ReceivingNotEditableError) {
    return { code: 'not_editable', message: error.message }
  }
  if (error instanceof Error) {
    if (error.message.startsWith('invalid_receipt_transition')) {
      return {
        code: 'invalid_transition',
        message: 'Transição de status não permitida.',
      }
    }
    if (error.message === 'not_authenticated' || error.message === 'not_org_member') {
      return { code: error.message, message: 'Sessão inválida ou sem acesso à organização.' }
    }
    if (error.message.includes('purchase_not_receivable')) {
      return { code: 'purchase_not_receivable', message: 'Pedido não está aprovado para recebimento.' }
    }
    if (error.message.includes('receive_exceeds')) {
      return { code: 'receive_exceeds', message: 'Quantidade excede o pendente do pedido.' }
    }
    if (error.message.includes('no_items_to_receive')) {
      return { code: 'no_items_to_receive', message: 'Informe ao menos uma quantidade a receber.' }
    }
    if (error.message.includes('location_required')) {
      return { code: 'location_required', message: 'Local de estoque é obrigatório.' }
    }
  }
  return {
    code: 'unexpected',
    message: 'Não foi possível concluir a operação. Tente novamente.',
  }
}

export class ReceivingRpcClientError extends Error {
  readonly code: string
  readonly fieldErrors?: Record<string, string>

  constructor(error: ReceivingRpcError) {
    super(error.message)
    this.name = 'ReceivingRpcClientError'
    this.code = error.code
    this.fieldErrors = error.fieldErrors
  }
}

export function unwrapReceivingRpc<T>(
  result: { ok: true; data: T } | { ok: false; error: ReceivingRpcError },
): T {
  if (!result.ok) throw new ReceivingRpcClientError(result.error)
  return result.data
}
