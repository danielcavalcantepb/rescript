import type {
  CatalogProductDetailResponse,
  CreateProductCommand,
  LifecycleProductCommand,
  ProductLifecycleAction,
  ProductLifecycleResponse,
  ProductResponse,
  RenameProductCommand,
  UpdateProductCommand,
} from '#/modules/catalog/application/dto'
import {
  CatalogNotFoundError,
  CatalogPermissionError,
  throwIfDomainError,
} from '#/modules/catalog/application/errors'
import {
  requireProductArchive,
  requireProductEdit,
  requireProductPublish,
  requireProductRead,
  requireProductRestore,
  requireProductWrite,
  type CatalogAppDeps,
} from '#/modules/catalog/application/deps'
import type { CatalogLifecycleAction } from '#/modules/catalog/application/ports/lifecycle-audit'
import {
  toCatalogProductDetailResponse,
  toProductResponse,
} from '#/modules/catalog/application/mappers'
import {
  assertValid,
  validateCreateProduct,
  validateRenameProduct,
  validateUpdateProduct,
} from '#/modules/catalog/application/validation'
import { createSimpleProduct } from '#/modules/catalog/domain/factories/product-factory'
import { createVariableProduct } from '#/modules/catalog/domain/factories/variant-matrix-factory'
import {
  activateProduct as activateProductDomain,
  archiveProduct as archiveProductDomain,
  restoreProduct as restoreProductDomain,
} from '#/modules/catalog/domain/product-lifecycle'
import { IdentifierPolicy } from '#/modules/catalog/domain/policies/identifier-policy'
import type { AttributeValueType } from '#/modules/catalog/domain/types'
import type { BarcodeType } from '#/modules/catalog/domain/value-objects/barcode'

async function loadProduct(deps: CatalogAppDeps, productId: string) {
  const product = await deps.products.getById(deps.organizationId, productId)
  if (!product) throw new CatalogNotFoundError('product_not_found')
  return product
}

async function priceContextFor(deps: CatalogAppDeps, product: {
  variants: Array<{ id: string }>
}) {
  const list = await deps.priceLists.getDefault(deps.organizationId)
  const map = new Map<string, boolean>()
  for (const variant of product.variants) {
    const has =
      list?.entries.some(
        (e) => e.variantId === variant.id && e.validTo === null,
      ) ?? false
    map.set(variant.id, has)
  }
  return { hasEffectivePriceByVariantId: map }
}

export async function createProduct(
  deps: CatalogAppDeps,
  command: CreateProductCommand,
): Promise<ProductResponse> {
  if (!requireProductWrite(deps.can)) throw new CatalogPermissionError()
  assertValid(validateCreateProduct(command))

  const unit = await deps.units.getById(
    deps.organizationId,
    command.unitOfMeasureId,
  )
  if (!unit) throw new CatalogNotFoundError('unit_of_measure_not_found')

  const ids = () => deps.ids.next()
  const isVariable = Boolean(command.axes && command.axes.length > 0)

  if (isVariable) {
    for (const axis of command.axes!) {
      const def = await deps.attributes.getById(
        deps.organizationId,
        axis.attributeDefinitionId,
      )
      if (!def) throw new CatalogNotFoundError('attribute_definition_not_found')
    }
    const created = throwIfDomainError(
      createVariableProduct(
        {
          organizationId: deps.organizationId,
          name: command.name,
          description: command.description,
          brandId: command.brandId,
          primaryCategoryId: command.primaryCategoryId,
          defaultUnitOfMeasureId: command.unitOfMeasureId,
          skuPrefix: command.skuPrefix,
          tracksInventory: command.tracksInventory,
          axes: command.axes!.map((a) => ({
            attributeDefinitionId: a.attributeDefinitionId,
            valueType: a.valueType as AttributeValueType,
            allowedOptionIds: a.allowedOptionIds,
          })),
        },
        ids,
      ),
    )
    const existingSkus = new Set(
      await deps.products.listSkus(deps.organizationId),
    )
    for (const variant of created.product.variants) {
      if (variant.sku) {
        throwIfDomainError(
          IdentifierPolicy.assertSkuUnique(variant.sku, existingSkus),
        )
        existingSkus.add(variant.sku.value)
      }
    }
    await deps.products.save(created.product)
    deps.events.append(created.events)
    return toProductResponse(created.product)
  }

  const barcode =
    command.barcode?.type && command.barcode.value
      ? {
          type: command.barcode.type as BarcodeType,
          value: command.barcode.value,
        }
      : null

  const created = throwIfDomainError(
    createSimpleProduct(
      {
        organizationId: deps.organizationId,
        name: command.name,
        description: command.description,
        brandId: command.brandId,
        primaryCategoryId: command.primaryCategoryId,
        sku: command.sku ?? '',
        unitOfMeasureId: command.unitOfMeasureId,
        barcode,
        tracksInventory: command.tracksInventory,
      },
      ids,
    ),
  )

  const sku = created.product.variants[0]!.sku!
  throwIfDomainError(
    IdentifierPolicy.assertSkuUnique(
      sku,
      new Set(await deps.products.listSkus(deps.organizationId)),
    ),
  )
  if (barcode) {
    const parsed = throwIfDomainError(
      IdentifierPolicy.parseBarcode(barcode.type, barcode.value),
    )
    throwIfDomainError(
      IdentifierPolicy.assertBarcodeUnique(
        parsed,
        new Set(await deps.products.listBarcodes(deps.organizationId)),
      ),
    )
  }

  await deps.products.save(created.product)
  deps.events.append(created.events)
  return toProductResponse(created.product)
}

