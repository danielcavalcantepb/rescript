import { describe, expect, it, vi } from 'vitest'
import {
  InsufficientStockError,
  InventoryValidationError,
  NotFoundError,
  PermissionError,
  ProductArchivedError,
  inventoryErrorMessage,
  mapRepositoryError,
} from '#/modules/inventory/application/errors'
import { getProductStock } from '#/modules/inventory/application/get-product-stock'
import { listMovements } from '#/modules/inventory/application/list-movements'
import { listStock } from '#/modules/inventory/application/list-stock'
import { registerAdjustment } from '#/modules/inventory/application/register-adjustment'
import { registerEntry } from '#/modules/inventory/application/register-entry'
import { registerExit } from '#/modules/inventory/application/register-exit'
import type {
  InventoryMovement,
  InventoryRepository,
  ProductStock,
} from '#/modules/inventory/domain/types'

function stock(overrides?: Partial<ProductStock>): ProductStock {
  return {
    productId: 'p1',
    organizationId: 'org1',
    name: 'Parafuso',
    sku: 'PAR-01',
    unit: 'un',
    status: 'active',
    quantity: 10,
    stockStatus: 'available',
    updatedAt: '2026-01-01T00:00:00.000Z',
    balanceUpdatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function movement(overrides?: Partial<InventoryMovement>): InventoryMovement {
  return {
    id: 'm1',
    organizationId: 'org1',
    productId: 'p1',
    type: 'entry',
    quantity: 5,
    reason: 'Compra',
    notes: null,
    referenceType: null,
    referenceId: null,
    occurredAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'u1',
    ...overrides,
  }
}

function repo(partial?: Partial<InventoryRepository>): InventoryRepository {
  return {
    listStock: vi.fn(async () => ({ items: [stock()], nextCursor: null })),
    getProductStock: vi.fn(async () => stock()),
    listMovements: vi.fn(async () => ({
      items: [movement()],
      nextCursor: null,
    })),
    registerMovement: vi.fn(async (_org, input) =>
      movement({ type: input.type, quantity: input.quantity, reason: input.reason }),
    ),
    ...partial,
  }
}

describe('listStock / getProductStock / listMovements', () => {
  it('listStock requires inventory.read', async () => {
    await expect(
      listStock({
        repository: repo(),
        can: () => false,
        organizationId: 'org1',
        query: {},
      }),
    ).rejects.toBeInstanceOf(PermissionError)
  })

  it('listStock when allowed', async () => {
    const r = repo()
    const result = await listStock({
      repository: r,
      can: (k) => k === 'inventory.read',
      organizationId: 'org1',
      query: { q: 'par' },
    })
    expect(result.items).toHaveLength(1)
    expect(r.listStock).toHaveBeenCalledWith('org1', { q: 'par' })
  })

  it('getProductStock not found', async () => {
    await expect(
      getProductStock({
        repository: repo({ getProductStock: vi.fn(async () => null) }),
        can: (k) => k === 'inventory.read',
        organizationId: 'org1',
        productId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('listMovements requires read', async () => {
    await expect(
      listMovements({
        repository: repo(),
        can: () => false,
        organizationId: 'org1',
        query: {},
      }),
    ).rejects.toBeInstanceOf(PermissionError)
  })

  it('listMovements when allowed', async () => {
    const result = await listMovements({
      repository: repo(),
      can: (k) => k === 'inventory.read',
      organizationId: 'org1',
      query: { type: 'entry' },
    })
    expect(result.items[0]?.type).toBe('entry')
  })
})

describe('registerEntry', () => {
  it('denies without inventory.move', async () => {
    await expect(
      registerEntry({
        repository: repo(),
        can: () => false,
        organizationId: 'org1',
        userId: 'u1',
        input: { productId: 'p1', quantity: 1, reason: 'Compra' },
      }),
    ).rejects.toBeInstanceOf(PermissionError)
  })

  it('validates input', async () => {
    await expect(
      registerEntry({
        repository: repo(),
        can: (k) => k === 'inventory.move',
        organizationId: 'org1',
        userId: 'u1',
        input: { productId: 'p1', quantity: 0, reason: '' },
      }),
    ).rejects.toBeInstanceOf(InventoryValidationError)
  })

  it('blocks archived products', async () => {
    await expect(
      registerEntry({
        repository: repo({
          getProductStock: vi.fn(async () =>
            stock({ status: 'inactive', quantity: 5 }),
          ),
        }),
        can: (k) => k === 'inventory.move',
        organizationId: 'org1',
        userId: 'u1',
        input: { productId: 'p1', quantity: 1, reason: 'Compra' },
      }),
    ).rejects.toBeInstanceOf(ProductArchivedError)
  })

  it('registers entry via repository', async () => {
    const r = repo()
    const result = await registerEntry({
      repository: r,
      can: (k) => k === 'inventory.move',
      organizationId: 'org1',
      userId: 'u1',
      input: { productId: 'p1', quantity: 5, reason: 'Compra' },
    })
    expect(result.type).toBe('entry')
    expect(r.registerMovement).toHaveBeenCalledWith('org1', {
      productId: 'p1',
      quantity: 5,
      reason: 'Compra',
      type: 'entry',
    })
  })
})

describe('registerExit', () => {
  it('requires inventory.move', async () => {
    await expect(
      registerExit({
        repository: repo(),
        can: (k) => k === 'inventory.adjust',
        organizationId: 'org1',
        userId: 'u1',
        input: { productId: 'p1', quantity: 1, reason: 'Uso' },
      }),
    ).rejects.toBeInstanceOf(PermissionError)
  })

  it('registers exit', async () => {
    const r = repo()
    const result = await registerExit({
      repository: r,
      can: (k) => k === 'inventory.move',
      organizationId: 'org1',
      userId: 'u1',
      input: { productId: 'p1', quantity: 2, reason: 'Uso interno' },
    })
    expect(result.type).toBe('exit')
    expect(r.registerMovement).toHaveBeenCalledWith(
      'org1',
      expect.objectContaining({ type: 'exit', quantity: 2 }),
    )
  })
})

describe('registerAdjustment', () => {
  it('requires inventory.adjust', async () => {
    await expect(
      registerAdjustment({
        repository: repo(),
        can: (k) => k === 'inventory.move',
        organizationId: 'org1',
        userId: 'u1',
        input: {
          productId: 'p1',
          quantity: 1,
          reason: 'Inventário',
          direction: 'in',
        },
      }),
    ).rejects.toBeInstanceOf(PermissionError)
  })

  it('maps direction in/out to adjustment types', async () => {
    const r = repo()
    await registerAdjustment({
      repository: r,
      can: (k) => k === 'inventory.adjust',
      organizationId: 'org1',
      userId: 'u1',
      input: {
        productId: 'p1',
        quantity: 1,
        reason: 'Inventário',
        direction: 'in',
      },
    })
    expect(r.registerMovement).toHaveBeenCalledWith(
      'org1',
      expect.objectContaining({ type: 'adjustment_in' }),
    )

    await registerAdjustment({
      repository: r,
      can: (k) => k === 'inventory.adjust',
      organizationId: 'org1',
      userId: 'u1',
      input: {
        productId: 'p1',
        quantity: 1,
        reason: 'Perda',
        direction: 'out',
      },
    })
    expect(r.registerMovement).toHaveBeenCalledWith(
      'org1',
      expect.objectContaining({ type: 'adjustment_out' }),
    )
  })

  it('blocks archived products', async () => {
    await expect(
      registerAdjustment({
        repository: repo({
          getProductStock: vi.fn(async () =>
            stock({ status: 'inactive' }),
          ),
        }),
        can: (k) => k === 'inventory.adjust',
        organizationId: 'org1',
        userId: 'u1',
        input: {
          productId: 'p1',
          quantity: 1,
          reason: 'Ajuste',
          direction: 'out',
        },
      }),
    ).rejects.toBeInstanceOf(ProductArchivedError)
  })
})

describe('mapRepositoryError / inventoryErrorMessage', () => {
  it('maps insufficient_stock', () => {
    expect(() =>
      mapRepositoryError({ message: 'insufficient_stock' }),
    ).toThrow(InsufficientStockError)
  })

  it('maps product_archived', () => {
    expect(() =>
      mapRepositoryError({ message: 'product_archived' }),
    ).toThrow(ProductArchivedError)
  })

  it('maps product_not_found', () => {
    expect(() =>
      mapRepositoryError({ message: 'product_not_found' }),
    ).toThrow(NotFoundError)
  })

  it('maps invalid_quantity to validation', () => {
    expect(() =>
      mapRepositoryError({ message: 'invalid_quantity' }),
    ).toThrow(InventoryValidationError)
  })

  it('maps permission-ish RPC errors', () => {
    expect(() =>
      mapRepositoryError({ message: 'not_org_member' }),
    ).toThrow(PermissionError)
  })

  it('surfaces friendly messages', () => {
    expect(inventoryErrorMessage(new PermissionError())).toMatch(/permissão/i)
    expect(inventoryErrorMessage(new InsufficientStockError())).toMatch(
      /insuficiente/i,
    )
  })
})
