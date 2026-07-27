import type { AnalyticsComparison } from './types'

export function compareMetric(current: number | null, previous: number | null): AnalyticsComparison {
  if (current == null || previous == null) {
    return {
      previousValue: previous,
      variationPercent: null,
      label: 'Sem base comparativa',
      trend: 'unknown',
    }
  }
  if (previous === 0) {
    return {
      previousValue: previous,
      variationPercent: current === 0 ? 0 : null,
      label: current === 0 ? 'Estável vs período anterior' : 'Sem base anterior',
      trend: current === 0 ? 'flat' : 'unknown',
    }
  }
  const variationPercent = ((current - previous) / Math.abs(previous)) * 100
  return {
    previousValue: previous,
    variationPercent,
    label: `${variationPercent >= 0 ? '+' : ''}${variationPercent.toFixed(1)}% vs período anterior`,
    trend: variationPercent > 0 ? 'up' : variationPercent < 0 ? 'down' : 'flat',
  }
}
