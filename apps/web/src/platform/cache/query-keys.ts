/**
 * Query key factory — always scope domain keys with organizationId.
 */
export const queryKeys = {
  root: ['rescript'] as const,
  auth: {
    session: () => [...queryKeys.root, 'auth', 'session'] as const,
  },
  organization: {
    all: () => [...queryKeys.root, 'organization'] as const,
    current: () => [...queryKeys.organization.all(), 'current'] as const,
    list: () => [...queryKeys.organization.all(), 'list'] as const,
  },
  permissions: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'permissions', organizationId] as const,
  },
  customers: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'customers', organizationId] as const,
    lists: (organizationId: string) =>
      [...queryKeys.customers.all(organizationId), 'list'] as const,
    list: (
      organizationId: string,
      filters: {
        q?: string
        status?: string
        sort?: string
      },
    ) =>
      [
        ...queryKeys.customers.lists(organizationId),
        filters,
      ] as const,
    detail: (organizationId: string, id: string) =>
      [...queryKeys.customers.all(organizationId), 'detail', id] as const,
  },
  products: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'products', organizationId] as const,
    lists: (organizationId: string) =>
      [...queryKeys.products.all(organizationId), 'list'] as const,
    list: (
      organizationId: string,
      filters: {
        q?: string
        status?: string
        sort?: string
      },
    ) =>
      [
        ...queryKeys.products.lists(organizationId),
        filters,
      ] as const,
    detail: (organizationId: string, id: string) =>
      [...queryKeys.products.all(organizationId), 'detail', id] as const,
  },
  inventory: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'inventory', organizationId] as const,
    stocks: (organizationId: string) =>
      [...queryKeys.inventory.all(organizationId), 'stock'] as const,
    stock: (
      organizationId: string,
      filters: {
        q?: string
        status?: string
        stockStatus?: string
        sort?: string
      },
    ) =>
      [...queryKeys.inventory.stocks(organizationId), filters] as const,
    productStock: (organizationId: string, productId: string) =>
      [
        ...queryKeys.inventory.all(organizationId),
        'product',
        productId,
      ] as const,
    movements: (organizationId: string) =>
      [...queryKeys.inventory.all(organizationId), 'movements'] as const,
    movementList: (
      organizationId: string,
      filters: {
        q?: string
        productId?: string
        type?: string
        from?: string
        to?: string
      },
    ) =>
      [...queryKeys.inventory.movements(organizationId), filters] as const,
  },
  sales: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'sales', organizationId] as const,
    detail: (organizationId: string, id: string) =>
      [...queryKeys.sales.all(organizationId), id] as const,
  },
  insights: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'insights', organizationId] as const,
  },
}

export function invalidateOrganizationScope(
  invalidate: (key: readonly unknown[]) => void,
  organizationId: string,
) {
  invalidate(queryKeys.permissions.all(organizationId))
  invalidate(queryKeys.customers.all(organizationId))
  invalidate(queryKeys.products.all(organizationId))
  invalidate(queryKeys.inventory.all(organizationId))
  invalidate(queryKeys.sales.all(organizationId))
  invalidate(queryKeys.insights.all(organizationId))
}
