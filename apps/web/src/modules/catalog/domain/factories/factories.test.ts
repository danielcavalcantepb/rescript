import { describe, expect, it } from 'vitest'
import { createSimpleProduct } from '#/modules/catalog/domain/factories/product-factory'
import { createVariableProduct } from '#/modules/catalog/domain/factories/variant-matrix-factory'
import {
  createDefaultPriceList,
  setVariantPrice,
} from '#/modules/catalog/domain/factories/price-list-factory'
import {
  createAttributeDefinition,
  createBrand,
  createCategory,
} from '#/modules/catalog/domain/factories/taxonomy-factory'
import { combinationHash } from '#/modules/catalog/domain/policies/combination-policy'
import type { IdGenerator } from '#/modules/catalog/domain/types'

function sequentialIds(): IdGenerator {
  let n = 0
  return () => `id-${++n}`
}

describe('ProductFactory', () => {
  it('creates simple product with exactly one default variant', () => {
    const result = createSimpleProduct(
      {
        organizationId: 'org-1',
        name: 'Cinto Classic',
        sku: 'CINTO-01',
        unitOfMeasureId: 'uom-un',
      },
      sequentialIds(),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.product.topology).toBe('simple')
    expect(result.value.product.variants).toHaveLength(1)
    expect(result.value.product.variants[0]!.isDefault).toBe(true)
    expect(result.value.product.variants[0]!.combinationHash).toBe(
      combinationHash([]),
    )
    expect(result.value.product.status).toBe('draft')
    expect(result.value.events.map((e) => e.type)).toEqual([
      'ProductCreated',
      'VariantCreated',
    ])
  })

  it('never puts SKU on the product root', () => {
    const result = createSimpleProduct(
      {
        organizationId: 'org-1',
        name: 'Item',
        sku: 'SKU-1',
        unitOfMeasureId: 'uom-un',
      },
      sequentialIds(),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect('sku' in result.value.product).toBe(false)
    expect(result.value.product.variants[0]!.sku?.value).toBe('SKU-1')
  })
})

describe('VariantMatrixFactory', () => {
  it('generates cartesian combinations without default variant', () => {
    const ids = sequentialIds()
    const def = createAttributeDefinition(
      'org-1',
      'Cor',
      'option',
      ['Preto', 'Branco'],
      ids,
    )
    expect(def.ok).toBe(true)
    if (!def.ok) return

    const size = createAttributeDefinition(
      'org-1',
      'Tamanho',
      'option',
      ['M', 'G'],
      ids,
    )
    expect(size.ok).toBe(true)
    if (!size.ok) return

    const result = createVariableProduct(
      {
        organizationId: 'org-1',
        name: 'Camiseta Básica',
        defaultUnitOfMeasureId: 'uom-un',
        skuPrefix: 'CAM',
        axes: [
          {
            attributeDefinitionId: def.value.id,
            valueType: 'option',
            allowedOptionIds: def.value.options.map((o) => o.id),
          },
          {
            attributeDefinitionId: size.value.id,
            valueType: 'option',
            allowedOptionIds: size.value.options.map((o) => o.id),
          },
        ],
      },
      ids,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.product.topology).toBe('variable')
    expect(result.value.product.variants).toHaveLength(4)
    expect(result.value.product.variants.every((v) => !v.isDefault)).toBe(true)
    const hashes = new Set(
      result.value.product.variants.map((v) => v.combinationHash),
    )
    expect(hashes.size).toBe(4)
  })

  it('rejects non-option axis types', () => {
    const result = createVariableProduct(
      {
        organizationId: 'org-1',
        name: 'X',
        defaultUnitOfMeasureId: 'uom-un',
        axes: [
          {
            attributeDefinitionId: 'a1',
            valueType: 'text',
            allowedOptionIds: ['o1'],
          },
        ],
      },
      sequentialIds(),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('invalid_axis_type')
  })
})

describe('PriceListFactory', () => {
  it('creates default list and sets variant price without writing product', () => {
    const ids = sequentialIds()
    const list = createDefaultPriceList('org-1', ids)
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.value.priceList.isDefault).toBe(true)

    const priced = setVariantPrice(
      list.value.priceList,
      'var-1',
      '99.90',
      '2026-01-01T00:00:00.000Z',
      ids,
    )
    expect(priced.ok).toBe(true)
    if (!priced.ok) return
    expect(priced.value.entry.amount.amount).toBe('99.9')
    expect(priced.value.events[0]?.type).toBe('PriceChanged')
  })
})

describe('TaxonomyFactory', () => {
  it('creates brand and nested category with depth', () => {
    const ids = sequentialIds()
    const brand = createBrand('org-1', 'Nike', ids)
    expect(brand.ok).toBe(true)
    if (!brand.ok) return
    expect(brand.value.normalizedName).toBe('nike')

    const root = createCategory('org-1', 'Roupas', null, ids)
    expect(root.ok).toBe(true)
    if (!root.ok) return
    const child = createCategory('org-1', 'Camisetas', root.value, ids)
    expect(child.ok).toBe(true)
    if (!child.ok) return
    expect(child.value.depth).toBe(1)
    expect(child.value.parentId).toBe(root.value.id)
  })
})
