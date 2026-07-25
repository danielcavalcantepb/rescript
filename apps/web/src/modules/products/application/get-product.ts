import type { PermissionKey } from '@rescript/permissions'
import {
  ProductNotFoundError,
  ProductPermissionError,
} from '#/modules/products/application/errors'
import type { Product, ProductRepository } from '#/modules/products/domain/types'

type Can = (key: PermissionKey) => boolean

export async function getProduct(deps: {
  repository: ProductRepository
  can: Can
  organizationId: string
  productId: string
}): Promise<Product> {
  if (!deps.can('products.read')) {
    throw new ProductPermissionError()
  }
  const product = await deps.repository.getById(
    deps.organizationId,
    deps.productId,
  )
  if (!product) throw new ProductNotFoundError()
  return product
}