export async function updateProduct(
  deps: CatalogAppDeps,
  command: UpdateProductCommand,
): Promise<ProductResponse> {
  if (!requireProductEdit(deps.can)) throw new CatalogPermissionError()
  assertValid(validateUpdateProduct(command))
  const product = await loadProduct(deps, command.productId)
  if (product.status === 'archived') {
    throw new CatalogPermissionError('product_archived')
  }

  const next = {
    ...product,
    name: command.name !== undefined ? command.name.trim() : product.name,
    description:
      command.description !== undefined
        ? command.description?.trim() || null
        : product.description,
    brandId: command.brandId !== undefined ? command.brandId : product.brandId,
    primaryCategoryId:
      command.primaryCategoryId !== undefined
        ? command.primaryCategoryId
        : product.primaryCategoryId,
  }
  if (next.brandId) {
    const brand = await deps.brands.getById(deps.organizationId, next.brandId)
    if (!brand) throw new CatalogNotFoundError('brand_not_found')
  }
  if (next.primaryCategoryId) {
    const category = await deps.categories.getById(
      deps.organizationId,
      next.primaryCategoryId,
    )
    if (!category) throw new CatalogNotFoundError('category_not_found')
  }
  await deps.products.save(next)
  deps.events.append([
    {
      type: 'ProductUpdated',
      organizationId: deps.organizationId,
      productId: next.id,
    },
  ])
  return toProductResponse(next)
}

export async function renameProduct(
  deps: CatalogAppDeps,
  command: RenameProductCommand,
): Promise<ProductResponse> {
  assertValid(validateRenameProduct(command))
  return updateProduct(deps, {
    productId: command.productId,
    name: command.name,
  })
}

function sanitizeReason(reason: string | null | undefined): string | null {
  if (reason == null) return null
  const trimmed = reason.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 500)
}

async function recordLifecycle(
  deps: CatalogAppDeps,
  input: {
    productId: string
    fromStatus: string
    toStatus: string
    action: CatalogLifecycleAction
    reason?: string | null
  },
) {
  await deps.lifecycleAudit.append({
    organizationId: deps.organizationId,
    productId: input.productId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    action: input.action,
    reason: sanitizeReason(input.reason),
    actorUserId: deps.userId,
    occurredAt: deps.clock.nowIso(),
  })
}

function availableLifecycleActions(
  status: string,
  can: CatalogAppDeps['can'],
): ProductLifecycleAction[] {
  const actions: ProductLifecycleAction[] = []
  if (status === 'draft' && requireProductPublish(can)) {
    actions.push('publish')
  }
  if (
    (status === 'draft' || status === 'active') &&
    requireProductArchive(can)
  ) {
    actions.push(status === 'active' ? 'deactivate' : 'archive')
  }
  if (status === 'archived' && requireProductRestore(can)) {
    actions.push('restore')
  }
  return actions
}

/**
 * Soft-archive Product (draft|active → archived). Never hard-deletes.
 */
