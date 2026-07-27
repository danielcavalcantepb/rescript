import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import type { CatalogDomainEvent } from '#/modules/catalog/domain/events'
import { createSku } from '#/modules/catalog/domain/value-objects/sku'
import { createQuantity } from '#/modules/catalog/domain/value-objects/quantity'
import {
  combinationHash,
  VariantCombinationPolicy,
} from '#/modules/catalog/domain/policies/combination-policy'
import { ProductTopologyPolicy } from '#/modules/catalog/domain/policies/topology-policy'
import type {
  CreateVariableProductInput,
  IdGenerator,
  Product,
  ProductVariant,
  ProductVariantAxis,
} from '#/modules/catalog/domain/types'

export type VariantMatrixFactoryResult = {
  product: Product
  events: CatalogDomainEvent[]
}

const NAME_MAX = 200

/**
 * VariantMatrixFactory — builds variable Product from axes × allowed options.
 */
export function createVariableProduct(
  input: CreateVariableProductInput,
  ids: IdGenerator,
): DomainResult<VariantMatrixFactoryResult> {
  const name = input.name.trim().replace(/\s+/g, ' ')
  if (name.length < 1) {
    return err('invalid_name', 'Informe o nome do produto.')
  }
  if (name.length > NAME_MAX) {
    return err(
      'invalid_name',
      `Nome deve ter no máximo ${NAME_MAX} caracteres.`,
    )
  }

  if (input.axes.length < 1) {
    return err(
      'invariant_violation',
      'Produto variável exige ao menos um eixo.',
    )
  }

  for (const axis of input.axes) {
    if (axis.valueType !== 'option') {
      return err(
        'invalid_axis_type',
        'Eixos de variante aceitam apenas AttributeDefinition do tipo option.',
      )
    }
  }

  const axes: ProductVariantAxis[] = input.axes.map((axis, index) => ({
    attributeDefinitionId: axis.attributeDefinitionId,
    allowedOptionIds: [...axis.allowedOptionIds],
    sortOrder: index,
  }))

  const cartesian = VariantCombinationPolicy.cartesianOptionSets(axes)
  if (!cartesian.ok) return cartesian

  const minSaleQty = createQuantity(1, 0)
  const saleMultiple = createQuantity(1, 0)
  if (!minSaleQty.ok || !saleMultiple.ok) {
    return err('invalid_quantity', 'Quantidades padrão inválidas.')
  }

  const productId = ids()
  const organizationId = input.organizationId
  const prefix = (input.skuPrefix ?? 'VAR').trim().toUpperCase() || 'VAR'
  const tracksInventory = input.tracksInventory ?? true

  const variants: ProductVariant[] = []
  const events: CatalogDomainEvent[] = [
    {
      type: 'ProductCreated',
      organizationId,
      productId,
    },
  ]

  let index = 1
  for (const values of cartesian.value) {
    const hash = combinationHash(values)
    const skuRaw = `${prefix}-${String(index).padStart(3, '0')}`
    const sku = createSku(skuRaw)
    if (!sku.ok) return sku

    const variantId = ids()
    variants.push({
      id: variantId,
      productId,
      organizationId,
      sku: sku.value,
      barcodes: [],
      unitOfMeasureId: input.defaultUnitOfMeasureId,
      attributeValues: values,
      combinationHash: hash,
      isDefault: false,
      tracksInventory,
      minSaleQty: minSaleQty.value,
      saleMultiple: saleMultiple.value,
      status: 'draft',
    })
    events.push({
      type: 'VariantCreated',
      organizationId,
      productId,
      variantId,
    })
    index += 1
  }

  const unique = VariantCombinationPolicy.assertUniqueHashes(
    variants.map((v) => v.combinationHash),
  )
  if (!unique.ok) return unique

  const product: Product = {
    id: productId,
    organizationId,
    name,
    description: input.description?.trim() ? input.description.trim() : null,
    brandId: input.brandId ?? null,
    primaryCategoryId: input.primaryCategoryId ?? null,
    defaultUnitOfMeasureId: input.defaultUnitOfMeasureId,
    topology: 'variable',
    status: 'draft',
    axes,
    variants,
  }

  const invariants = ProductTopologyPolicy.assertInvariants(product)
  if (!invariants.ok) return invariants

  return ok({ product, events })
}
