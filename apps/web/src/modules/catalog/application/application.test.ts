import { describe, expect, it } from 'vitest'
import {
  CatalogConflictError,
  CatalogDomainRuleError,
  CatalogNotFoundError,
  CatalogPermissionError,
  CatalogValidationError,
} from '#/modules/catalog/application/errors'
import {
  createCatalogTestApp,
  seedColorAttribute,
} from '#/modules/catalog/application/test-harness'
import { toProductResponse } from '#/modules/catalog/application/mappers'
import { createSimpleProduct } from '#/modules/catalog/domain/factories/product-factory'

describe('Catalog application — product', () => {
  it('creates simple product and emits domain events', async () => {
    const { app, events } = createCatalogTestApp()
    const product = await app.createProduct({
      name: 'Cinto',
      sku: 'CINTO-1',
      unitOfMeasureId: 'uom-un',
    })
    expect(product.topology).toBe('simple')
    expect(product.variants).toHaveLength(1)
    expect(product.variants[0]!.isDefault).toBe(true)
    expect(events.peek().map((e) => e.type)).toEqual([
      'ProductCreated',
      'VariantCreated',
    ])
  })

  it('rejects duplicate SKU', async () => {
    const { app } = createCatalogTestApp()
    await app.createProduct({
      name: 'A',
      sku: 'SKU-1',
      unitOfMeasureId: 'uom',
    })
    await expect(
      app.createProduct({
        name: 'B',
        sku: 'sku-1',
        unitOfMeasureId: 'uom',
      }),
    ).rejects.toBeInstanceOf(CatalogDomainRuleError)
  })

  it('renames, activates with price, deactivates (archive)', async () => {
    const { app } = createCatalogTestApp()
    const created = await app.createProduct({
      name: 'Item',
      sku: 'ITEM-1',
      unitOfMeasureId: 'uom',
    })
    const renamed = await app.renameProduct({
      productId: created.id,
      name: 'Item Novo',
    })
    expect(renamed.name).toBe('Item Novo')

    const list = await app.createPriceList({ name: 'Padrão' })
    await app.addPriceEntry({
      priceListId: list.id,
      variantId: created.variants[0]!.id,
      amount: '10.00',
      validFrom: '2026-01-01T00:00:00.000Z',
    })
    const active = await app.activateProduct({ productId: created.id })
    expect(active.status).toBe('active')

    const deactivated = await app.deactivateProduct({ productId: created.id })
    expect(deactivated.status).toBe('archived')
  })

  it('activate fails without price', async () => {
    const { app } = createCatalogTestApp()
    const created = await app.createProduct({
      name: 'Item',
      sku: 'ITEM-2',
      unitOfMeasureId: 'uom',
    })
    await expect(
      app.activateProduct({ productId: created.id }),
    ).rejects.toBeInstanceOf(CatalogDomainRuleError)
  })

  it('denies create without permission', async () => {
    const { app } = createCatalogTestApp({ permissions: ['products.read'] })
    await expect(
      app.createProduct({
        name: 'X',
        sku: 'X',
        unitOfMeasureId: 'uom',
      }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('validates empty name', async () => {
    const { app } = createCatalogTestApp()
    await expect(
      app.createProduct({
        name: '  ',
        sku: 'S',
        unitOfMeasureId: 'uom',
      }),
    ).rejects.toBeInstanceOf(CatalogValidationError)
  })
})

describe('Catalog application — variable product + variants', () => {
  it('creates variable product from axes', async () => {
    const { app, deps } = createCatalogTestApp()
    const color = await seedColorAttribute(deps)
    const product = await app.createProduct({
      name: 'Camiseta',
      unitOfMeasureId: 'uom',
      skuPrefix: 'CAM',
      axes: [
        {
          attributeDefinitionId: color.id,
          valueType: 'option',
          allowedOptionIds: color.options.map((o) => o.id),
        },
      ],
    })
    expect(product.topology).toBe('variable')
    expect(product.variants).toHaveLength(2)
    expect(product.variants.every((v) => !v.isDefault)).toBe(true)
  })

  it('updates, activates and removes an existing matrix variant', async () => {
    const { app, deps } = createCatalogTestApp()
    const color = await seedColorAttribute(deps, ['P', 'M', 'G'])
    const product = await app.createProduct({
      name: 'Camisa',
      unitOfMeasureId: 'uom',
      axes: [
        {
          attributeDefinitionId: color.id,
          valueType: 'option',
          allowedOptionIds: color.options.map((o) => o.id),
        },
      ],
    })
    expect(product.variants).toHaveLength(3)
    const target = product.variants[2]!
    const list = await app.createPriceList({ name: 'Padrão' })

    const updated = await app.updateVariant({
      productId: product.id,
      variantId: target.id,
      sku: 'CAM-G-CUSTOM',
    })
    expect(updated.sku).toBe('CAM-G-CUSTOM')

    await app.addPriceEntry({
      priceListId: list.id,
      variantId: target.id,
      amount: '20',
      validFrom: '2026-01-01T00:00:00.000Z',
    })
    const activated = await app.activateVariant({
      productId: product.id,
      variantId: target.id,
    })
    expect(activated.status).toBe('active')

    const removed = await app.removeVariant({
      productId: product.id,
      variantId: target.id,
    })
    expect(removed.status).toBe('archived')
  })

  it('rejects createVariant on simple product', async () => {
    const { app } = createCatalogTestApp()
    const product = await app.createProduct({
      name: 'Simples',
      sku: 'S-1',
      unitOfMeasureId: 'uom',
    })
    await expect(
      app.createVariant({
        productId: product.id,
        sku: 'S-2',
        unitOfMeasureId: 'uom',
        attributeValues: [],
      }),
    ).rejects.toBeInstanceOf(CatalogConflictError)
  })

  it('previews and applies named axes without clothing enums', async () => {
    const { app } = createCatalogTestApp()
    const simple = await app.createProduct({
      name: 'Perfume',
      sku: 'PERF-1',
      unitOfMeasureId: 'uom-un',
    })

    const preview = await app.previewVariantCombinations({
      productId: simple.id,
      axes: [
        { name: 'Volume', options: ['30 ml', '50 ml'] },
        { name: 'Fragrância', options: ['Floral', 'Amadeirado'] },
      ],
    })
    expect(preview.totalCombinations).toBe(4)
    expect(preview.newCount).toBe(4)
    expect(preview.items.every((i) => i.selectionKey.includes('volume='))).toBe(
      true,
    )

    const applied = await app.applyVariantCombinations({
      productId: simple.id,
      axes: [
        { name: 'Volume', options: ['30 ml', '50 ml'] },
        { name: 'Fragrância', options: ['Floral', 'Amadeirado'] },
      ],
      createAllNew: true,
      skuPrefix: 'PERF',
    })
    expect(applied.product.topology).toBe('variable')
    expect(applied.createdVariantIds).toHaveLength(4)

    const listed = await app.getProductVariants({ productId: simple.id })
    expect(listed.items).toHaveLength(5) // 4 new + archived default
    expect(listed.axes.map((a) => a.name).sort()).toEqual([
      'Fragrância',
      'Volume',
    ])

    const again = await app.previewVariantCombinations({
      productId: simple.id,
    })
    expect(again.newCount).toBe(0)
    expect(again.existingCount).toBe(4)

    const target = listed.items.find((v) => v.status === 'draft')!
    await app.updateVariant({
      productId: simple.id,
      variantId: target.id,
      sku: 'PERF-CUSTOM',
    })
    const archived = await app.archiveVariant({
      productId: simple.id,
      variantId: target.id,
    })
    expect(archived.status).toBe('archived')
    const restored = await app.restoreVariant({
      productId: simple.id,
      variantId: target.id,
    })
    expect(restored.status).toBe('draft')
  })

  it('rejects duplicate axis names and blocks option removal in use', async () => {
    const { app } = createCatalogTestApp()
    const product = await app.createProduct({
      name: 'Mala',
      sku: 'MALA-1',
      unitOfMeasureId: 'uom-un',
    })
    await expect(
      app.previewVariantCombinations({
        productId: product.id,
        axes: [
          { name: 'Tamanho', options: ['P', 'M'] },
          { name: 'tamanho', options: ['G'] },
        ],
      }),
    ).rejects.toBeInstanceOf(CatalogValidationError)

    const applied = await app.defineVariantAxes({
      productId: product.id,
      axes: [{ name: 'Tamanho', options: ['P', 'M'] }],
      createAllNew: true,
    })
    const axisId = applied.axes[0]!.attributeDefinitionId
    const optionId = applied.axes[0]!.options[0]!.id
    await expect(
      app.removeVariantOption({
        productId: product.id,
        attributeDefinitionId: axisId,
        optionId,
      }),
    ).rejects.toBeInstanceOf(CatalogConflictError)
  })

  it('separates variant configure permission from edit', async () => {
    const harness = createCatalogTestApp()
    const created = await harness.app.createProduct({
      name: 'Lock',
      sku: 'LOCK-1',
      unitOfMeasureId: 'uom-un',
    })
    harness.deps.can = (key) =>
      key === 'products.read' ||
      key === 'products.variants.read' ||
      key === 'products.variants.edit'
    await expect(
      harness.app.applyVariantCombinations({
        productId: created.id,
        axes: [{ name: 'Cor', options: ['Preto'] }],
        createAllNew: true,
      }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('blocks variant mutations on archived product', async () => {
    const { app } = createCatalogTestApp()
    const created = await app.createProduct({
      name: 'Arch',
      sku: 'ARCH-V-1',
      unitOfMeasureId: 'uom-un',
    })
    await app.archiveProduct({ productId: created.id })
    await expect(
      app.applyVariantCombinations({
        productId: created.id,
        axes: [{ name: 'Cor', options: ['Preto'] }],
        createAllNew: true,
      }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })
})

describe('Catalog application — price engine', () => {
  it('resolves by priority across lists and exposes variant summary', async () => {
    const { app } = createCatalogTestApp()
    const product = await app.createProduct({
      name: 'Priced',
      sku: 'PR-1',
      unitOfMeasureId: 'uom-un',
    })
    const variantId = product.variants[0]!.id
    const defaultList = await app.createPriceList({
      name: 'Varejo',
      isDefault: true,
      priority: 10,
    })
    const promo = await app.createPriceList({
      name: 'Promo',
      isDefault: false,
      priority: 80,
    })
    await app.addPriceEntry({
      priceListId: defaultList.id,
      variantId,
      amount: '120',
      validFrom: '2026-01-01T00:00:00.000Z',
    })
    await app.addPriceEntry({
      priceListId: promo.id,
      variantId,
      amount: '99',
      validFrom: '2026-01-01T00:00:00.000Z',
    })

    const resolved = await app.resolveCurrentPrice({
      variantId,
      at: '2026-06-01T00:00:00.000Z',
    })
    expect(resolved.amount).toBe('99')
    expect(resolved.priceListName).toBe('Promo')
    expect(resolved.priority).toBe(80)

    const summary = await app.getVariantPriceSummary(variantId)
    expect(summary.resolved?.amount).toBe('99')
    expect(summary.lists).toHaveLength(2)
  })

  it('separates prices.edit from products.edit', async () => {
    const harness = createCatalogTestApp()
    const product = await harness.app.createProduct({
      name: 'X',
      sku: 'PX-1',
      unitOfMeasureId: 'uom-un',
    })
    const list = await harness.app.createPriceList({ name: 'L' })
    harness.deps.can = (key) =>
      key === 'products.read' ||
      key === 'products.edit' ||
      key === 'prices.read'
    await expect(
      harness.app.addPriceEntry({
        priceListId: list.id,
        variantId: product.variants[0]!.id,
        amount: '1',
        validFrom: '2026-01-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('rejects resolve for archived variant', async () => {
    const { app, deps } = createCatalogTestApp()
    const color = await seedColorAttribute(deps)
    const product = await app.createProduct({
      name: 'VarPrice',
      unitOfMeasureId: 'uom-un',
      axes: [
        {
          attributeDefinitionId: color.id,
          valueType: 'option',
          allowedOptionIds: color.options.map((o) => o.id),
        },
      ],
    })
    const list = await app.createPriceList({ name: 'Padrão' })
    const target = product.variants[0]!
    await app.addPriceEntry({
      priceListId: list.id,
      variantId: target.id,
      amount: '10',
      validFrom: '2026-01-01T00:00:00.000Z',
    })
    await app.archiveVariant({
      productId: product.id,
      variantId: target.id,
    })
    await expect(
      app.resolveCurrentPrice({
        variantId: target.id,
        at: '2026-06-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })
})

describe('Catalog application — brand & category', () => {
  it('creates and updates brand; conflicts on duplicate name', async () => {
    const { app } = createCatalogTestApp()
    const brand = await app.createBrand({ name: 'Nike' })
    expect(brand.name).toBe('Nike')
    await expect(app.createBrand({ name: 'nike' })).rejects.toBeInstanceOf(
      CatalogConflictError,
    )
    const updated = await app.updateBrand({
      brandId: brand.id,
      name: 'Nike Official',
    })
    expect(updated.name).toBe('Nike Official')
  })

  it('creates category tree and moves with cycle protection', async () => {
    const { app } = createCatalogTestApp()
    const root = await app.createCategory({ name: 'Roupas' })
    const child = await app.createCategory({
      name: 'Camisetas',
      parentId: root.id,
    })
    expect(child.depth).toBe(1)
    await expect(
      app.moveCategory({ categoryId: root.id, newParentId: child.id }),
    ).rejects.toBeInstanceOf(CatalogDomainRuleError)
    const moved = await app.moveCategory({
      categoryId: child.id,
      newParentId: null,
    })
    expect(moved.depth).toBe(0)
    const renamed = await app.updateCategory({
      categoryId: child.id,
      name: 'Tops',
    })
    expect(renamed.name).toBe('Tops')
  })
})

describe('Catalog application — pricing', () => {
  it('manages price list entries and resolves current price', async () => {
    const { app } = createCatalogTestApp()
    const product = await app.createProduct({
      name: 'Item',
      sku: 'P-1',
      unitOfMeasureId: 'uom',
    })
    const list = await app.createPriceList({ name: 'Padrão', isDefault: true })
    const entry = await app.addPriceEntry({
      priceListId: list.id,
      variantId: product.variants[0]!.id,
      amount: '99.90',
      validFrom: '2026-01-01T00:00:00.000Z',
    })
    expect(entry.amount).toBe('99.9')

    const resolved = await app.resolveCurrentPrice({
      variantId: product.variants[0]!.id,
      at: '2026-06-01T00:00:00.000Z',
    })
    expect(resolved.amount).toBe('99.9')

    const updated = await app.updatePriceEntry({
      priceListId: list.id,
      entryId: entry.id,
      amount: '89.00',
    })
    expect(updated.amount).toBe('89')

    const closed = await app.closePriceEntry({
      priceListId: list.id,
      entryId: entry.id,
      validTo: '2026-12-31T00:00:00.000Z',
    })
    expect(closed.validTo).toBe('2026-12-31T00:00:00.000Z')

    await expect(
      app.createPriceList({ name: 'Outra', isDefault: true }),
    ).rejects.toBeInstanceOf(CatalogConflictError)

    const promo = await app.createPriceList({
      name: 'Promo',
      isDefault: false,
    })
    const deactivated = await app.deactivatePriceList({
      priceListId: promo.id,
    })
    expect(deactivated.status).toBe('archived')
    const reactivated = await app.activatePriceList({ priceListId: promo.id })
    expect(reactivated.status).toBe('active')
    await app.updatePriceList({ priceListId: promo.id, name: 'Promo 2' })
  })

  it('rejects negative price', async () => {
    const { app } = createCatalogTestApp()
    const product = await app.createProduct({
      name: 'Item',
      sku: 'P-2',
      unitOfMeasureId: 'uom',
    })
    const list = await app.createPriceList({ name: 'Padrão' })
    await expect(
      app.addPriceEntry({
        priceListId: list.id,
        variantId: product.variants[0]!.id,
        amount: '-1',
        validFrom: '2026-01-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(CatalogDomainRuleError)
  })
})

describe('Catalog application — search', () => {
  it('searches by name and sku', async () => {
    const { app } = createCatalogTestApp()
    await app.createProduct({
      name: 'Calça Preta',
      sku: 'CAL-PRETA',
      unitOfMeasureId: 'uom',
    })
    await app.createProduct({
      name: 'Camisa',
      sku: 'CAM-1',
      unitOfMeasureId: 'uom',
    })
    const byName = await app.searchCatalog({ text: 'calça' })
    expect(byName).toHaveLength(1)
    expect(byName[0]!.productName).toBe('Calça Preta')
    const bySku = await app.searchVariants({ text: 'CAM-1' })
    expect(bySku).toHaveLength(1)
  })

  it('prioritizes an exact EAN before an equally matching SKU', async () => {
    const { app } = createCatalogTestApp()
    await app.createProduct({
      name: 'Produto por SKU',
      sku: '5901234123457',
      unitOfMeasureId: 'uom',
    })
    await app.createProduct({
      name: 'Produto por EAN',
      sku: 'OUTRO-SKU',
      barcode: { type: 'EAN_13', value: '5901234123457' },
      unitOfMeasureId: 'uom',
    })

    const results = await app.searchVariants({ text: '5901234123457' })
    expect(results[0]?.productName).toBe('Produto por EAN')
  })
})

describe('Catalog application — mappers & memory repos', () => {
  it('maps product response without leaking domain object identity', () => {
    const created = createSimpleProduct(
      {
        organizationId: 'org',
        name: 'X',
        sku: 'X-1',
        unitOfMeasureId: 'uom',
      },
      (() => {
        let n = 0
        return () => `id-${++n}`
      })(),
    )
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const dto = toProductResponse(created.value.product)
    expect(dto.name).toBe('X')
    expect(dto.variants[0]!.sku).toBe('X-1')
  })

  it('isolates organizations in memory repositories', async () => {
    const a = createCatalogTestApp({ organizationId: 'org-a' })
    const b = createCatalogTestApp({
      organizationId: 'org-b',
      permissions: [
        'products.read',
        'products.create',
        'products.edit',
        'products.write',
      ],
    })
    // separate stores — prove getById org check via shared store
    const { store, repos } = a
    await a.app.createProduct({
      name: 'A',
      sku: 'A-1',
      unitOfMeasureId: 'uom',
    })
    const products = await repos.products.listByOrganization('org-a')
    expect(products).toHaveLength(1)
    expect(await repos.products.getById('org-b', products[0]!.id)).toBeNull()
    expect(store.products.size).toBe(1)
    void b
  })

  it('returns not found for missing product', async () => {
    const { app } = createCatalogTestApp()
    await expect(app.getProduct('missing')).rejects.toBeInstanceOf(
      CatalogNotFoundError,
    )
  })

  it('updates product fields and returns enriched detail', async () => {
    const { app } = createCatalogTestApp()
    const brand = await app.createBrand({ name: 'Marca' })
    const category = await app.createCategory({ name: 'Cat' })
    const created = await app.createProduct({
      name: 'Antes',
      sku: 'UPD-1',
      unitOfMeasureId: 'uom-un',
    })
    const updated = await app.updateProduct({
      productId: created.id,
      name: 'Depois',
      brandId: brand.id,
      primaryCategoryId: category.id,
      description: 'Nova descrição',
    })
    expect(updated.name).toBe('Depois')
    expect(updated.brandId).toBe(brand.id)
    const detail = await app.getProductDetail(created.id)
    expect(detail.brandName).toBe('Marca')
    expect(detail.categoryName).toBe('Cat')
    expect(detail.defaultSku).toBe('UPD-1')
    expect(detail.defaultUnitOfMeasureCode).toBe('un')
  })

  it('lists units of measure for product create', async () => {
    const { app } = createCatalogTestApp()
    const units = await app.listUnitsOfMeasure()
    expect(units.some((u) => u.code === 'un')).toBe(true)
  })

  it('denies create without write permission', async () => {
    const { app } = createCatalogTestApp({
      permissions: ['products.read'],
    })
    await expect(
      app.createProduct({
        name: 'X',
        sku: 'X-1',
        unitOfMeasureId: 'uom-un',
      }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('denies update without edit permission', async () => {
    const { app } = createCatalogTestApp({
      permissions: ['products.read', 'products.create'],
    })
    await expect(
      app.updateProduct({ productId: 'any', name: 'Nope' }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('publishes, archives, restores with audit and forbids invalid transitions', async () => {
    const { app, lifecycleAudit, events } = createCatalogTestApp()
    const created = await app.createProduct({
      name: 'Life',
      sku: 'LIFE-1',
      unitOfMeasureId: 'uom-un',
    })
    const list = await app.createPriceList({ name: 'Default' })
    await app.addPriceEntry({
      priceListId: list.id,
      variantId: created.variants[0]!.id,
      amount: '1.00',
      validFrom: '2026-01-01T00:00:00.000Z',
    })

    const published = await app.publishProduct({ productId: created.id })
    expect(published.status).toBe('active')
    expect(lifecycleAudit.records.at(-1)?.action).toBe('publish')

    const archived = await app.deactivateProduct({ productId: created.id })
    expect(archived.status).toBe('archived')
    expect(lifecycleAudit.records.at(-1)?.action).toBe('deactivate')

    await expect(
      app.publishProduct({ productId: created.id }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)

    const restored = await app.restoreProduct({ productId: created.id })
    expect(restored.status).toBe('draft')
    expect(events.peek().some((e) => e.type === 'ProductRestored')).toBe(true)

    const lifecycle = await app.getLifecycle(created.id)
    expect(lifecycle.status).toBe('draft')
    expect(lifecycle.availableActions).toContain('publish')
    expect(lifecycle.availableActions).toContain('archive')
    expect(lifecycle.history.length).toBeGreaterThanOrEqual(3)
  })

  it('separates lifecycle permissions from edit', async () => {
    const harness = createCatalogTestApp()
    const created = await harness.app.createProduct({
      name: 'NoLife',
      sku: 'NOLIFE-1',
      unitOfMeasureId: 'uom-un',
    })
    harness.deps.can = (key) =>
      key === 'products.read' || key === 'products.edit'
    await expect(
      harness.app.archiveProduct({ productId: created.id }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })
})
