import type { AnalyticsDataset, AnalyticsQuery } from '../domain/types'

export type AnalyticsProvider = {
  loadDataset(query: AnalyticsQuery): Promise<AnalyticsDataset>
}
