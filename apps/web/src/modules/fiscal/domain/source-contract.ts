export const FISCAL_SOURCE_TYPES = ['SALES_ORDER', 'GOODS_RECEIVING', 'PURCHASE_RETURN', 'INVENTORY_TRANSFER'] as const
export type FiscalSourceType = (typeof FISCAL_SOURCE_TYPES)[number]

export type FiscalSourceItem = {
  product_variant_id: string
  sku: string | null
  quantity: number
  unit: string
  warehouse: string | null
  metadata: Record<string, unknown>
}

export type FiscalSource = {
  organization_id: string
  source_type: FiscalSourceType
  source_id: string
  source_number: string
  fiscal_date: string
  responsible_user_id: string
  fiscal_operation_id: string
  tax_profile_id: string
  origin_state: string | null
  destination_state: string | null
  items: FiscalSourceItem[]
}

export type FiscalContext = {
  organizationId: string
  operationId: string
  taxProfileId: string
  variantId: string
  originState: string | null
  destinationState: string | null
}

export function mapFiscalSourceItem(item: FiscalSourceItem): FiscalSourceItem {
  return { ...item, metadata: { ...item.metadata } }
}

export function mapFiscalSourceToContext(source: FiscalSource, item: FiscalSourceItem): FiscalContext {
  return {
    organizationId: source.organization_id,
    operationId: source.fiscal_operation_id,
    taxProfileId: source.tax_profile_id,
    variantId: item.product_variant_id,
    originState: source.origin_state,
    destinationState: source.destination_state,
  }
}

export const SourceTypeRegistry = Object.freeze({
  SALES_ORDER: 'SALES_ORDER',
  GOODS_RECEIVING: 'GOODS_RECEIVING',
  PURCHASE_RETURN: 'PURCHASE_RETURN',
  INVENTORY_TRANSFER: 'INVENTORY_TRANSFER',
} satisfies Record<FiscalSourceType, FiscalSourceType>)
