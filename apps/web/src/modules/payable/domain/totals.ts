import type {
  InstallmentInput,
  PayableInstallment,
  PayableTotals,
} from '#/modules/payable/domain/types'

function round4(n: number): string {
  return (Math.round(n * 10000) / 10000).toFixed(4)
}

/** Σ installment amounts must equal original amount. */
export function assertInstallmentsMatchTotal(
  originalAmount: string,
  installments: readonly InstallmentInput[],
): void {
  if (installments.length === 0) throw new Error('installments_required')
  const sum = installments.reduce((acc, i) => acc + Number(i.amount), 0)
  const expected = Number(originalAmount)
  if (!Number.isFinite(sum) || Math.abs(sum - expected) > 0.0001) {
    throw new Error('installments_total_mismatch')
  }
}

export function calculatePayableTotals(
  currency: string,
  originalAmount: string,
  installments: readonly PayableInstallment[],
): PayableTotals {
  const open = installments
    .filter((i) => i.status === 'open')
    .reduce((acc, i) => acc + Number(i.openBalance), 0)
  return {
    currency,
    originalAmount: round4(Number(originalAmount)),
    openBalance: round4(open),
  }
}

export function splitEqualInstallments(
  total: string,
  count: number,
  firstDueDate: string,
  intervalDays = 30,
): InstallmentInput[] {
  if (!Number.isInteger(count) || count < 1 || count > 60) {
    throw new Error('invalid_installment_count')
  }
  const totalN = Number(total)
  if (!Number.isFinite(totalN) || totalN <= 0) throw new Error('invalid_amount')
  const base = Math.floor((totalN / count) * 10000) / 10000
  const parts: InstallmentInput[] = []
  let allocated = 0
  const start = new Date(`${firstDueDate}T00:00:00.000Z`)
  for (let i = 0; i < count; i++) {
    const due = new Date(start)
    due.setUTCDate(due.getUTCDate() + intervalDays * i)
    const amount =
      i === count - 1
        ? round4(totalN - allocated)
        : round4(base)
    allocated += Number(amount)
    parts.push({
      dueDate: due.toISOString().slice(0, 10),
      amount,
    })
  }
  return parts
}
