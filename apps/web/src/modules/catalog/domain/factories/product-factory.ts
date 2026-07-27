import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'
import type { CatalogDomainEvent } from '#/modules/catalog/domain/events'
import { createBarcode } from '#/modules/catalog/domain/value-objects/barcode'
import { createSku } from '#/modules/catalog/domain/value-objects/sku'
import { createQuantity } from '#/modules/catalog/domain/value-objects/quantity'
import { combinationHash } from '#/modules/catalog/domain/policies/combination-policy'
import { ProductTopologyPolicy } from '#/modules/catalog/domain/policies/topology-policy'
import type {
  CreateSimpleProductInput,
  IdGenerator,
  Product,
  ProductVariant,
} from '#/modules/catalog/domain/types'

export type ProductFactoryResult = {
  product: Product
  events: CatalogDomainEvent[]
}

const NAME_MAX = 200

/**
 * ProductFactory — creates simple Product + invisible default Variant (ADR-0020).
 */
export function createSimpleProduct(
  input: CreateSimpleProductInput,
  ids: IdGenerator,
): DomainResult<ProductFactoryResult> {
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

  const sku = createSku(input.sku)
  if (!sku.ok) return sku

  const minSaleQty = createQuantity(1, 0)
  const saleMultiple = createQuantity(1, 0)
  if (!minSaleQty.ok || !saleMultiple.ok) {
    return err('invalid_quantity', 'Quantidades padrão inválidas.')
  }

  const productId = ids()
  const variantId = ids()
  const organizationId = input.organizationId

  const barcodes: ProductVariant['barcodes'] = []
  if (input.barcode) {
    const parsed = createBarcode(input.barcode.type, input.barcode.value)
    if (!parsed.ok) return parsed
    barcodes.push({
      id: ids(),
      barcode: parsed.value,
      isPrimary: true,
    })
  }

  const variant: ProductVariant = {
    id: variantId,
    productId,
    organizationId,
    sku: sku.value,
    barcodes,
    unitOfMeasureId: input.unitOfMeasureId,
    attributeValues: [],
    combinationHash: combinationHash([]),
    isDefault: true,
    tracksInventory: input.tracksInventory ?? true,
    minSaleQty: minSaleQty.value,
    saleMultiple: saleMultiple.value,
    status: 'draft',
  }

  const product: Product = {
    id: productId,
    organizationId,
    name,
    description: input.description?.trim() ? input.description.trim() : null,
    brandId: input.brandId ?? null,
    primaryCategoryId: input.primaryCategoryId ?? null,
    defaultUnitOfMeasureId: input.unitOfMeasureId,
    topology: 'simple',
    status: 'draft',
    axes: [],
    variants: [variant],
  }

  const invariants = ProductTopologyPolicy.assertInvariants(product)
  if (!invariants.ok) return invariants

  const events: CatalogDomainEvent[] = [
    {
      type: 'ProductCreated',
      organizationId,
      productId,
    },
    {
      type: 'VariantCreated',
      organizationId,
      productId,
      variantId,
    },
  ]

  return ok({ product, events })
}
