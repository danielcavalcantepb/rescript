import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'

/**
 * Supported currencies — expand this allowlist to onboard new currencies.
 * Never hardcode currency checks outside this module / PriceList commands.
 */
export const MONEY_CURRENCIES = ['BRL'] as const
export type MoneyCurrency = (typeof MONEY_CURRENCIES)[number]

export function isSupportedCurrency(value: string): value is MoneyCurrency {
  return (MONEY_CURRENCIES as readonly string[]).includes(value)
}

export function assertSupportedCurrency(
  value: string,
): DomainResult<MoneyCurrency> {
  if (!isSupportedCurrency(value)) {
    return err('invalid_money', `Moeda não suportada: ${value}.`)
  }
  return ok(value)
}

/** Exact decimal money — scale up to 6 (CatalogDomainStrategy / ADR-0021). */
export type Money = {
  readonly currency: MoneyCurrency
  /** Normalized decimal string, e.g. "0", "10.5", "19.990000" → stored normalized. */
  readonly amount: string
}

export const MONEY_MAX_SCALE = 6

function normalizeDecimalString(raw: string): DomainResult<string> {
  const trimmed = raw.trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return err('invalid_money', 'Valor monetário inválido.')
  }
  const negative = trimmed.startsWith('-')
  const unsigned = negative ? trimmed.slice(1) : trimmed
  const [wholeRaw, fracRaw = ''] = unsigned.split('.')
  if (fracRaw.length > MONEY_MAX_SCALE) {
    return err(
      'invalid_money',
      `Valor monetário permite no máximo ${MONEY_MAX_SCALE} casas decimais.`,
    )
  }
  const whole = wholeRaw.replace(/^0+(?=\d)/, '') || '0'
  const frac = fracRaw.replace(/0+$/, '')
  const normalized = frac.length > 0 ? `${whole}.${frac}` : whole
  return ok(negative ? `-${normalized}` : normalized)
}

function toScaledBigInt(amount: string, scale: number): bigint {
  const negative = amount.startsWith('-')
  const unsigned = negative ? amount.slice(1) : amount
  const [whole, frac = ''] = unsigned.split('.')
  const padded = (frac + '0'.repeat(scale)).slice(0, scale)
  const asInt = BigInt(whole + padded)
  return negative ? -asInt : asInt
}

export function createMoney(
  amount: string | number,
  currency: MoneyCurrency = 'BRL',
): DomainResult<Money> {
  const raw = typeof amount === 'number' ? String(amount) : amount
  if (typeof amount === 'number' && !Number.isFinite(amount)) {
    return err('invalid_money', 'Valor monetário inválido.')
  }
  const normalized = normalizeDecimalString(raw)
  if (!normalized.ok) return normalized
  if (normalized.value.startsWith('-')) {
    return err('invalid_money', 'Preço de lista não pode ser negativo.')
  }
  return ok({ currency, amount: normalized.value })
}

export function moneyEquals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amount === b.amount
}

export function compareMoney(a: Money, b: Money): number {
  if (a.currency !== b.currency) {
    throw new Error('Cannot compare money with different currencies.')
  }
  const left = toScaledBigInt(a.amount, MONEY_MAX_SCALE)
  const right = toScaledBigInt(b.amount, MONEY_MAX_SCALE)
  if (left === right) return 0
  return left < right ? -1 : 1
}

export function isZeroMoney(money: Money): boolean {
  return money.amount === '0' || money.amount === '0.0'
}

/** Half-up display scale for BRL (2). Domain keeps full precision. */
export function formatMoneyDisplay(money: Money, scale = 2): string {
  const scaled = toScaledBigInt(money.amount, MONEY_MAX_SCALE)
  const factor = 10n ** BigInt(MONEY_MAX_SCALE - scale)
  const half = factor / 2n
  const adjusted =
    scaled >= 0n ? scaled + half : scaled - half
  const truncated = adjusted / factor
  const negative = truncated < 0n
  const abs = negative ? -truncated : truncated
  const asStr = abs.toString().padStart(scale + 1, '0')
  const whole = asStr.slice(0, -scale) || '0'
  const frac = asStr.slice(-scale)
  return `${negative ? '-' : ''}${whole}.${frac}`
}
