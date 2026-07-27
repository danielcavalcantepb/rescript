import type {
  BrandResponse,
  CatalogProductDetailResponse,
  CatalogSearchHitResponse,
  CategoryResponse,
  PriceEntryResponse,
  PriceListDetailResponse,
  PriceListResponse,
  ProductResponse,
  ResolvedPriceResponse,
  UnitOfMeasureResponse,
  VariantResponse,
} from '#/modules/catalog/application/dto'
import { PriceResolutionPolicy } from '#/modules/catalog/domain/policies/price-resolution-policy'
import type { ResolvedPrice } from '#/modules/catalog/domain/policies/price-resolution-policy'
import type {
  Brand,
  Category,
  PriceList,
  PriceListEntry,
  Product,
  ProductVariant,
  UnitOfMeasure,
} from '#/modules/catalog/domain/types'

export function toVariantResponse(variant: ProductVariant): VariantResponse {
  const primary = variant.barcodes.find((b) => b.isPrimary)
  return {
    id: variant.id,
    productId: variant.productId,
    sku: variant.sku?.value ?? null,
    unitOfMeasureId: variant.unitOfMeasureId,
    combinationHash: variant.combinationHash,
    isDefault: variant.isDefault,
    tracksInventory: variant.tracksInventory,
    status: variant.status,
    attributeValues: variant.attributeValues.map((v) => ({
      attributeDefinitionId: v.attributeDefinitionId,
      optionId: v.optionId,
    })),
    primaryBarcode: primary?.barcode.value ?? null,
  }
}

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    organizationId: product.organizationId,
    name: product.name,
    description: product.description,
    brandId: product.brandId,
    primaryCategoryId: product.primaryCategoryId,
    topology: product.topology,
    status: product.status,
    variants: product.variants.map(toVariantResponse),
  }
}

export function toUnitOfMeasureResponse(
  unit: UnitOfMeasure,
): UnitOfMeasureResponse {
  return {
    id: unit.id,
    organizationId: unit.organizationId,
    code: unit.code,
    name: unit.name,
    precision: unit.precision,
    integerOnly: unit.integerOnly,
  }
}

export function toCatalogProductDetailResponse(
  product: Product,
  extras: {
    brandName: string | null
    categoryName: string | null
    unit: UnitOfMeasure | null
  },
): CatalogProductDetailResponse {
  const base = toProductResponse(product)
  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0] ?? null
  const primary = defaultVariant?.barcodes.find((b) => b.isPrimary)
  return {
    ...base,
    brandName: extras.brandName,
    categoryName: extras.categoryName,
    defaultSku: defaultVariant?.sku?.value ?? null,
    defaultUnitOfMeasureId:
      product.defaultUnitOfMeasureId ??
      defaultVariant?.unitOfMeasureId ??
      null,
    defaultUnitOfMeasureCode: extras.unit?.code ?? null,
    defaultUnitOfMeasureName: extras.unit?.name ?? null,
    variantCount: product.variants.length,
    primaryBarcode: primary?.barcode.value ?? null,
    createdAt: null,
    updatedAt: null,
  }
}

export function toBrandResponse(brand: Brand): BrandResponse {
  return {
    id: brand.id,
    organizationId: brand.organizationId,
    name: brand.name,
    status: brand.status,
  }
}

export function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    organizationId: category.organizationId,
    parentId: category.parentId,
    name: category.name,
    depth: category.depth,
    status: category.status,
  }
}

export function toPriceListResponse(list: PriceList): PriceListResponse {
  return {
    id: list.id,
    organizationId: list.organizationId,
    name: list.name,
    description: list.description,
    currency: list.currency,
    isDefault: list.isDefault,
    priority: list.priority,
    status: list.status,
    entryCount: list.entries.length,
  }
}

export function toPriceEntryResponse(
  entry: PriceListEntry,
  atInstant?: string,
): PriceEntryResponse {
  return {
    id: entry.id,
    priceListId: entry.priceListId,
    variantId: entry.variantId,
    amount: entry.amount.amount,
    currency: entry.amount.currency,
    validFrom: entry.validFrom,
    validTo: entry.validTo,
    validityState: atInstant
      ? PriceResolutionPolicy.classifyEntryValidity(
          entry.validFrom,
          entry.validTo,
          atInstant,
        )
      : undefined,
  }
}

export function toPriceListDetailResponse(
  list: PriceList,
  atInstant: string,
): PriceListDetailResponse {
  return {
    ...toPriceListResponse(list),
    entries: list.entries.map((e) => toPriceEntryResponse(e, atInstant)),
  }
}

export function toResolvedPriceResponse(
  resolved: ResolvedPrice,
): ResolvedPriceResponse {
  return {
    variantId: resolved.variantId,
    priceListId: resolved.priceListId,
    priceListName: resolved.priceListName,
    amount: resolved.amount.amount,
    currency: resolved.currency,
    validFrom: resolved.validFrom,
    validTo: resolved.validTo,
    entryId: resolved.entryId,
    priority: resolved.priority,
  }
}

export function toSearchHit(
  product: Product,
  variant: ProductVariant,
): CatalogSearchHitResponse {
  return {
    variantId: variant.id,
    productId: product.id,
    productName: product.name,
    variantSku: variant.sku?.value ?? null,
    brandId: product.brandId,
    categoryId: product.primaryCategoryId,
    status: variant.status,
  }
}