export async function archiveProduct(
  deps: CatalogAppDeps,
  command: LifecycleProductCommand,
): Promise<ProductResponse> {
  if (!requireProductArchive(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  const fromStatus = product.status
  const result = throwIfDomainError(archiveProductDomain(product))
  await deps.products.save(result.product)
  deps.events.append(result.events)
  await recordLifecycle(deps, {
    productId: product.id,
    fromStatus,
    toStatus: result.product.status,
    action: fromStatus === 'active' ? 'deactivate' : 'archive',
    reason: command.reason,
  })
  return toProductResponse(result.product)
}

/** Desativar = arquivar a partir de active (mesmo soft-archive). */
export async function deactivateProduct(
  deps: CatalogAppDeps,
  command: LifecycleProductCommand,
): Promise<ProductResponse> {
  if (!requireProductArchive(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  if (product.status !== 'active') {
    throw new CatalogPermissionError('invalid_lifecycle_action')
  }
  return archiveProduct(deps, command)
}

/**
 * Publish / activate: draft → active only.
 * Archived products must be restored first (no composite restore+activate).
 */
export async function activateProduct(
  deps: CatalogAppDeps,
  command: LifecycleProductCommand,
): Promise<ProductResponse> {
  if (!requireProductPublish(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  if (product.status === 'archived') {
    throw new CatalogPermissionError('restore_required_before_publish')
  }
  const fromStatus = product.status
  const prices = await priceContextFor(deps, product)
  const result = throwIfDomainError(activateProductDomain(product, prices))
  await deps.products.save(result.product)
  deps.events.append(result.events)
  await recordLifecycle(deps, {
    productId: product.id,
    fromStatus,
    toStatus: result.product.status,
    action: 'publish',
    reason: command.reason,
  })
  return toProductResponse(result.product)
}

/** Alias of activateProduct — Catalog “Publicar”. */
export async function publishProduct(
  deps: CatalogAppDeps,
  command: LifecycleProductCommand,
): Promise<ProductResponse> {
  return activateProduct(deps, command)
}

/** Restore soft-archived Product to draft (re-publish required). */
export async function restoreProduct(
  deps: CatalogAppDeps,
  command: LifecycleProductCommand,
): Promise<ProductResponse> {
  if (!requireProductRestore(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  const fromStatus = product.status
  const result = throwIfDomainError(restoreProductDomain(product))
  await deps.products.save(result.product)
  deps.events.append(result.events)
  await recordLifecycle(deps, {
    productId: product.id,
    fromStatus,
    toStatus: result.product.status,
    action: 'restore',
    reason: command.reason,
  })
  return toProductResponse(result.product)
}

export async function getLifecycle(
  deps: CatalogAppDeps,
  productId: string,
): Promise<ProductLifecycleResponse> {
  if (!requireProductRead(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, productId)
  const history = await deps.lifecycleAudit.listByProduct(
    deps.organizationId,
    productId,
  )
  return {
    productId: product.id,
    status: product.status,
    availableActions: availableLifecycleActions(product.status, deps.can),
    history: history.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      action: h.action,
      reason: h.reason,
      actorUserId: h.actorUserId,
      occurredAt: h.occurredAt,
    })),
  }
}

export async function getProduct(
  deps: CatalogAppDeps,
  productId: string,
): Promise<ProductResponse> {
  if (!requireProductRead(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, productId)
  return toProductResponse(product)
}

export async function getProductDetail(
  deps: CatalogAppDeps,
  productId: string,
): Promise<CatalogProductDetailResponse> {
  if (!requireProductRead(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, productId)
  const [brand, category, unit] = await Promise.all([
    product.brandId
      ? deps.brands.getById(deps.organizationId, product.brandId)
      : null,
    product.primaryCategoryId
      ? deps.categories.getById(deps.organizationId, product.primaryCategoryId)
      : null,
    (() => {
      const uomId =
        product.defaultUnitOfMeasureId ??
        product.variants.find((v) => v.isDefault)?.unitOfMeasureId ??
        product.variants[0]?.unitOfMeasureId ??
        null
      return uomId
        ? deps.units.getById(deps.organizationId, uomId)
        : Promise.resolve(null)
    })(),
  ])
  return toCatalogProductDetailResponse(product, {
    brandName: brand?.name ?? null,
    categoryName: category?.name ?? null,
    unit,
  })
}
