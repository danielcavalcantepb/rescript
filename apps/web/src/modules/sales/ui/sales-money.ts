const DECIMAL_PATTERN = /^-?\d+(?:\.\d{0,2})?$/

export function decimalToCents(value: string) {
  const normalized = value.trim().replace(',', '.')
  if (!DECIMAL_PATTERN.test(normalized)) return 0
  const negative = normalized.startsWith('-')
  const unsigned = negative ? normalized.slice(1) : normalized
  const [whole, fraction = ''] = unsigned.split('.')
  const cents = Number.parseInt(whole, 10) * 100 + Number.parseInt(fraction.padEnd(2, '0'), 10)
  return negative ? -cents : cents
}

export function lineTotalCents(quantity: string, unitPrice: string, discount = '0') {
  const normalizedQuantity = quantity.trim().replace(',', '.')
  if (!/^\d+(?:\.\d{0,3})?$/.test(normalizedQuantity)) return 0
  const [whole, fraction = ''] = normalizedQuantity.split('.')
  const thousandths =
    Number.parseInt(whole, 10) * 1_000 + Number.parseInt(fraction.padEnd(3, '0'), 10)
  const gross = Math.round((thousandths * decimalToCents(unitPrice)) / 1_000)
  return Math.max(0, gross - decimalToCents(discount))
}

export function formatCents(cents: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}
