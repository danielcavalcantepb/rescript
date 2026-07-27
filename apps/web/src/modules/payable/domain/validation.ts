import type {
  CreatePayableInput,
  InstallmentInput,
  UpdatePayableInput,
} from '#/modules/payable/domain/types'

export type FieldErrors = Record<string, string>

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function validateInstallments(
  installments: InstallmentInput[],
): FieldErrors {
  const errors: FieldErrors = {}
  if (installments.length === 0) {
    errors.installments = 'Informe ao menos uma parcela.'
    return errors
  }
  installments.forEach((inst, index) => {
    if (!isIsoDate(inst.dueDate)) {
      errors[`installments.${index}.dueDate`] = 'Vencimento inválido.'
    }
    const amount = Number(inst.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      errors[`installments.${index}.amount`] = 'Valor da parcela inválido.'
    }
  })
  return errors
}

export function validateCreatePayable(input: CreatePayableInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.goodsReceiptId?.trim()) {
    errors.goodsReceiptId = 'Recebimento obrigatório.'
  }
  if (input.issueDate && !isIsoDate(input.issueDate)) {
    errors.issueDate = 'Data de emissão inválida.'
  }
  if (input.notes && input.notes.length > 4000) {
    errors.notes = 'Observações devem ter no máximo 4000 caracteres.'
  }
  if (input.installments) {
    Object.assign(errors, validateInstallments(input.installments))
  }
  return errors
}

export function validateUpdatePayable(input: UpdatePayableInput): FieldErrors {
  const errors: FieldErrors = {}
  if (input.issueDate !== undefined && !isIsoDate(input.issueDate)) {
    errors.issueDate = 'Data de emissão inválida.'
  }
  if (input.notes !== undefined && input.notes !== null && input.notes.length > 4000) {
    errors.notes = 'Observações devem ter no máximo 4000 caracteres.'
  }
  return errors
}
