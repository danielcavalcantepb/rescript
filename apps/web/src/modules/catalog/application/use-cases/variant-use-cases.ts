import type {
  CreateVariantCommand,
  UpdateVariantCommand,
  VariantIdCommand,
  VariantResponse,
} from '#/modules/catalog/application/dto'
import {
  CatalogConflictError,
  CatalogNotFoundError,
  CatalogPermissionError,
  throwIfDomainError,
} from '#/modules/catalog/application/errors'
import {
  requireVariantArchive,
  requireVariantCreate,
  requireVariantEdit,
  requireVariantRead,
  requireVariantRestore,
  type CatalogAppDeps,
} from '#/modules/catalog/application/deps'
import { toVariantResponse } from '#/modules/catalog/application/mappers'
import {
  assertValid,
  validateCreateVariant,
  validateUpdateVariant,
} from '#/modules/catalog/application/validation'
import { createBarcode } from '#/modules/catalog/domain/value-objects/barcode'
import { createSku } from '#/modules/catalog/domain/value-objects/sku'
import { createQuantity } from '#/modules/catalog/domain/value-objects/quantity'
import {
  combinationHash,
  VariantCombinationPolicy,
} from '#/modules/catalog/domain/policies/combination-policy'
import { IdentifierPolicy } from '#/modules/catalog/domain/policies/identifier-policy'
import { ProductTopologyPolicy } from '#/modules/catalog/domain/policies/topology-policy'
import type { CatalogDomainEvent } from '#/modules/catalog/domain/events'
import type { ProductVariant } from '#/modules/catalog/domain/types'
import type { BarcodeType } from '#/modules/catalog/domain/value-objects/barcode'

async function loadProduct(deps: CatalogAppDeps, productId: string) {
  const product = await deps.products.getById(deps.organizationId, productId)
  if (!product) throw new CatalogNotFoundError('product_not_found')
  return product
}

function assertProductMutable(product: { status: string }) {
  if (product.status === 'archived') {
    throw new CatalogPermissionError('product_archived')
  }
}

export async function getVariant(
  deps: CatalogAppDeps,
  command: VariantIdCommand,
): Promise<VariantResponse> {
  if (!requireVariantRead(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  const variant = product.variants.find((v) => v.id === command.variantId)
  if (!variant) throw new CatalogNotFoundError('variant_not_found')
  return toVariantResponse(variant)
}

export async function createVariant(
  deps: CatalogAppDeps,
  command: CreateVariantCommand,
): Promise<VariantResponse> {
  if (!requireVariantCreate(deps.can)) throw new CatalogPermissionError()
  assertValid(validateCreateVariant(command))

  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)
  if (product.topology === 'simple') {
    throw new CatalogConflictError(
      'Produto simples não aceita variantes adicionais.',
    )
  }
  throwIfDomainError(
    ProductTopologyPolicy.canChangeCombinationOrUom({
      hasOperationalHistory: false,
    }),
  )

  const sku = throwIfDomainError(createSku(command.sku))
  throwIfDomainError(
    IdentifierPolicy.assertSkuUnique(
      sku,
      new Set(await deps.products.listSkus(deps.organizationId)),
    ),
  )

  const values = command.attributeValues
  throwIfDomainError(
    VariantCombinationPolicy.assertValuesMatchAxes(product.axes, values),
  )
  const hash = combinationHash(values)
  throwIfDomainError(
    VariantCombinationPolicy.assertUniqueHashes([
      ...product.variants.map((v) => v.combinationHash),
      hash,
    ]),
  )

  const minSaleQty = throwIfDomainError(createQuantity(1, 0))
  const saleMultiple = throwIfDomainError(createQuantity(1, 0))
  const variantId = deps.ids.next()
  const barcodes: ProductVariant['barcodes'] = []
  if (command.barcode) {
    const parsed = throwIfDomainError(
      createBarcode(
        command.barcode.type as BarcodeType,
        command.barcode.value,
      ),
    )
    throwIfDomainError(
      IdentifierPolicy.assertBarcodeUnique(
        parsed,
        new Set(await deps.products.listBarcodes(deps.organizationId)),
      ),
    )
    barcodes.push({
      id: deps.ids.next(),
      barcode: parsed,
      isPrimary: true,
    })
  }

  const variant: ProductVariant = {
    id: variantId,
    productId: product.id,
    organizationId: deps.organizationId,
    sku,
    barcodes,
    unitOfMeasureId: command.unitOfMeasureId,
    attributeValues: values,
    combinationHash: hash,
    isDefault: false,
    tracksInventory: command.tracksInventory ?? true,
    minSaleQty,
    saleMultiple,
    status: 'draft',
  }

  const activeCount =
    product.variants.filter((v) => v.status === 'active').length +
    (variant.status === 'active' ? 1 : 0)
  throwIfDomainError(
    VariantCombinationPolicy.assertActiveVariantCount(activeCount),
  )

  const next = { ...product, variants: [...product.variants, variant] }
  await deps.products.save(next)
  deps.events.append([
    {
      type: 'VariantCreated',
      organizationId: deps.organizationId,
      productId: product.id,
      variantId,
    },
  ])
  return toVariantResponse(variant)
}

export async function updateVariant(
  deps: CatalogAppDeps,
  command: UpdateVariantCommand,
): Promise<VariantResponse> {
  if (!requireVariantEdit(deps.can)) throw new CatalogPermissionError()
  assertValid(validateUpdateVariant(command))
  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)
  const index = product.variants.findIndex((v) => v.id === command.variantId)
  if (index < 0) throw new CatalogNotFoundError('variant_not_found')
  const current = product.variants[index]!
  if (current.status === 'archived') {
    throw new CatalogPermissionError('variant_archived')
  }

  let sku = current.sku
  const events: CatalogDomainEvent[] = []
  if (command.sku !== undefined) {
    sku = throwIfDomainError(createSku(command.sku))
    const others = new Set(await deps.products.listSkus(deps.organizationId))
    if (current.sku) others.delete(current.sku.value)
    throwIfDomainError(IdentifierPolicy.assertSkuUnique(sku, others))
    events.push({
      type: 'VariantSkuChanged' as const,
      organizationId: deps.organizationId,
      variantId: current.id,
      previousSku: current.sku?.value ?? null,
      sku: sku.value,
    })
  }

  const updated: ProductVariant = {
    ...current,
    sku,
    unitOfMeasureId:
      command.unitOfMeasureId !== undefined
        ? command.unitOfMeasureId
        : current.unitOfMeasureId,
    tracksInventory:
      command.tracksInventory !== undefined
        ? command.tracksInventory
        : current.tracksInventory,
  }

  const variants = [...product.variants]
  variants[index] = updated
  await deps.products.save({ ...product, variants })
  deps.events.append(events)
  return toVariantResponse(updated)
}

