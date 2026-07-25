import { describe, expect, it, vi } from 'vitest'
import { archiveCustomer } from '#/modules/customers/application/archive-customer'
import { createCustomer } from '#/modules/customers/application/create-customer'
import {
  CustomerArchivedError,
  CustomerConflictError,
  CustomerNotFoundError,
  CustomerPermissionError,
  CustomerValidationError,
  mapRepositoryError,
} from '#/modules/customers/application/errors'
import { getCustomer } from '#/modules/customers/application/get-customer'
import { listCustomers } from '#/modules/customers/application/list-customers'
import { restoreCustomer } from '#/modules/customers/application/restore-customer'
import { updateCustomer } from '#/modules/customers/application/update-customer'
import type {
  Customer,
  CustomerRepository,
} from '#/modules/customers/domain/types'

function sample(overrides?: Partial<Customer>): Customer {
  return {
    id: 'c1',
    organizationId: 'org1',
    name: 'Acme',
    tradeName: null,
    personType: 'PJ',
    document: null,
    email: null,
    phone: null,
    city: null,
    notes: null,
    status: 'active',
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function repo(partial?: Partial<CustomerRepository>): CustomerRepository {
  return {
    list: vi.fn(async () => ({ items: [sample()], nextCursor: null })),
    getById: vi.fn(async () => sample()),
    create: vi.fn(async (_o, _u, input) =>
      sample({ name: input.name, personType: input.personType }),
    ),
    update: vi.fn(async (_o, _u, _id, input) =>
      sample({ name: input.name ?? 'Acme' }),
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

describe('createCustomer', () => {
  it('denies without permission', async () => {
    await expect(
      createCustomer({
        repository: repo(),
        can: () => false,
        organizationId: 'org1',
        userId: 'u1',
        input: { name: 'A', personType: 'PJ' },
      }),
    ).rejects.toBeInstanceOf(CustomerPermissionError)
  })

  it('validates input', async () => {
    await expect(
      createCustomer({
        repository: repo(),
        can: (k) => k === 'customers.create',
        organizationId: 'org1',
        userId: 'u1',
        input: { name: '', personType: 'PJ' },
      }),
    ).rejects.toBeInstanceOf(CustomerValidationError)
  })

  it('creates when allowed', async () => {
    const r = repo()
    const customer = await createCustomer({
      repository: r,
      can: (k) => k === 'customers.create',
      organizationId: 'org1',
      userId: 'u1',
      input: { name: 'Acme', personType: 'PJ' },
    })
    expect(customer.name).toBe('Acme')
    expect(r.create).toHaveBeenCalledWith('org1', 'u1', {
      name: 'Acme',
      personType: 'PJ',
    })
  })

  it('maps unique document conflict', async () => {
    const r = repo({
      create: vi.fn(async () => {
        throw { code: '23505' }
      }),
    })
    await expect(
      createCustomer({
        repository: r,
        can: (k) => k === 'customers.write',
        organizationId: 'org1',
        userId: 'u1',
        input: { name: 'Acme', personType: 'PJ', document: '11222333000181' },
      }),
    ).rejects.toBeInstanceOf(CustomerConflictError)
  })
})

describe('updateCustomer', () => {
  it('denies without permission', async () => {
    await expect(
      updateCustomer({
        repository: repo(),
        can: () => false,
        organizationId: 'org1',
        userId: 'u1',
        customerId: 'c1',
        input: { name: 'Nova' },
      }),
    ).rejects.toBeInstanceOf(CustomerPermissionError)
  })

  it('throws not found', async () => {
    await expect(
      updateCustomer({
        repository: repo({ getById: vi.fn(async () => null) }),
        can: (k) => k === 'customers.edit',
        organizationId: 'org1',
        userId: 'u1',
        customerId: 'missing',
        input: { name: 'Nova' },
      }),
    ).rejects.toBeInstanceOf(CustomerNotFoundError)
  })

  it('blocks edit when archived', async () => {
    await expect(
      updateCustomer({
        repository: repo({
          getById: vi.fn(async () =>
            sample({ status: 'inactive', archivedAt: '2026-01-02T00:00:00.000Z' }),
          ),
        }),
        can: (k) => k === 'customers.edit',
        organizationId: 'org1',
        userId: 'u1',
        customerId: 'c1',
        input: { name: 'Nova' },
      }),
    ).rejects.toBeInstanceOf(CustomerArchivedError)
  })

  it('updates when allowed', async () => {
    const r = repo()
    const customer = await updateCustomer({
      repository: r,
      can: (k) => k === 'customers.edit',
      organizationId: 'org1',
      userId: 'u1',
      customerId: 'c1',
      input: { name: 'Nova' },
    })
    expect(customer.name).toBe('Nova')
    expect(r.update).toHaveBeenCalled()
  })
})

describe('archiveCustomer / restoreCustomer', () => {
  it('archives when allowed', async () => {
    const r = repo()
    const customer = await archiveCustomer({
      repository: r,
      can: (k) => k === 'customers.edit',
      organizationId: 'org1',
      userId: 'u1',
      customerId: 'c1',
    })
    expect(customer.status).toBe('inactive')
  })

  it('restores when allowed', async () => {
    const r = repo({
      getById: vi.fn(async () =>
        sample({ status: 'inactive', archivedAt: '2026-01-02T00:00:00.000Z' }),
      ),
    })
    const customer = await restoreCustomer({
      repository: r,
      can: (k) => k === 'customers.write',
      organizationId: 'org1',
      userId: 'u1',
      customerId: 'c1',
    })
    expect(customer.status).toBe('active')
  })

  it('denies archive without permission', async () => {
    await expect(
      archiveCustomer({
        repository: repo(),
        can: (k) => k === 'customers.read',
        organizationId: 'org1',
        userId: 'u1',
        customerId: 'c1',
      }),
    ).rejects.toBeInstanceOf(CustomerPermissionError)
  })
})

describe('getCustomer / listCustomers', () => {
  it('get requires read', async () => {
    await expect(
      getCustomer({
        repository: repo(),
        can: () => false,
        organizationId: 'org1',
        customerId: 'c1',
      }),
    ).rejects.toBeInstanceOf(CustomerPermissionError)
  })

  it('get throws not found', async () => {
    await expect(
      getCustomer({
        repository: repo({ getById: vi.fn(async () => null) }),
        can: (k) => k === 'customers.read',
        organizationId: 'org1',
        customerId: 'missing',
      }),
    ).rejects.toBeInstanceOf(CustomerNotFoundError)
  })

  it('list requires read and scopes org', async () => {
    const r = repo()
    const result = await listCustomers({
      repository: r,
      can: (k) => k === 'customers.read',
      organizationId: 'org1',
      query: { q: 'ac', status: 'active', limit: 20 },
    })
    expect(result.items).toHaveLength(1)
    expect(r.list).toHaveBeenCalledWith('org1', {
      q: 'ac',
      status: 'active',
      limit: 20,
    })
  })

  it('list denies without permission', async () => {
    await expect(
      listCustomers({
        repository: repo(),
        can: () => false,
        organizationId: 'org1',
        query: {},
      }),
    ).rejects.toBeInstanceOf(CustomerPermissionError)
  })
})

describe('mapRepositoryError', () => {
  it('maps unique violation', () => {
    expect(() => mapRepositoryError({ code: '23505' })).toThrow(
      CustomerConflictError,
    )
  })

  it('maps missing row', () => {
    expect(() => mapRepositoryError({ code: 'PGRST116' })).toThrow(
      CustomerNotFoundError,
    )
  })
})
