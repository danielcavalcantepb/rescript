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
    detail: (organizationId: string, id: string) =>
      [...queryKeys.products.all(organizationId), id] as const,
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
  invalidate(queryKeys.sales.all(organizationId))
  invalidate(queryKeys.insights.all(organizationId))
}
