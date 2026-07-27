import type { Tables } from '@rescript/database'

/** Persistence DTOs — snake_case row shapes used by mappers only. */

export type BrandRow = Tables<'brand'>
export type CategoryRow = Tables<'category'>
export type AttributeDefinitionRow = Tables<'attribute_definition'>
export type AttributeOptionRow = Tables<'attribute_option'>
export type ProductRow = Tables<'product'>
export type ProductVariantRow = Tables<'product_variant'>
export type ProductVariantAxisRow = Tables<'product_variant_axis'>
export type ProductVariantBarcodeRow = Tables<'product_variant_barcode'>
export type ProductVariantAttributeValueRow =
  Tables<'product_variant_attribute_value'>
export type PriceListRow = Tables<'price_list'>
export type PriceListEntryRow = Tables<'price_list_entry'>

export type ProductVariantAxisOptionRow = {
  axis_id: string
  option_id: string
}

export type ProductAggregateRows = {
  product: ProductRow
  variants: ProductVariantRow[]
  axes: ProductVariantAxisRow[]
  axisOptions: ProductVariantAxisOptionRow[]
  barcodes: ProductVariantBarcodeRow[]
  attributeValues: ProductVariantAttributeValueRow[]
}

export type PriceListAggregateRows = {
  list: PriceListRow
  entries: PriceListEntryRow[]
}

export type AttributeAggregateRows = {
  definition: AttributeDefinitionRow
  options: AttributeOptionRow[]
}
