import { describe, expect, it } from 'vitest'
import {
  CatalogConflictError,
  CatalogPermissionError,
} from '#/modules/catalog/application/errors'
import { createCatalogTestApp } from '#/modules/catalog/application/test-harness'

describe('Catalog foundation application contracts', () => {
  it('creates, updates and archives an unused brand', async () => {
    const { app } = createCatalogTestApp()
    const created = await app.createBrand({
      name: 'Marca Ágil',
      description: 'Linha principal',
      sortOrder: 2,
    })
    expect(created.slug).toBe('marca-agil')
    const updated = await app.updateBrand({
      brandId: created.id,
      name: 'Marca Ágil Brasil',
    })
    expect(updated.description).toBe('Linha principal')
    await expect(app.archiveBrand({ brandId: created.id })).resolves.toMatchObject({
      status: 'archived',
    })
  })

  it('preserves category depth and blocks archiving a parent in use', async () => {
    const { app } = createCatalogTestApp()
    const parent = await app.createCategory({ name: 'Vestuário' })
    const child = await app.createCategory({
      name: 'Camisas',
      parentId: parent.id,
    })
    expect(child.depth).toBe(1)
    await expect(
      app.archiveCategory({ categoryId: parent.id }),
    ).rejects.toBeInstanceOf(CatalogConflictError)
  })

  it('manages option attributes and blocks duplicate values', async () => {
    const { app } = createCatalogTestApp()
    const attribute = await app.createAttribute({
      name: 'Cor',
      valueType: 'option',
      options: ['Preto'],
      isVariantAxis: true,
    })
    expect(attribute.values).toHaveLength(1)
    const withValue = await app.createAttributeValue({
      attributeId: attribute.id,
      label: 'Branco',
    })
    expect(withValue.values.map((value) => value.label)).toEqual([
      'Preto',
      'Branco',
    ])
    await expect(
      app.createAttributeValue({
        attributeId: attribute.id,
        label: ' branco ',
      }),
    ).rejects.toBeInstanceOf(CatalogConflictError)
  })

  it('rejects mutation without the canonical permission', async () => {
    const { app } = createCatalogTestApp({
      permissions: ['catalog.categories.read'],
    })
    await expect(app.createCategory({ name: 'Sem acesso' })).rejects.toBeInstanceOf(
      CatalogPermissionError,
    )
  })
})
