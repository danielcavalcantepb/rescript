export type PriceHistoryRecord = {
  id: string
  organizationId: string
  priceListId: string
  variantId: string
  entryId: string | null
  amount: string
  currency: string
  effectiveAt: string
  recordedAt: string
  recordedBy: string
}

export type CatalogPriceHistoryPort = {
  listByOrganization(
    organizationId: string,
    query: {
      variantId?: string
      priceListId?: string
      limit?: number
    },
  ): Promise<PriceHistoryRecord[]>
}

export function createInMemoryPriceHistory(
  seed: PriceHistoryRecord[] = [],
): CatalogPriceHistoryPort & { records: PriceHistoryRecord[] } {
  const records = [...seed]
  return {
    records,
    async listByOrganization(organizationId, query) {
      let items = records.filter((r) => r.organizationId === organizationId)
      if (query.variantId) {
        items = items.filter((r) => r.variantId === query.variantId)
      }
      if (query.priceListId) {
        items = items.filter((r) => r.priceListId === query.priceListId)
      }
      items.sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt))
      const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
      return items.slice(0, limit).map((r) => structuredClone(r))
    },
  }
}
