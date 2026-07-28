import type { FiscalContext, FiscalResolution } from './tax-engine'
import { buildFiscalDocument, type FiscalDocumentDraft, type FiscalDocumentItemSnapshot } from './document-builder'

export type FiscalSourceType = 'SALES_ORDER' | 'GOODS_RECEIVING' | 'PURCHASE_RETURN' | 'INVENTORY_TRANSFER'
export type FiscalSourceStatus = 'eligible' | 'ineligible'
export type FiscalSourceItem = { context: FiscalContext; quantity: number; unit: string; variant: FiscalDocumentItemSnapshot['variant'] }
export type FiscalSource = { organizationId: string; sourceType: FiscalSourceType; sourceId: string; status: FiscalSourceStatus; type: FiscalDocumentDraft['type']; items: FiscalSourceItem[] }

export function assertFiscalSourceEligible(source: FiscalSource): void {
  if (source.status !== 'eligible') throw new Error('fiscal_source_ineligible')
  if (!source.organizationId || !source.sourceId || source.items.length === 0) throw new Error('fiscal_source_incomplete')
}

export function buildFiscalDocumentFromSource(source: FiscalSource, resolve: (context: FiscalContext) => FiscalResolution): FiscalDocumentDraft {
  assertFiscalSourceEligible(source)
  return buildFiscalDocument({ type: source.type, sourceId: source.sourceId, operationId: source.items[0].context.operationId, taxProfileId: source.items[0].context.taxProfileId, items: source.items }, resolve)
}
