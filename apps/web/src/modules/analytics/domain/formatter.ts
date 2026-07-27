import type { AnalyticsUnit } from './types'

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const number = new Intl.NumberFormat('pt-BR')

export function formatMetricValue(value: number | null, unit: AnalyticsUnit): string {
  if (value == null) return 'Dados insuficientes'
  if (unit === 'money') return money.format(value)
  if (unit === 'percent') return `${number.format(value)}%`
  return number.format(value)
}
