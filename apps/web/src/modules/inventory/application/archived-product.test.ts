import { describe, expect, it, vi } from 'vitest'
import { ProductArchivedError } from '#/modules/inventory/application/errors'
import { registerEntry } from '#/modules/inventory/application/register-entry'
import type {
  InventoryRepository,
  ProductStock,
} from '#/modules/inventory/domain/types'

function stock(overrides?: Partial<ProductStock>): ProductStock {
  return {
    productId: 'p1',
    organizationId: 'org1',
    name: 'Item',
    sku: 'SKU-1',
    unit: 'un',
    status: 'active',
    quantity: 5,
    stockStatus: 'available',
    updatedAt: '2026-01-01T00:00:00.000Z',
    balanceUpdatedAt: null,
    ...overrides,
  }
}

describe('archived product movements', () => {
  it('blocks entry when repository reports product_archived', async () => {
    const repository: InventoryRepository = {
      listStock: vi.fn(),
      getProductStock: vi.fn(async () =>
        stock({ status: 'inactive', quantity: 5 }),
      ),
      listMovements: vi.fn(),
      registerMovement: vi.fn(async () => {
        throw { message: 'product_archived', code: '22023' }
      }),
    }

    await expect(
      registerEntry({
        repository,
        can: (k) => k === 'inventory.move',
        organizationId: 'org1',
        userId: 'u1',
        input: {
          productId: 'p1',
          quantity: 1,
          reason: 'compra',
        },
      }),
    ).rejects.toBeInstanceOf(ProductArchivedError)
  })
})
