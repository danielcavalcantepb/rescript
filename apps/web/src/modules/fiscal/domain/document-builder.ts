import type { FiscalContext, FiscalResolution } from './tax-engine'

export type FiscalDocumentItemSnapshot = FiscalResolution & {
  quantity: number
  unit: string
  variant: { id: string; name: string; sku?: string }
}

export type FiscalDocumentDraft = {
  type: 'sale' | 'purchase' | 'purchase_return' | 'sales_return' | 'transfer'
  sourceId: string
  operationId: string
  taxProfileId: string
  items: FiscalDocumentItemSnapshot[]
}

export function buildFiscalDocument(
  input: Omit<FiscalDocumentDraft, 'items'> & { items: Array<{ context: FiscalContext; quantity: number; unit: string; variant: FiscalDocumentItemSnapshot['variant'] }> },
  resolve: (context: FiscalContext) => FiscalResolution,
): FiscalDocumentDraft {
  if (input.items.length === 0) throw new Error('fiscal_document_without_items')
  return {
    type: input.type,
    sourceId: input.sourceId,
    operationId: input.operationId,
    taxProfileId: input.taxProfileId,
    items: input.items.map(({ context, quantity, unit, variant }) => {
      if (quantity <= 0) throw new Error('invalid_quantity')
      return { ...resolve(context), quantity, unit, variant }
    }),
  }
}
