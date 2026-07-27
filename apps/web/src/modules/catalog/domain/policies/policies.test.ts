import { describe, expect, it } from 'vitest'
import { CatalogActivationPolicy } from '#/modules/catalog/domain/policies/activation-policy'
import {
  combinationHash,
  VariantCombinationPolicy,
} from '#/modules/catalog/domain/policies/combination-policy'
import { IdentifierPolicy } from '#/modules/catalog/domain/policies/identifier-policy'
import { PriceResolutionPolicy } from '#/modules/catalog/domain/policies/price-resolution-policy'
import { ProductTopologyPolicy } from '#/modules/catalog/domain/policies/topology-policy'
import { createSimpleProduct } from '#/modules/catalog/domain/factories/product-factory'
import { createVariableProduct } from '#/modules/catalog/domain/factories/variant-matrix-factory'
import {
  createDefaultPriceList,
  setVariantPrice,
} from '#/modules/catalog/domain/factories/price-list-factory'
import { createAttributeDefinition } from '#/modules/catalog/domain/factories/taxonomy-factory'
import {
  activateProduct,
  archiveProduct,
  restoreProduct,
} from '#/modules/catalog/domain/product-lifecycle'
import { CatalogSpecifications } from '#/modules/catalog/domain/specifications'
import { assertNoCategoryCycle } from '#/modules/catalog/domain/category-rules'
import type { Category, IdGenerator } from '#/modules/catalog/domain/types'

function sequentialIds(start = 0): IdGenerator {
  let n = start
  return () => `id-${++n}`
}

describe('VariantCombinationPolicy', () => {
  it('builds deterministic hash independent of input order', () => {
    const a = combinationHash([
      { attributeDefinitionId: 'color', optionId: 'black' },
      { attributeDefinitionId: 'size', optionId: 'm' },
    ])
    const b = combinationHash([
      { attributeDefinitionId: 'size', optionId: 'm' },
      { attributeDefinitionId: 'color', optionId: 'black' },
    ])
    expect(a).toBe(b)
    expect(a).toBe('color=black|size=m')
  })

  it('enforces axis limit', () => {
    expect(VariantCombinationPolicy.assertAxisCount(4).ok).toBe(false)
    expect(VariantCombinationPolicy.assertAxisCount(3).ok).toBe(true)
  })
})

describe('ProductTopologyPolicy', () => {
  it('locks topology after operational history', () => {
    expect(
      ProductTopologyPolicy.canChangeTopology({ hasOperationalHistory: true })
        .ok,
    ).toBe(false)
    expect(
      ProductTopologyPolicy.canChangeTopology({ hasOperationalHistory: false })
        .ok,
    ).toBe(true)
  })

  it('rejects default variant on variable products', () => {
    const ids = sequentialIds()
    const def = createAttributeDefinition(
      'org-1',
      'Cor',
      'option',
      ['P'],
      ids,
    )
    expect(def.ok).toBe(true)
    if (!def.ok) return
    const product = createVariableProduct(
      {
        organizationId: 'org-1',
        name: 'Var',
        defaultUnitOfMeasureId: 'uom',
        axes: [
          {
            attributeDefinitionId: def.value.id,
            valueType: 'option',
            allowedOptionIds: [def.value.options[0]!.id],
          },
        ],
      },
      ids,
    )
    expect(product.ok).toBe(true)
    if (!product.ok) return
    const broken = {
      ...product.value.product,
      variants: product.value.product.variants.map((v, i) =>
        i === 0 ? { ...v, isDefault: true } : v,
      ),
    }
    expect(ProductTopologyPolicy.assertInvariants(broken).ok).toBe(false)
  })
})

