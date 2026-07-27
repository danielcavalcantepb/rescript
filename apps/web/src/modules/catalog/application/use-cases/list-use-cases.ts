import type {
  BrandResponse,
  CatalogProductListItemResponse,
  CategoryResponse,
  ListCatalogProductsQuery,
  ListCatalogProductsResult,
  PriceListResponse,
  UnitOfMeasureResponse,
} from '#/modules/catalog/application/dto'
import { CatalogPermissionError } from '#/modules/catalog/application/errors'
import {
  requirePricesRead,
  requireProductRead,
  type CatalogAppDeps,
} from '#/modules/catalog/application/deps'
import {
  toBrandResponse,
  toCategoryResponse,
  toPriceListResponse,
  toUnitOfMeasureResponse,
} from '#/modules/catalog/application/mappers'
import { PriceResolutionPolicy } from '#/modules/catalog/domain/policies/price-resolution-policy'
import type { Product } from '#/modules/catalog/domain/types'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

function normalize(text: string) {
  return text.trim().toLowerCase()
}

export async function listBrands(
  deps: CatalogAppDeps,
): Promise<BrandResponse[]> {
  if (!requireProductRead(deps.can)) throw new CatalogPermissionError()
  const brands = await deps.brands.listByOrganization(deps.organizationId)
  return brands
    .filter((b) => b.status === 'active')
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map(toBrandResponse)
}

export async function listCategories(
  deps: CatalogAppDeps,
): Promise<CategoryResponse[]> {
  if (!requireProductRead(deps.can)) throw new CatalogPermissionError()
  const categories = await deps.categories.listByOrganization(
    deps.organizationId,
  )
  return categories
    .filter((c) => c.status === 'active')
    .sort(
      (a, b) =>
        a.depth - b.depth || a.name.localeCompare(b.name, 'pt-BR'),
    )
    .map(toCategoryResponse)
}

export async function listPriceLists(
  deps: CatalogAppDeps,
): Promise<PriceListResponse[]> {
  if (!requirePricesRead(deps.can) && !requireProductRead(deps.can)) {
    throw new CatalogPermissionError()
  }
  const lists = await deps.priceLists.listByOrganization(deps.organizationId)
  return lists
    .slice()
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        b.priority - a.priority ||
        a.name.localeCompare(b.name, 'pt-BR'),
    )
    .map(toPriceListResponse)
}

export async function listUnitsOfMeasure(
  deps: CatalogAppDeps,
): Promise<UnitOfMeasureResponse[]> {
  if (!requireProductRead(deps.can)) throw new CatalogPermissionError()
  const units = await deps.units.listAvailable(deps.organizationId)
  return units
    .sort(
      (a, b) =>
        a.code.localeCompare(b.code, 'pt-BR') ||
        a.name.localeCompare(b.name, 'pt-BR'),
    )
    .map(toUnitOfMeasureResponse)
}

export async function listProducts(
  deps: CatalogAppDeps,
  query: ListCatalogProductsQuery = {},
): Promise<ListCatalogProductsResult> {
  if (!requireProductRead(deps.can)) throw new CatalogPermissionError()

  const pageSize = Math.min(
    Math.max(query.pageSize ?? DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE,
  )
  const page = Math.max(query.page ?? 1, 1)
  const status = query.status ?? 'all'
  const sort = query.sort ?? 'name_asc'
  const q = normalize(query.text ?? '')

  const [products, brands, categories, defaultList] = await Promise.all([
    deps.products.listByOrganization(deps.organizationId),
    deps.brands.listByOrganization(deps.organizationId),
    deps.categories.listByOrganization(deps.organizationId),
    deps.priceLists.getDefault(deps.organizationId),
  ])

  const brandNameById = new Map(brands.map((b) => [b.id, b.name]))
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]))
  const at = deps.clock.nowIso()

  let filtered = products.filter((product) => {
    if (status !== 'all' && product.status !== status) return false
    if (query.brandId && product.brandId !== query.brandId) return false
    if (query.categoryId && product.primaryCategoryId !== query.categoryId) {
      return false
    }
    if (!q) return true
    if (normalize(product.name).includes(q)) return true
    return product.variants.some((variant) => {
      const sku = variant.sku?.value.toLowerCase() ?? ''
      if (sku.includes(q)) return true
      return variant.barcodes.some((b) =>
        b.barcode.value.toLowerCase().includes(q),
      )
    })
  })

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'name_desc') return b.name.localeCompare(a.name, 'pt-BR')
    if (sort === 'status') {
      return (
        a.status.localeCompare(b.status) ||
        a.name.localeCompare(b.name, 'pt-BR')
      )
    }
    return a.name.localeCompare(b.name, 'pt-BR')
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const slice = filtered.slice(start, start + pageSize)

  const items = slice.map((product) =>
    toListItem(product, brandNameById, categoryNameById, defaultList, at),
  )

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}

function toListItem(
  product: Product,
  brandNameById: Map<string, string>,
  categoryNameById: Map<string, string>,
  defaultList: Awaited<
    ReturnType<CatalogAppDeps['priceLists']['getDefault']>
  >,
  at: string,
): CatalogProductListItemResponse {
  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0] ?? null
  let basePrice: string | null = null
  let basePriceCurrency: string | null = null
  if (defaultList && defaultVariant) {
    const resolved = PriceResolutionPolicy.resolve(
      defaultList,
      defaultVariant.id,
      at,
    )
    if (resolved.ok) {
      basePrice = resolved.value.amount.amount
      basePriceCurrency = resolved.value.amount.currency
    }
  }

  return {
    id: product.id,
    name: product.name,
    sku: defaultVariant?.sku?.value ?? null,
    brandId: product.brandId,
    brandName: product.brandId
      ? (brandNameById.get(product.brandId) ?? null)
      : null,
    categoryId: product.primaryCategoryId,
    categoryName: product.primaryCategoryId
      ? (categoryNameById.get(product.primaryCategoryId) ?? null)
      : null,
    status: product.status,
    basePrice,
    basePriceCurrency,
    variantCount: product.variants.length,
    updatedAt: null,
  }
}
