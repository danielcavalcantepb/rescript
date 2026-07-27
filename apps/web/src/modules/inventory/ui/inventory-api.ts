import { createServerFn } from '@tanstack/react-start'
import type {
  CreateInventoryItemInput,
  CreateLocationInput,
  GetAvailabilityInput,
  GetInventoryItemInput,
  GetLocationInput,
  InventoryRpcResult,
  ListInventoryItemsInput,
  ListLocationsResponse,
  LocationLifecycleInput,
  LookupVariantInput,
  UpdateInventoryItemInput,
  UpdateLocationInput,
  VariantInventorySummaryInput,
} from '#/modules/inventory/ui/api/contracts'
import { toInventoryRpcError } from '#/modules/inventory/ui/errors/inventory-rpc-errors'

/**
 * Inventory Foundation UI → Application RPC bridge.
 * organizationId from the client is a membership selection claim only.
 */
async function createServerInventoryFoundationApp(organizationId: string) {
  const {
    can: canCheck,
    isRolePreset,
    permissionsForRole,
  } = await import('@rescript/permissions')
  const { createInventoryFoundationService } = await import(
    '#/modules/inventory/application/foundation/inventory-foundation-service'
  )
  const { createInMemoryInventoryEventCollector } = await import(
    '#/modules/inventory/domain/foundation/events'
  )
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )
  const { createSupabaseInventoryFoundationRepos } = await import(
    '#/modules/inventory/infrastructure/foundation/index.server'
  )

  const client = createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()
  if (userError || !user) {
    throw new Error('not_authenticated')
  }

  const { data: membership, error: membershipError } = await client
    .from('membership')
    .select('role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership || !isRolePreset(membership.role)) {
    throw new Error('not_org_member')
  }

  const grants = permissionsForRole(membership.role)
  const can = (key: Parameters<typeof canCheck>[1]) => canCheck(grants, key)

  const repos = await createSupabaseInventoryFoundationRepos({
    client,
    actorUserId: user.id,
    organizationId,
  })

  return createInventoryFoundationService({
    organizationId: repos.organizationId,
    userId: repos.actorUserId,
    can,
    ids: { next: () => crypto.randomUUID() },
    clock: { nowIso: () => new Date().toISOString() },
    events: createInMemoryInventoryEventCollector(),
    locations: repos.locations,
    items: repos.items,
    history: repos.history,
    variantLookup: repos.variantLookup,
    ledger: repos.ledger,
  })
}

async function runInventoryRpc<T>(
  organizationId: string,
  run: (
    app: Awaited<ReturnType<typeof createServerInventoryFoundationApp>>,
  ) => Promise<T>,
): Promise<InventoryRpcResult<T>> {
  try {
    const app = await createServerInventoryFoundationApp(organizationId)
    const data = await run(app)
    return { ok: true, data }
  } catch (error) {
    return { ok: false, error: toInventoryRpcError(error) }
  }
}

export const inventoryListLocations = createServerFn({ method: 'POST' })
  .validator((input: { organizationId: string }) => input)
  .handler(
    async ({ data }): Promise<InventoryRpcResult<ListLocationsResponse>> =>
      runInventoryRpc(data.organizationId, (app) => app.listLocations()),
  )

export const inventoryGetLocation = createServerFn({ method: 'POST' })
  .validator((input: GetLocationInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.getLocation(data.locationId),
    ),
  )

export const inventoryCreateLocation = createServerFn({ method: 'POST' })
  .validator((input: CreateLocationInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.createLocation(data.command),
    ),
  )

export const inventoryUpdateLocation = createServerFn({ method: 'POST' })
  .validator((input: UpdateLocationInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.updateLocation(data.command),
    ),
  )

export const inventoryActivateLocation = createServerFn({ method: 'POST' })
  .validator((input: LocationLifecycleInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.activateLocation(data.command),
    ),
  )

export const inventoryDeactivateLocation = createServerFn({ method: 'POST' })
  .validator((input: LocationLifecycleInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.deactivateLocation(data.command),
    ),
  )

export const inventoryArchiveLocation = createServerFn({ method: 'POST' })
  .validator((input: LocationLifecycleInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.archiveLocation(data.command),
    ),
  )

export const inventoryRestoreLocation = createServerFn({ method: 'POST' })
  .validator((input: LocationLifecycleInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.restoreLocation(data.command),
    ),
  )

export const inventoryListItems = createServerFn({ method: 'POST' })
  .validator((input: ListInventoryItemsInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.listInventoryItems(data.query),
    ),
  )

export const inventoryGetItem = createServerFn({ method: 'POST' })
  .validator((input: GetInventoryItemInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.getInventoryItem(data.inventoryItemId),
    ),
  )

export const inventoryCreateItem = createServerFn({ method: 'POST' })
  .validator((input: CreateInventoryItemInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.createInventoryItem(data.command),
    ),
  )

export const inventoryUpdateItem = createServerFn({ method: 'POST' })
  .validator((input: UpdateInventoryItemInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.updateInventoryItem(data.command),
    ),
  )

export const inventoryGetAvailability = createServerFn({ method: 'POST' })
  .validator((input: GetAvailabilityInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.getAvailability({
        variantId: data.variantId,
        locationId: data.locationId,
      }),
    ),
  )

export const inventoryGetVariantSummary = createServerFn({ method: 'POST' })
  .validator((input: VariantInventorySummaryInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.getVariantInventorySummary(data.variantId),
    ),
  )

export const inventoryLookupVariant = createServerFn({ method: 'POST' })
  .validator((input: LookupVariantInput) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.lookupVariant(data.variantId),
    ),
  )

export const inventoryListMovements = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      query?: {
        variantId?: string
        locationId?: string
        inventoryItemId?: string
        type?: string
        limit?: number
      }
    }) => input,
  )
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.listMovements(data.query as never),
    ),
  )

export const inventoryGetMovement = createServerFn({ method: 'POST' })
  .validator((input: { organizationId: string; movementId: string }) => input)
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.getMovement(data.movementId),
    ),
  )

export const inventoryCreateEntry = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      command: {
        variantId: string
        locationId: string
        quantity: number
        reason: string
        notes?: string | null
        idempotencyKey?: string | null
      }
    }) => input,
  )
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.createEntry(data.command),
    ),
  )

export const inventoryCreateExit = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      command: {
        variantId: string
        locationId: string
        quantity: number
        reason: string
        notes?: string | null
        idempotencyKey?: string | null
      }
    }) => input,
  )
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) => app.createExit(data.command)),
  )

export const inventoryCreateAdjustment = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      command: {
        variantId: string
        locationId: string
        quantity: number
        direction: 'in' | 'out'
        reason: string
        notes?: string | null
        idempotencyKey?: string | null
      }
    }) => input,
  )
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.createAdjustment(data.command),
    ),
  )

export const inventoryCreateTransfer = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      command: {
        variantId: string
        fromLocationId: string
        toLocationId: string
        quantity: number
        reason: string
        notes?: string | null
        idempotencyKey?: string | null
      }
    }) => input,
  )
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.createTransfer(data.command),
    ),
  )

export const inventoryReverseMovement = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      command: {
        movementId: string
        reason: string
        notes?: string | null
        idempotencyKey?: string | null
      }
    }) => input,
  )
  .handler(async ({ data }) =>
    runInventoryRpc(data.organizationId, (app) =>
      app.reverseMovement(data.command),
    ),
  )