describe('IdentifierPolicy', () => {
  it('detects duplicate SKU and barcode in provided sets', () => {
    const sku = IdentifierPolicy.parseSku('ABC')
    expect(sku.ok).toBe(true)
    if (!sku.ok) return
    expect(
      IdentifierPolicy.assertSkuUnique(sku.value, new Set(['ABC'])).ok,
    ).toBe(false)
    expect(
      IdentifierPolicy.assertSkuUnique(sku.value, new Set(['XYZ'])).ok,
    ).toBe(true)

    const barcode = IdentifierPolicy.parseBarcode('EAN_13', '5901234123457')
    expect(barcode.ok).toBe(true)
    if (!barcode.ok) return
    expect(
      IdentifierPolicy.assertBarcodeUnique(
        barcode.value,
        new Set(['5901234123457']),
      ).ok,
    ).toBe(false)
  })
})

describe('CatalogActivationPolicy + lifecycle', () => {
  it('blocks activation without price and allows with price', () => {
    const ids = sequentialIds()
    const created = createSimpleProduct(
      {
        organizationId: 'org-1',
        name: 'Item',
        sku: 'ITEM-1',
        unitOfMeasureId: 'uom-un',
      },
      ids,
    )
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const variantId = created.value.product.variants[0]!.id
    const withoutPrice = CatalogActivationPolicy.canActivate(
      created.value.product,
      { hasEffectivePriceByVariantId: new Map([[variantId, false]]) },
    )
    expect(withoutPrice.ok).toBe(false)

    const list = createDefaultPriceList('org-1', ids)
    expect(list.ok).toBe(true)
    if (!list.ok) return
    const priced = setVariantPrice(
      list.value.priceList,
      variantId,
      '10.00',
      '2026-01-01T00:00:00.000Z',
      ids,
    )
    expect(priced.ok).toBe(true)
    if (!priced.ok) return

    const priceOk = PriceResolutionPolicy.hasEffectivePrice(
      priced.value.priceList,
      variantId,
      '2026-06-01T00:00:00.000Z',
    )
    expect(priceOk).toBe(true)

    const can = CatalogActivationPolicy.canActivate(created.value.product, {
      hasEffectivePriceByVariantId: new Map([[variantId, true]]),
    })
    expect(can.ok).toBe(true)

    const activated = activateProduct(created.value.product, {
      hasEffectivePriceByVariantId: new Map([[variantId, true]]),
    })
    expect(activated.ok).toBe(true)
    if (!activated.ok) return
    expect(activated.value.product.status).toBe('active')
    expect(activated.value.product.variants[0]!.status).toBe('active')
    expect(
      CatalogSpecifications.isReadyToActivate(activated.value.product, {
        hasEffectivePriceByVariantId: new Map([[variantId, true]]),
      }),
    ).toBe(true)

    const archived = archiveProduct(activated.value.product)
    expect(archived.ok).toBe(true)
    if (!archived.ok) return
    expect(archived.value.product.status).toBe('archived')

    const restored = restoreProduct(archived.value.product)
    expect(restored.ok).toBe(true)
    if (!restored.ok) return
    expect(restored.value.product.status).toBe('draft')
    expect(restored.value.events.map((e) => e.type)).toContain('ProductRestored')
  })
})

describe('Category rules', () => {
  it('detects cycles', () => {
    const categories: Category[] = [
      {
        id: 'a',
        organizationId: 'org',
        parentId: null,
        name: 'A',
        normalizedName: 'a',
        status: 'active',
        depth: 0,
      },
      {
        id: 'b',
        organizationId: 'org',
        parentId: 'a',
        name: 'B',
        normalizedName: 'b',
        status: 'active',
        depth: 1,
      },
    ]
    expect(assertNoCategoryCycle(categories, 'a', 'b').ok).toBe(false)
    expect(assertNoCategoryCycle(categories, 'b', null).ok).toBe(true)
  })
})

describe('CatalogSpecifications', () => {
  it('validates variant ownership invariant', () => {
    const created = createSimpleProduct(
      {
        organizationId: 'org-1',
        name: 'X',
        sku: 'X-1',
        unitOfMeasureId: 'uom',
      },
      sequentialIds(),
    )
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(
      CatalogSpecifications.everyVariantBelongsToProduct(created.value.product),
    ).toBe(true)
    expect(
      CatalogSpecifications.isSimpleWithDefaultVariant(created.value.product),
    ).toBe(true)
  })
})
