import type {
  ArchiveableStatus,
  CatalogLifecycleStatus,
} from '#/modules/catalog/domain/status'
import type {
  AttributeDefinition,
  AttributeOption,
  AttributeValueType,
  Brand,
  Category,
  PriceList,
  PriceListEntry,
  Product,
  ProductTopology,
  ProductVariant,
  ProductVariantAxis,
  VariantAttributeValue,
  VariantBarcode,
} from '#/modules/catalog/domain/types'
import type { BarcodeType } from '#/modules/catalog/domain/value-objects/barcode'
import type { Money } from '#/modules/catalog/domain/value-objects/money'
import type { Quantity } from '#/modules/catalog/domain/value-objects/quantity'
import type { Sku } from '#/modules/catalog/domain/value-objects/sku'
import { CatalogConflictError } from '#/modules/catalog/application/errors'
import type {
  AttributeAggregateRows,
  AttributeDefinitionRow,
  AttributeOptionRow,
  BrandRow,
  CategoryRow,
  PriceListAggregateRows,
  PriceListEntryRow,
  PriceListRow,
  ProductAggregateRows,
  ProductRow,
  ProductVariantAttributeValueRow,
  ProductVariantBarcodeRow,
  ProductVariantRow,
} from '#/modules/catalog/infrastructure/supabase/persistence-types'

/**
 * Reconstitution mappers (Row → Domain).
 * Structural only — no domain factories / create events.
 * Reject structurally invalid persisted state instead of inventing defaults.
 */

/** Normalize PostgREST numeric (string | number) to decimal string. */
export function numericToDecimalString(value: string | number): string {
  const raw = typeof value === 'number' ? String(value) : value.trim()
  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new CatalogConflictError('invalid_persisted_numeric')
  }
  const [wholeRaw, fracRaw = ''] = raw.replace(/^-/, '').split('.')
  const whole = wholeRaw.replace(/^0+(?=\d)/, '') || '0'
  const frac = fracRaw.replace(/0+$/, '')
  const unsigned = frac.length > 0 ? `${whole}.${frac}` : whole
  return raw.startsWith('-') ? `-${unsigned}` : unsigned
}

export function asQuantity(value: string | number, fallbackPrecision = 6): Quantity {
  const amount = numericToDecimalString(value)
  const frac = amount.includes('.') ? (amount.split('.')[1] ?? '') : ''
  return {
    amount,
    precision: Math.min(fallbackPrecision, frac.length),
  }
}

export function asSku(value: string | null | undefined): Sku | null {
  if (value == null || value === '') return null
  return { value }
}

export function asMoney(
  amount: string | number,
  currency: string | null | undefined = 'BRL',
): Money {
  if (currency != null && currency !== 'BRL') {
    throw new CatalogConflictError('invalid_persisted_currency')
  }
  return {
    currency: 'BRL',
    amount: numericToDecimalString(amount),
  }
}

export function asLifecycleStatus(
  value: string | null | undefined,
): CatalogLifecycleStatus {
  if (value === 'active' || value === 'archived' || value === 'draft') {
    return value
  }
  throw new CatalogConflictError('invalid_persisted_lifecycle')
}

export function asArchiveableStatus(
  value: string | null | undefined,
): ArchiveableStatus {
  if (value === 'archived' || value === 'active') return value
  throw new CatalogConflictError('invalid_persisted_status')
}

export function inferTopology(axesLength: number): ProductTopology {
  return axesLength > 0 ? 'variable' : 'simple'
}

export function legacyProductStatus(
  lifecycle: CatalogLifecycleStatus,
): 'active' | 'inactive' {
  return lifecycle === 'archived' ? 'inactive' : 'active'
}

type CompatibleBrandRow = Omit<
  BrandRow,
  'slug' | 'description' | 'sort_order'
> &
  Partial<Pick<BrandRow, 'slug' | 'description' | 'sort_order'>>

type CompatibleCategoryRow = Omit<
  CategoryRow,
  'slug' | 'description' | 'sort_order'
> &
  Partial<Pick<CategoryRow, 'slug' | 'description' | 'sort_order'>>

export function mapBrand(row: CompatibleBrandRow): Brand {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    normalizedName: row.normalized_name,
    slug: row.slug ?? row.normalized_name.replace(/\s+/g, '-'),
    description: row.description ?? null,
    sortOrder: row.sort_order ?? 0,
    status: asArchiveableStatus(row.status),
  }
}

export function mapCategory(row: CompatibleCategoryRow): Category {
  return {
    id: row.id,
    organizationId: row.organization_id,
    parentId: row.parent_id,
    name: row.name,
    normalizedName: row.normalized_name,
    slug: row.slug ?? row.normalized_name.replace(/\s+/g, '-'),
    description: row.description ?? null,
    sortOrder: row.sort_order ?? 0,
    status: asArchiveableStatus(row.status),
    depth: row.depth,
  }
}

