import type { AnalyticsRecord } from './types'

export function sum(records: AnalyticsRecord[], field: 'amount' | 'quantity' | 'discount'): number {
  return records.reduce((total, record) => total + (record[field] ?? 0), 0)
}

export function count(records: AnalyticsRecord[]): number {
  return records.length
}

export function distinctCount(records: AnalyticsRecord[], field: keyof AnalyticsRecord): number {
  return new Set(records.map((record) => record[field]).filter(Boolean)).size
}

export function average(total: number, divisor: number): number {
  return divisor > 0 ? total / divisor : 0
}
