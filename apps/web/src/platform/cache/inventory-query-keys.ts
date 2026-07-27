/** Inventory Foundation React Query keys — always scoped by organizationId. */
export const inventoryQueryKeys = {
  all: (organizationId: string) =>
    ['rescript', 'inventory-foundation', organizationId] as const,
  locations: (organizationId: string) =>
    [...inventoryQueryKeys.all(organizationId), 'locations'] as const,
  locationDetail: (organizationId: string, locationId: string) =>
    [
      ...inventoryQueryKeys.locations(organizationId),
      'detail',
      locationId,
    ] as const,
  items: (
    organizationId: string,
    query?: { variantId?: string; locationId?: string },
  ) =>
    [...inventoryQueryKeys.all(organizationId), 'items', query ?? {}] as const,
  itemDetail: (organizationId: string, inventoryItemId: string) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'item',
      inventoryItemId,
    ] as const,
  availability: (
    organizationId: string,
    variantId: string,
    locationId?: string,
  ) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'availability',
      variantId,
      locationId ?? 'default',
    ] as const,
  variantSummary: (organizationId: string, variantId: string) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'variant-summary',
      variantId,
    ] as const,
  movements: (
    organizationId: string,
    query?: {
      variantId?: string
      locationId?: string
      inventoryItemId?: string
      type?: string
      limit?: number
    },
  ) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'movements',
      query ?? {},
    ] as const,
  movementDetail: (organizationId: string, movementId: string) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'movement',
      movementId,
    ] as const,
  reservations: (
    organizationId: string,
    query?: {
      q?: string
      status?: string
      limit?: number
    },
  ) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'reservations',
      query ?? {},
    ] as const,
  reservationDetail: (organizationId: string, reservationId: string) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'reservation',
      reservationId,
    ] as const,
  pickings: (
    organizationId: string,
    query?: {
      q?: string
      status?: string
      limit?: number
    },
  ) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'pickings',
      query ?? {},
    ] as const,
  pickingDetail: (organizationId: string, pickingId: string) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'picking',
      pickingId,
    ] as const,
  packings: (
    organizationId: string,
    query?: {
      q?: string
      status?: string
      limit?: number
    },
  ) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'packings',
      query ?? {},
    ] as const,
  packingDetail: (organizationId: string, packingId: string) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'packing',
      packingId,
    ] as const,
  shipments: (
    organizationId: string,
    query?: {
      q?: string
      status?: string
      limit?: number
    },
  ) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'shipments',
      query ?? {},
    ] as const,
  shipmentDetail: (organizationId: string, shipmentId: string) =>
    [
      ...inventoryQueryKeys.all(organizationId),
      'shipment',
      shipmentId,
    ] as const,
}