export function mapAttributeOption(row: AttributeOptionRow): AttributeOption {
  return {
    id: row.id,
    definitionId: row.definition_id,
    label: row.label,
    normalizedLabel: row.normalized_label,
    status: asArchiveableStatus(row.status),
    sortOrder: row.sort_order,
  }
}

export function mapAttributeDefinition(
  rows: AttributeAggregateRows,
): AttributeDefinition {
  return {
    id: rows.definition.id,
    organizationId: rows.definition.organization_id,
    name: rows.definition.name,
    normalizedName: rows.definition.normalized_name,
    valueType: rows.definition.value_type as AttributeValueType,
    isVariantAxis: rows.definition.is_variant_axis,
    isFilterable: rows.definition.is_filterable,
    sortOrder: rows.definition.sort_order,
    status: asArchiveableStatus(rows.definition.status),
    options: rows.options
      .map(mapAttributeOption)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

function mapBarcode(row: ProductVariantBarcodeRow): VariantBarcode {
  return {
    id: row.id,
    barcode: {
      type: row.barcode_type as BarcodeType,
      value: row.barcode,
    },
    isPrimary: row.is_primary,
  }
}

function mapAttributeValue(
  row: ProductVariantAttributeValueRow,
): VariantAttributeValue {
  return {
    attributeDefinitionId: row.attribute_definition_id,
    optionId: row.option_id,
  }
}

export function mapVariant(
  row: ProductVariantRow,
  barcodes: ProductVariantBarcodeRow[],
  attributeValues: ProductVariantAttributeValueRow[],
): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    organizationId: row.organization_id,
    sku: asSku(row.sku),
    barcodes: barcodes.map(mapBarcode),
    unitOfMeasureId: row.unit_of_measure_id,
    attributeValues: attributeValues.map(mapAttributeValue),
    combinationHash: row.combination_hash,
    isDefault: row.is_default,
    tracksInventory: row.tracks_inventory,
    minSaleQty: asQuantity(row.min_sale_qty),
    saleMultiple: asQuantity(row.sale_multiple),
    status: asLifecycleStatus(row.status),
  }
}

/**
 * Authorized reconstitution of the Product aggregate from persistence rows.
 * Distinguishes from domain factories (create) — no create events emitted.
 *
 * Inferred fields (Phase 2 schema):
 * - topology ← axes.length > 0 ? variable : simple (deterministic)
 * - defaultUnitOfMeasureId ← default variant UOM, else first variant UOM
 */
export function mapProductAggregate(rows: ProductAggregateRows): Product {
  if (rows.product.organization_id == null || rows.product.id == null) {
    throw new CatalogConflictError('invalid_persisted_product')
  }
  if (!rows.product.name?.trim()) {
    throw new CatalogConflictError('invalid_persisted_product_name')
  }
  if (rows.product.lifecycle_status == null) {
    throw new CatalogConflictError('invalid_persisted_lifecycle')
  }

  const axesById = new Map(rows.axes.map((a) => [a.id, a]))
  const optionsByAxis = new Map<string, string[]>()
  for (const link of rows.axisOptions) {
    const list = optionsByAxis.get(link.axis_id) ?? []
    list.push(link.option_id)
    optionsByAxis.set(link.axis_id, list)
  }

  const axes: ProductVariantAxis[] = [...axesById.values()]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((axis) => ({
      attributeDefinitionId: axis.attribute_definition_id,
      allowedOptionIds: optionsByAxis.get(axis.id) ?? [],
      sortOrder: axis.sort_order,
    }))

  const barcodesByVariant = new Map<string, ProductVariantBarcodeRow[]>()
  for (const barcode of rows.barcodes) {
    if (barcode.organization_id !== rows.product.organization_id) {
      throw new CatalogConflictError('cross_tenant_barcode')
    }
    const list = barcodesByVariant.get(barcode.variant_id) ?? []
    list.push(barcode)
    barcodesByVariant.set(barcode.variant_id, list)
  }

  const attrsByVariant = new Map<string, ProductVariantAttributeValueRow[]>()
  for (const value of rows.attributeValues) {
    const list = attrsByVariant.get(value.variant_id) ?? []
    list.push(value)
    attrsByVariant.set(value.variant_id, list)
  }

  for (const variant of rows.variants) {
    if (variant.organization_id !== rows.product.organization_id) {
      throw new CatalogConflictError('cross_tenant_variant')
    }
    if (variant.product_id !== rows.product.id) {
      throw new CatalogConflictError('variant_product_mismatch')
    }
  }

  const variants = rows.variants.map((variant) =>
    mapVariant(
      variant,
      barcodesByVariant.get(variant.id) ?? [],
      attrsByVariant.get(variant.id) ?? [],
    ),
  )

  const defaults = variants.filter((v) => v.isDefault)
  if (defaults.length > 1) {
    throw new CatalogConflictError('multiple_default_variants')
  }

  const defaultVariant = defaults[0] ?? variants[0] ?? null
  const topology = inferTopology(axes.length)

  return {
    id: rows.product.id,
    organizationId: rows.product.organization_id,
    name: rows.product.name,
    description: rows.product.description,
    brandId: rows.product.brand_id,
    primaryCategoryId: rows.product.primary_category_id,
    defaultUnitOfMeasureId: defaultVariant?.unitOfMeasureId ?? null,
    topology,
    status: asLifecycleStatus(rows.product.lifecycle_status),
    axes,
    variants,
  }
}

