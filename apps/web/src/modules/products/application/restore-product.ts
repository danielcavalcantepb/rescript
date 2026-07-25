import type { PermissionKey } from '@rescript/permissions'
import {
  noopProductAudit,
  type ProductAuditPort,
} from '#/modules/products/application/audit'
import {
  ProductNotFoundError,
  ProductPermissionError,
  mapRepositoryError,
} from '#/modules/products/application/errors'
import type { Product, ProductRepository } from '#/modules/products/domain/types'

type Can = (key: PermissionKey) => boolean

export async function restoreProduct(deps: {
  repository: ProductRepository
  can: Can
  organizationId: string
  userId: string
  productId: string
  audit?: ProductAuditPort
}): Promise<Product> {
  if (!deps.can('products.edit') && !deps.can('products.write')) {
    throw new ProductPermissionError()
  }

  const existing = await deps.repository.getById(
    deps.organizationId,
    deps.productId,
  )
  if (!existing) throw new ProductNotFoundError()

  try {
    const product = await deps.repository.restore(
      deps.organizationId,
      deps.userId,
      deps.productId,
    )
    ;(deps.audit ?? noopProductAudit).record({
      action: 'product.restored',
      organizationId: deps.organizationId,
      productId: product.id,
      actorUserId: deps.userId,
    })
    return product
  } catch (error) {
    mapRepositoryError(error)
  }
}
