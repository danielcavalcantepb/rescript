import type { PermissionKey } from '@rescript/permissions'
import {
  noopProductAudit,
  type ProductAuditPort,
} from '#/modules/products/application/audit'
import {
  ProductPermissionError,
  ProductValidationError,
  mapRepositoryError,
} from '#/modules/products/application/errors'
import type {
  CreateProductInput,
  Product,
  ProductRepository,
} from '#/modules/products/domain/types'
import {
  hasFieldErrors,
  validateCreateProduct,
} from '#/modules/products/domain/validation'

type Can = (key: PermissionKey) => boolean

export async function createProduct(deps: {
  repository: ProductRepository
  can: Can
  organizationId: string
  userId: string
  input: CreateProductInput
  audit?: ProductAuditPort
}): Promise<Product> {
  if (!deps.can('products.create') && !deps.can('products.write')) {
    throw new ProductPermissionError()
  }
  const errors = validateCreateProduct(deps.input)
  if (hasFieldErrors(errors)) throw new ProductValidationError(errors)

  try {
    const product = await deps.repository.create(
      deps.organizationId,
      deps.userId,
      deps.input,
    )
    ;(deps.audit ?? noopProductAudit).record({
      action: 'product.created',
      organizationId: deps.organizationId,
      productId: product.id,
      actorUserId: deps.userId,
    })
    return product
  } catch (error) {
    mapRepositoryError(error)
  }
}
