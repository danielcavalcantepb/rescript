import type { ArchiveableStatus, CatalogLifecycleStatus } from '#/modules/catalog/domain/status'
import type { Barcode, BarcodeType } from '#/modules/catalog/domain/value-objects/barcode'
import type { Money } from '#/modules/catalog/domain/value-objects/money'
import type { Quantity } from '#/modules/catalog/domain/value-objects/quantity'
import type { Sku } from '#/modules/catalog/domain/value-objects/sku'

export type OrganizationId = string
export type ProductId = string
export type VariantId = string
export type BrandId = string
export type CategoryId = string
export type AttributeDefinitionId = string
export type AttributeOptionId = string
export type UnitOfMeasureId = string
export type PriceListId = string
export type PriceListEntryId = string
export type VariantBarcodeId = string

export type AttributeValueType =
  | 'option'
  | 'text'
  | 'decimal'
  | 'boolean'
  | 'date'

export type Brand = {
  id: BrandId
  organizationId: OrganizationId
  name: string
  normalizedName: string
  status: ArchiveableStatus
}

export type Category = {
  id: CategoryId
  organizationId: OrganizationId
  parentId: CategoryId | null
  name: string
  normalizedName: string
  status: ArchiveableStatus
  /** 0 = root */
  depth: number
}

export type AttributeOption = {
  id: AttributeOptionId
  definitionId: AttributeDefinitionId
  label: string
  normalizedLabel: string
  status: ArchiveableStatus
  sortOrder: number
}

export type AttributeDefinition = {
  id: AttributeDefinitionId
  organizationId: OrganizationId
  name: string
  normalizedName: string
  valueType: AttributeValueType
  status: ArchiveableStatus
  options: AttributeOption[]
}

export type UnitOfMeasure = {
  id: UnitOfMeasureId
  /** null = platform default */
  organizationId: OrganizationId | null
  code: string
  name: string
  precision: number
  integerOnly: boolean
}

export type VariantAttributeValue = {
  attributeDefinitionId: AttributeDefinitionId
  optionId: AttributeOptionId
}

export type VariantBarcode = {
  id: VariantBarcodeId
  barcode: Barcode
  isPrimary: boolean
}

export type ProductVariant = {
  id: VariantId
  productId: ProductId
  organizationId: OrganizationId
  sku: Sku | null
  barcodes: VariantBarcode[]
  unitOfMeasureId: UnitOfMeasureId | null
  attributeValues: VariantAttributeValue[]
  combinationHash: string
  isDefault: boolean
  tracksInventory: boolean
  minSaleQty: Quantity
  saleMultiple: Quantity
  status: CatalogLifecycleStatus
}

export type ProductVariantAxis = {
  attributeDefinitionId: AttributeDefinitionId
  /** Allowed option ids for this product axis */
  allowedOptionIds: AttributeOptionId[]
  sortOrder: number
}

export type ProductTopology = 'simple' | 'variable'

export type Product = {
  id: ProductId
  organizationId: OrganizationId
  name: string
  description: string | null
  brandId: BrandId | null
  primaryCategoryId: CategoryId | null
  defaultUnitOfMeasureId: UnitOfMeasureId | null
  topology: ProductTopology
  status: CatalogLifecycleStatus
  axes: ProductVariantAxis[]
  variants: ProductVariant[]
}

/** Product Aggregate = Product root including axes + variants. */
export type ProductAggregate = Product

export type PriceListEntry = {
  id: PriceListEntryId
  priceListId: PriceListId
  variantId: VariantId
  amount: Money
  /** ISO-8601 instant — domain treats as opaque string */
  validFrom: string
  validTo: string | null
}

export type PriceList = {
  id: PriceListId
  organizationId: OrganizationId
  name: string
  description: string | null
  currency: Money['currency']
  isDefault: boolean
  /** Higher value wins when resolving across multiple active lists. */
  priority: number
  status: ArchiveableStatus
  entries: PriceListEntry[]
}

export type IdGenerator = () => string

export type CreateSimpleProductInput = {
  organizationId: OrganizationId
  name: string
  description?: string | null
  brandId?: BrandId | null
  primaryCategoryId?: CategoryId | null
  sku: string
  unitOfMeasureId: UnitOfMeasureId
  barcode?: { type: BarcodeType; value: string } | null
  tracksInventory?: boolean
}

export type VariantMatrixAxisInput = {
  attributeDefinitionId: AttributeDefinitionId
  /** Must be valueType option */
  valueType: AttributeValueType
  allowedOptionIds: AttributeOptionId[]
}

export type CreateVariableProductInput = {
  organizationId: OrganizationId
  name: string
  description?: string | null
  brandId?: BrandId | null
  primaryCategoryId?: CategoryId | null
  defaultUnitOfMeasureId: UnitOfMeasureId
  axes: VariantMatrixAxisInput[]
  /** Optional SKU prefix; factory appends combination labels or index */
  skuPrefix?: string
  tracksInventory?: boolean
}
