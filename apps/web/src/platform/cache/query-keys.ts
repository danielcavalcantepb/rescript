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
    search: (organizationId: string, q: string) =>
      [...queryKeys.customers.all(organizationId), 'search', q] as const,
    contacts: (organizationId: string, customerId: string) =>
      [
        ...queryKeys.customers.detail(organizationId, customerId),
        'contacts',
      ] as const,
    addresses: (organizationId: string, customerId: string) =>
      [
        ...queryKeys.customers.detail(organizationId, customerId),
        'addresses',
      ] as const,
    history: (organizationId: string, customerId: string) =>
      [
        ...queryKeys.customers.detail(organizationId, customerId),
        'history',
      ] as const,
  },
  receiving: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'receiving', organizationId] as const,
    lists: (organizationId: string) =>
      [...queryKeys.receiving.all(organizationId), 'list'] as const,
    list: (
      organizationId: string,
      filters: {
        q?: string
        status?: string
        from?: string
        to?: string
        sort?: string
      },
    ) => [...queryKeys.receiving.lists(organizationId), filters] as const,
    detail: (organizationId: string, id: string) =>
      [...queryKeys.receiving.all(organizationId), 'detail', id] as const,
    search: (organizationId: string, q: string) =>
      [...queryKeys.receiving.all(organizationId), 'search', q] as const,
    history: (organizationId: string, goodsReceiptId: string) =>
      [
        ...queryKeys.receiving.detail(organizationId, goodsReceiptId),
        'history',
      ] as const,
  },
  payables: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'payables', organizationId] as const,
    lists: (organizationId: string) =>
      [...queryKeys.payables.all(organizationId), 'list'] as const,
    list: (
      organizationId: string,
      filters: {
        q?: string
        status?: string
        dueFrom?: string
        dueTo?: string
        from?: string
        to?: string
        sort?: string
      },
    ) => [...queryKeys.payables.lists(organizationId), filters] as const,
    detail: (organizationId: string, id: string) =>
      [...queryKeys.payables.all(organizationId), 'detail', id] as const,
    search: (organizationId: string, q: string) =>
      [...queryKeys.payables.all(organizationId), 'search', q] as const,
    installments: (organizationId: string, accountsPayableId: string) =>
      [
        ...queryKeys.payables.detail(organizationId, accountsPayableId),
        'installments',
      ] as const,
    history: (organizationId: string, accountsPayableId: string) =>
      [
        ...queryKeys.payables.detail(organizationId, accountsPayableId),
        'history',
      ] as const,
  },
  payments: {
    all: (organizationId: string) => [...queryKeys.root, 'payments', organizationId] as const,
    list: (organizationId: string, filters: Record<string, unknown>) =>
      [...queryKeys.payments.all(organizationId), 'list', filters] as const,
    detail: (organizationId: string, id: string) =>
      [...queryKeys.payments.all(organizationId), 'detail', id] as const,
    accounts: (organizationId: string) =>
      [...queryKeys.payments.all(organizationId), 'financial-accounts'] as const,
  },
  receivables: {
    all: (organizationId: string) => [...queryKeys.root, 'receivables', organizationId] as const,
    list: (organizationId: string, filters: Record<string, unknown>) => [...queryKeys.receivables.all(organizationId), 'list', filters] as const,
    detail: (organizationId: string, id: string) => [...queryKeys.receivables.all(organizationId), 'detail', id] as const,
  },
  purchases: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'purchases', organizationId] as const,
    lists: (organizationId: string) =>
      [...queryKeys.purchases.all(organizationId), 'list'] as const,
    list: (
      organizationId: string,
      filters: {
        q?: string
        status?: string
        from?: string
        to?: string
        sort?: string
      },
    ) => [...queryKeys.purchases.lists(organizationId), filters] as const,
    detail: (organizationId: string, id: string) =>
      [...queryKeys.purchases.all(organizationId), 'detail', id] as const,
    search: (organizationId: string, q: string) =>
      [...queryKeys.purchases.all(organizationId), 'search', q] as const,
    items: (organizationId: string, purchaseOrderId: string) =>
      [
        ...queryKeys.purchases.detail(organizationId, purchaseOrderId),
        'items',
      ] as const,
    history: (organizationId: string, purchaseOrderId: string) =>
      [
        ...queryKeys.purchases.detail(organizationId, purchaseOrderId),
        'history',
      ] as const,
  },
  suppliers: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'suppliers', organizationId] as const,
    lists: (organizationId: string) =>
      [...queryKeys.suppliers.all(organizationId), 'list'] as const,
    list: (
      organizationId: string,
      filters: {
        q?: string
        status?: string
        sort?: string
      },
    ) => [...queryKeys.suppliers.lists(organizationId), filters] as const,
    detail: (organizationId: string, id: string) =>
      [...queryKeys.suppliers.all(organizationId), 'detail', id] as const,
    search: (organizationId: string, q: string) =>
      [...queryKeys.suppliers.all(organizationId), 'search', q] as const,
    contacts: (organizationId: string, supplierId: string) =>
      [
        ...queryKeys.suppliers.detail(organizationId, supplierId),
        'contacts',
      ] as const,
    addresses: (organizationId: string, supplierId: string) =>
      [
        ...queryKeys.suppliers.detail(organizationId, supplierId),
        'addresses',
      ] as const,
    history: (organizationId: string, supplierId: string) =>
      [
        ...queryKeys.suppliers.detail(organizationId, supplierId),
        'history',
      ] as const,
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
    list: (organizationId: string, type: string, filters: Record<string, unknown>) =>
      [...queryKeys.sales.all(organizationId), type, 'list', filters] as const,
    detail: (organizationId: string, type: string, id: string) =>
      [...queryKeys.sales.all(organizationId), type, 'detail', id] as const,
  },
  commandCenter: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'command-center', organizationId] as const,
    overview: (organizationId: string) =>
      [...queryKeys.commandCenter.all(organizationId), 'overview'] as const,
  },
  analytics: {
    all: (organizationId: string) =>
      [...queryKeys.root, 'analytics', organizationId] as const,
    workspace: (organizationId: string, filters: Record<string, unknown>) =>
      [...queryKeys.analytics.all(organizationId), 'workspace', filters] as const,
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
  invalidate(queryKeys.receiving.all(organizationId))
  invalidate(queryKeys.payables.all(organizationId))
  invalidate(queryKeys.payments.all(organizationId))
  invalidate(queryKeys.receivables.all(organizationId))
  invalidate(queryKeys.purchases.all(organizationId))
  invalidate(queryKeys.suppliers.all(organizationId))
  invalidate(queryKeys.products.all(organizationId))
  invalidate(queryKeys.inventory.all(organizationId))
  invalidate(queryKeys.sales.all(organizationId))
  invalidate(queryKeys.commandCenter.all(organizationId))
  invalidate(queryKeys.analytics.all(organizationId))
  invalidate(queryKeys.insights.all(organizationId))
  invalidate(['rescript', 'catalog', organizationId])
}