export function mapPriceEntry(row: PriceListEntryRow): PriceListEntry {
  return {
    id: row.id,
    priceListId: row.price_list_id,
    variantId: row.variant_id,
    amount: asMoney(row.amount, row.currency),
    validFrom: row.valid_from,
    validTo: row.valid_to,
  }
}

export function mapPriceList(rows: PriceListAggregateRows): PriceList {
  const list = rows.list as PriceListRow & {
    priority?: number | null
    description?: string | null
  }
  const currency =
    list.currency === 'BRL' ? ('BRL' as const) : ('BRL' as const)
  return {
    id: list.id,
    organizationId: list.organization_id,
    name: list.name,
    description: list.description ?? null,
    currency,
    isDefault: list.is_default,
    priority: list.priority ?? (list.is_default ? 100 : 0),
    status: asArchiveableStatus(list.status),
    entries: rows.entries.map(mapPriceEntry),
  }
}

export type ActorWriteContext = {
  actorUserId: string
  nowIso: string
}

export function brandToRow(
  brand: Brand,
  ctx: ActorWriteContext,
  existing: BrandRow | null,
): BrandRow {
  const archived = brand.status === 'archived'
  return {
    id: brand.id,
    organization_id: brand.organizationId,
    name: brand.name,
    normalized_name: brand.normalizedName,
    slug: brand.slug ?? brand.normalizedName.replace(/\s+/g, '-'),
    description: brand.description ?? null,
    sort_order: brand.sortOrder ?? 0,
    status: brand.status,
    archived_at: archived
      ? (existing?.archived_at ?? ctx.nowIso)
      : null,
    archived_by: archived
      ? (existing?.archived_by ?? ctx.actorUserId)
      : null,
    created_at: existing?.created_at ?? ctx.nowIso,
    updated_at: ctx.nowIso,
    created_by: existing?.created_by ?? ctx.actorUserId,
    updated_by: ctx.actorUserId,
  }
}

export function categoryToRow(
  category: Category,
  ctx: ActorWriteContext,
  existing: CategoryRow | null,
): CategoryRow {
  const archived = category.status === 'archived'
  return {
    id: category.id,
    organization_id: category.organizationId,
    parent_id: category.parentId,
    name: category.name,
    normalized_name: category.normalizedName,
    slug: category.slug ?? category.normalizedName.replace(/\s+/g, '-'),
    description: category.description ?? null,
    sort_order: category.sortOrder ?? 0,
    depth: category.depth,
    status: category.status,
    archived_at: archived
      ? (existing?.archived_at ?? ctx.nowIso)
      : null,
    archived_by: archived
      ? (existing?.archived_by ?? ctx.actorUserId)
      : null,
    created_at: existing?.created_at ?? ctx.nowIso,
    updated_at: ctx.nowIso,
    created_by: existing?.created_by ?? ctx.actorUserId,
    updated_by: ctx.actorUserId,
  }
}

export function attributeDefinitionToRow(
  definition: AttributeDefinition,
  ctx: ActorWriteContext,
  existing: AttributeDefinitionRow | null,
): AttributeDefinitionRow {
  const archived = definition.status === 'archived'
  return {
    id: definition.id,
    organization_id: definition.organizationId,
    name: definition.name,
    normalized_name: definition.normalizedName,
    value_type: definition.valueType,
    is_variant_axis:
      definition.isVariantAxis ?? definition.valueType === 'option',
    is_filterable: definition.isFilterable ?? true,
    sort_order: definition.sortOrder ?? 0,
    status: definition.status,
    archived_at: archived
      ? (existing?.archived_at ?? ctx.nowIso)
      : null,
    archived_by: archived
      ? (existing?.archived_by ?? ctx.actorUserId)
      : null,
    created_at: existing?.created_at ?? ctx.nowIso,
    updated_at: ctx.nowIso,
    created_by: existing?.created_by ?? ctx.actorUserId,
    updated_by: ctx.actorUserId,
  }
}

