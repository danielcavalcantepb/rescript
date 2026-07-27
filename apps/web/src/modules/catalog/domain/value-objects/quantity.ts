import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'

/** Quantity tied to UOM precision — reject excess decimals (never silent round). */
export type Quantity = {
  readonly amount: string
  readonly precision: number
}

export function createQuantity(
  raw: string | number,
  precision: number,
): DomainResult<Quantity> {
  if (!Number.isInteger(precision) || precision < 0 || precision > 6) {
    return err('invalid_quantity', 'Precisão de quantidade deve estar entre 0 e 6.')
  }
  const text = typeof raw === 'number' ? String(raw) : raw.trim().replace(',', '.')
  if (typeof raw === 'number' && !Number.isFinite(raw)) {
    return err('invalid_quantity', 'Quantidade inválida.')
  }
  if (!/^\d+(\.\d+)?$/.test(text)) {
    return err('invalid_quantity', 'Quantidade inválida.')
  }
  const [, frac = ''] = text.split('.')
  if (frac.length > precision) {
    return err(
      'invalid_quantity',
      `Quantidade excede a precisão permitida (${precision}).`,
    )
  }
  if (precision === 0 && text.includes('.')) {
    return err('invalid_quantity', 'Quantidade deve ser inteira para esta unidade.')
  }
  const [wholeRaw, fracRaw = ''] = text.split('.')
  const whole = wholeRaw.replace(/^0+(?=\d)/, '') || '0'
  const normalizedFrac = fracRaw.replace(/0+$/, '')
  const amount =
    normalizedFrac.length > 0 ? `${whole}.${normalizedFrac}` : whole
  return ok({ amount, precision })
}

export function quantityRespectsMinAndMultiple(
  quantity: Quantity,
  minSaleQty: Quantity,
  saleMultiple: Quantity,
): boolean {
  const q = Number(quantity.amount)
  const min = Number(minSaleQty.amount)
  const multiple = Number(saleMultiple.amount)
  if (!Number.isFinite(q) || !Number.isFinite(min) || !Number.isFinite(multiple)) {
    return false
  }
  if (q < min) return false
  if (multiple <= 0) return false
  const ratio = q / multiple
  return Math.abs(ratio - Math.round(ratio)) < 1e-9
}
