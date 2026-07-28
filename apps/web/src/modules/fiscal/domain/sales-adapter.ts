import type { FiscalSource, FiscalSourceItem } from './source-contract'

export type SalesFiscalSourceInput = Omit<FiscalSource, 'source_type' | 'items'> & {
  items: FiscalSourceItem[]
}

/** Maps the canonical Sales source snapshot without reading Catalog or the database. */
export function toSalesFiscalSource(input: SalesFiscalSourceInput): FiscalSource {
  return { ...input, source_type: 'SALES_ORDER', items: input.items.map((item) => ({ ...item, metadata: { ...item.metadata } })) }
}