export function attributeOptionToRow(
  option: AttributeOption,
  ctx: ActorWriteContext,
  existing: AttributeOptionRow | null,
): AttributeOptionRow {
  const archived = option.status === 'archived'
  return {
    id: option.id,
    definition_id: option.definitionId,
    label: option.label,
    normalized_label: option.normalizedLabel,
    sort_order: option.sortOrder,
    status: option.status,
    archived_at: archived
      ? (existing?.archived_at ?? ctx.nowIso)
      : null,
    archived_by: archived
      ? (existing?.archived_by ?? ctx.actorUserId)
      : null,
    created_at: existing?.created_at ?? ctx.nowIso,
    updated_at: ctx.nowIso,
    created_by: existing?.created_by ?? ctx.actorUserId,
    updated_by: ctx.actorUserId,
  }
}

export function productToRow(
  product: Product,
  ctx: ActorWriteContext,
  existing: ProductRow | null,
): ProductRow {
  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0]
  const sku =
    defaultVariant?.sku?.value ??
    existing?.sku ??
    `CAT-${product.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`
  const unit = existing?.unit ?? 'un'
  const archived = product.status === 'archived'

  return {
    id: product.id,
    organization_id: product.organizationId,
    name: product.name,
    description: product.description,
    sku,
    category: existing?.category ?? null,
    unit,
    status: legacyProductStatus(product.status),
    brand_id: product.brandId,
    primary_category_id: product.primaryCategoryId,
    lifecycle_status: product.status,
    archived_at: archived
      ? (existing?.archived_at ?? ctx.nowIso)
      : null,
    archived_by: archived
      ? (existing?.archived_by ?? ctx.actorUserId)
      : null,
    created_at: existing?.created_at ?? ctx.nowIso,
    updated_at: ctx.nowIso,
    created_by: existing?.created_by ?? ctx.actorUserId,
    updated_by: ctx.actorUserId,
  }
}

export function variantToRow(
  variant: ProductVariant,
  ctx: ActorWriteContext,
  existing: ProductVariantRow | null,
): ProductVariantRow {
  const archived = variant.status === 'archived'
  return {
    id: variant.id,
    organization_id: variant.organizationId,
    product_id: variant.productId,
    sku: variant.sku?.value ?? null,
    unit_of_measure_id: variant.unitOfMeasureId,
    combination_hash: variant.combinationHash,
    is_default: variant.isDefault,
    tracks_inventory: variant.tracksInventory,
    min_sale_qty: Number(variant.minSaleQty.amount),
    sale_multiple: Number(variant.saleMultiple.amount),
    status: variant.status,
    archived_at: archived
      ? (existing?.archived_at ?? ctx.nowIso)
      : null,
    archived_by: archived
      ? (existing?.archived_by ?? ctx.actorUserId)
      : null,
    created_at: existing?.created_at ?? ctx.nowIso,
    updated_at: ctx.nowIso,
    created_by: existing?.created_by ?? ctx.actorUserId,
    updated_by: ctx.actorUserId,
  }
}

export function priceListToRow(
  list: PriceList,
  ctx: ActorWriteContext,
  existing: PriceListRow | null,
): PriceListRow & { priority: number; description: string | null } {
  const archived = list.status === 'archived'
  return {
    id: list.id,
    organization_id: list.organizationId,
    name: list.name,
    description: list.description,
    currency: list.currency,
    is_default: list.isDefault,
    priority: list.priority,
    status: list.status,
    archived_at: archived
      ? (existing?.archived_at ?? ctx.nowIso)
      : null,
    archived_by: archived
      ? (existing?.archived_by ?? ctx.actorUserId)
      : null,
    created_at: existing?.created_at ?? ctx.nowIso,
    updated_at: ctx.nowIso,
    created_by: existing?.created_by ?? ctx.actorUserId,
    updated_by: ctx.actorUserId,
  }
}

export function priceEntryToRow(
  entry: PriceListEntry,
  organizationId: string,
  ctx: ActorWriteContext,
  existing: PriceListEntryRow | null,
): PriceListEntryRow {
  return {
    id: entry.id,
    organization_id: organizationId,
    price_list_id: entry.priceListId,
    variant_id: entry.variantId,
    amount: Number(entry.amount.amount),
    currency: entry.amount.currency,
    valid_from: entry.validFrom,
    valid_to: entry.validTo,
    created_at: existing?.created_at ?? ctx.nowIso,
    updated_at: ctx.nowIso,
    created_by: existing?.created_by ?? ctx.actorUserId,
    updated_by: ctx.actorUserId,
  }
}

/** Strip PostgREST filter-breaking characters (shared with search). */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,.()"'\\]/g, ' ')
    .replace(/%/g, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
