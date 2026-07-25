import type { PermissionKey } from '@rescript/permissions'
import { ProductPermissionError } from '#/modules/products/application/errors'
import type {
  ListProductsQuery,
  ListProductsResult,
  ProductRepository,
} from '#/modules/products/domain/types'

type Can = (key: PermissionKey) => boolean

export async function listProducts(deps: {
  repository: ProductRepository
  can: Can
  organizationId: string
  query: ListProductsQuery
}): Promise<ListProductsResult> {
  if (!deps.can('products.read')) {
    throw new ProductPermissionError()
  }
  return deps.repository.list(deps.organizationId, deps.query)
}

/** Alias — search is list with `q` (advanced search later). */
export const searchProducts = listProducts
