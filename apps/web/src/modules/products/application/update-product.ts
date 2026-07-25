import type { PermissionKey } from '@rescript/permissions'
import {
  noopProductAudit,
  type ProductAuditPort,
} from '#/modules/products/application/audit'
import {
  ProductArchivedError,
  ProductNotFoundError,
  ProductPermissionError,
  ProductValidationError,
  mapRepositoryError,
} from '#/modules/products/application/errors'
import type {
  Product,
  ProductRepository,
  UpdateProductInput,
} from '#/modules/products/domain/types'
import {
  hasFieldErrors,
  validateUpdateProduct,
} from '#/modules/products/domain/validation'

type Can = (key: PermissionKey) => boolean

export async function updateProduct(deps: {
  repository: ProductRepository
  can: Can
  organizationId: string
  userId: string
  productId: string
  input: UpdateProductInput
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
  if (existing.status === 'inactive') throw new ProductArchivedError()

  const errors = validateUpdateProduct(deps.input)
  if (hasFieldErrors(errors)) throw new ProductValidationError(errors)

  try {
    const product = await deps.repository.update(
      deps.organizationId,
      deps.userId,
      deps.productId,
      deps.input,
    )
    ;(deps.audit ?? noopProductAudit).record({
      action: 'product.updated',
      organizationId: deps.organizationId,
      productId: product.id,
      actorUserId: deps.userId,
    })
    return product
  } catch (error) {
    mapRepositoryError(error)
  }
}