export async function archiveVariant(
  deps: CatalogAppDeps,
  command: VariantIdCommand,
): Promise<VariantResponse> {
  if (!requireVariantArchive(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)
  if (product.topology === 'simple') {
    throw new CatalogConflictError(
      'Não é possível arquivar a única variante de produto simples.',
    )
  }
  const variant = product.variants.find((v) => v.id === command.variantId)
  if (!variant) throw new CatalogNotFoundError('variant_not_found')
  if (variant.status === 'archived') {
    return toVariantResponse(variant)
  }
  const remainingActive = product.variants.filter(
    (v) => v.id !== variant.id && v.status !== 'archived',
  )
  if (remainingActive.length < 1) {
    throw new CatalogConflictError(
      'Produto deve manter ao menos uma variante não arquivada.',
    )
  }

  const archived: ProductVariant = {
    ...variant,
    status: 'archived',
  }
  const variants = product.variants.map((v) =>
    v.id === variant.id ? archived : v,
  )
  await deps.products.save({ ...product, variants })
  deps.events.append([
    {
      type: 'VariantArchived',
      organizationId: deps.organizationId,
      productId: product.id,
      variantId: variant.id,
    },
  ])
  return toVariantResponse(archived)
}

/** @deprecated Prefer archiveVariant — soft archive only. */
export async function removeVariant(
  deps: CatalogAppDeps,
  command: VariantIdCommand,
): Promise<VariantResponse> {
  return archiveVariant(deps, command)
}

export async function restoreVariant(
  deps: CatalogAppDeps,
  command: VariantIdCommand,
): Promise<VariantResponse> {
  if (!requireVariantRestore(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)
  const index = product.variants.findIndex((v) => v.id === command.variantId)
  if (index < 0) throw new CatalogNotFoundError('variant_not_found')
  const current = product.variants[index]!
  if (current.status !== 'archived') {
    throw new CatalogPermissionError('invalid_lifecycle_action')
  }
  const updated = { ...current, status: 'draft' as const }
  const variants = [...product.variants]
  variants[index] = updated
  await deps.products.save({ ...product, variants })
  return toVariantResponse(updated)
}

export async function activateVariant(
  deps: CatalogAppDeps,
  command: VariantIdCommand,
): Promise<VariantResponse> {
  if (!requireVariantEdit(deps.can)) throw new CatalogPermissionError()
  const product = await loadProduct(deps, command.productId)
  assertProductMutable(product)
  const index = product.variants.findIndex((v) => v.id === command.variantId)
  if (index < 0) throw new CatalogNotFoundError('variant_not_found')
  const current = product.variants[index]!
  if (current.status === 'archived') {
    throw new CatalogPermissionError('variant_archived')
  }
  if (!current.sku || !current.unitOfMeasureId) {
    throw new CatalogConflictError('Variante ativa exige SKU e UOM.')
  }
  const list = await deps.priceLists.getDefault(deps.organizationId)
  const hasPrice = list?.entries.some(
    (e) => e.variantId === current.id && e.validTo === null,
  )
  if (!hasPrice) {
    throw new CatalogConflictError(
      'Variante ativa exige preço na lista padrão.',
    )
  }
  const activeCount =
    product.variants.filter((v) => v.status === 'active' && v.id !== current.id)
      .length + 1
  throwIfDomainError(
    VariantCombinationPolicy.assertActiveVariantCount(activeCount),
  )
  const updated = { ...current, status: 'active' as const }
  const variants = [...product.variants]
  variants[index] = updated
  await deps.products.save({ ...product, variants })
  deps.events.append([
    {
      type: 'VariantActivated',
      organizationId: deps.organizationId,
      productId: product.id,
      variantId: updated.id,
    },
  ])
  return toVariantResponse(updated)
}

export async function deactivateVariant(
  deps: CatalogAppDeps,
  command: VariantIdCommand,
): Promise<VariantResponse> {
  return archiveVariant(deps, command)
}
