import { describe, expect, it, vi } from 'vitest'
import { archiveProduct } from '#/modules/products/application/archive-product'
import { createProduct } from '#/modules/products/application/create-product'
import {
  ProductArchivedError,
  ProductConflictError,
  ProductNotFoundError,
  ProductPermissionError,
  ProductValidationError,
  mapRepositoryError,
} from '#/modules/products/application/errors'
import { getProduct } from '#/modules/products/application/get-product'
import { listProducts } from '#/modules/products/application/list-products'
import { restoreProduct } from '#/modules/products/application/restore-product'
import { updateProduct } from '#/modules/products/application/update-product'
import type {
  Product,
  ProductRepository,
} from '#/modules/products/domain/types'

function sample(overrides?: Partial<Product>): Product {
  return {
    id: 'p1',
    organizationId: 'org1',
    name: 'Parafuso',
    description: null,
    sku: 'PAR-01',
    category: null,
    unit: 'un',
    status: 'active',
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function repo(partial?: Partial<ProductRepository>): ProductRepository {
  return {
    list: vi.fn(async () => ({ items: [sample()], nextCursor: null })),
    getById: vi.fn(async () => sample()),
    create: vi.fn(async (_o, _u, input) =>
      sample({ name: input.name, sku: input.sku, unit: input.unit }),
    ),
    update: vi.fn(async (_o, _u, _id, input) =>
      sample({ name: input.name ?? 'Parafuso' }),
    ),
    archive: vi.fn(async () =>
      sample({
        status: 'inactive',
        archivedAt: '2026-01-02T00:00:00.000Z',
      }),
    ),
    restore: vi.fn(async () => sample({ status: 'active', archivedAt: null })),
    ...partial,
  }
}

describe('createProduct', () => {
  it('denies without permission', async () => {
    await expect(
      createProduct({
        repository: repo(),
        can: () => false,
        organizationId: 'org1',
        userId: 'u1',
        input: { name: 'A', sku: 'A1', unit: 'un' },
      }),
    ).rejects.toBeInstanceOf(ProductPermissionError)
  })

  it('validates input', async () => {
    await expect(
      createProduct({
        repository: repo(),
        can: (k) => k === 'products.create',
        organizationId: 'org1',
        userId: 'u1',
        input: { name: '', sku: '', unit: '' },
      }),
    ).rejects.toBeInstanceOf(ProductValidationError)
  })

  it('creates when allowed', async () => {
    const r = repo()
    const product = await createProduct({
      repository: r,
      can: (k) => k === 'products.create',
      organizationId: 'org1',
      userId: 'u1',
      input: { name: 'Parafuso', sku: 'PAR-01', unit: 'un' },
    })
    expect(product.name).toBe('Parafuso')
    expect(r.create).toHaveBeenCalledWith('org1', 'u1', {
      name: 'Parafuso',
      sku: 'PAR-01',
      unit: 'un',
    })
  })

  it('allows products.write', async () => {
    await expect(
      createProduct({
        repository: repo(),
        can: (k) => k === 'products.write',
        organizationId: 'org1',
        userId: 'u1',
        input: { name: 'A', sku: 'A1', unit: 'un' },
      }),
    ).resolves.toBeTruthy()
  })
})

describe('updateProduct', () => {
  it('blocks archived products', async () => {
    await expect(
      updateProduct({
        repository: repo({
          getById: vi.fn(async () =>
            sample({ status: 'inactive', archivedAt: '2026-01-02T00:00:00Z' }),
          ),
        }),
        can: (k) => k === 'products.edit',
        organizationId: 'org1',
        userId: 'u1',
        productId: 'p1',
        input: { name: 'Novo' },
      }),
    ).rejects.toBeInstanceOf(ProductArchivedError)
  })

  it('not found', async () => {
    await expect(
      updateProduct({
        repository: repo({ getById: vi.fn(async () => null) }),
        can: (k) => k === 'products.edit',
        organizationId: 'org1',
        userId: 'u1',
        productId: 'missing',
        input: { name: 'X' },
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError)
  })
})

describe('archive/restore/list/get', () => {
  it('archive requires edit or write', async () => {
    await expect(
      archiveProduct({
        repository: repo(),
        can: () => false,
        organizationId: 'org1',
        userId: 'u1',
        productId: 'p1',
      }),
    ).rejects.toBeInstanceOf(ProductPermissionError)
  })

  it('restore when allowed', async () => {
    const product = await restoreProduct({
      repository: repo(),
      can: (k) => k === 'products.edit',
      organizationId: 'org1',
      userId: 'u1',
      productId: 'p1',
    })
    expect(product.status).toBe('active')
  })

  it('list requires read', async () => {
    await expect(
      listProducts({
        repository: repo(),
        can: () => false,
        organizationId: 'org1',
        query: {},
      }),
    ).rejects.toBeInstanceOf(ProductPermissionError)
  })

  it('get requires read', async () => {
    await expect(
      getProduct({
        repository: repo(),
        can: (k) => k === 'products.read',
        organizationId: 'org1',
        productId: 'p1',
      }),
    ).resolves.toMatchObject({ id: 'p1' })
  })
})

describe('mapRepositoryError', () => {
  it('maps unique violation to conflict', () => {
    expect(() => mapRepositoryError({ code: '23505' })).toThrow(
      ProductConflictError,
    )
  })

  it('maps missing row', () => {
    expect(() => mapRepositoryError({ code: 'PGRST116' })).toThrow(
      ProductNotFoundError,
    )
  })
})
