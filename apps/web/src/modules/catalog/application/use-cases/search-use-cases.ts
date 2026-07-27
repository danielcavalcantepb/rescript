import type {
  CatalogSearchHitResponse,
  SearchCatalogQuery,
  SearchVariantsQuery,
} from '#/modules/catalog/application/dto'
import { CatalogPermissionError } from '#/modules/catalog/application/errors'
import {
  requireProductRead,
  type CatalogAppDeps,
} from '#/modules/catalog/application/deps'
import { toSearchHit } from '#/modules/catalog/application/mappers'
import { assertValid, validateSearch } from '#/modules/catalog/application/validation'

function normalize(text: string) {
  return text.trim().toLowerCase()
}

export async function searchCatalog(
  deps: CatalogAppDeps,
  query: SearchCatalogQuery,
): Promise<CatalogSearchHitResponse[]> {
  if (!requireProductRead(deps.can)) throw new CatalogPermissionError()
  assertValid(validateSearch(query))
  const q = normalize(query.text)
  const limit = query.limit ?? 50
  const products = await deps.products.listByOrganization(deps.organizationId)
  const hits: CatalogSearchHitResponse[] = []

  for (const product of products) {
    if (query.brandId && product.brandId !== query.brandId) continue
    if (query.categoryId && product.primaryCategoryId !== query.categoryId) {
      continue
    }
    const nameMatch = normalize(product.name).includes(q)
    for (const variant of product.variants) {
      if (variant.status === 'archived') continue
      const sku = variant.sku?.value.toLowerCase() ?? ''
      const barcodeMatch = variant.barcodes.some((b) =>
        b.barcode.value.toLowerCase().includes(q),
      )
      if (!q || nameMatch || sku.includes(q) || barcodeMatch) {
        hits.push(toSearchHit(product, variant))
      }
      if (hits.length >= limit) return hits
    }
  }
  return hits
}

export async function searchVariants(
  deps: CatalogAppDeps,
  query: SearchVariantsQuery,
): Promise<CatalogSearchHitResponse[]> {
  return searchCatalog(deps, {
    text: query.text,
    limit: query.limit,
  }).then((hits) =>
    query.productId
      ? hits.filter((h) => h.productId === query.productId)
      : hits,
  )
}
