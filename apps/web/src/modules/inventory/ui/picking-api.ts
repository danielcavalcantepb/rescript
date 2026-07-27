import { createServerFn } from '@tanstack/react-start'
import type { PermissionKey } from '@rescript/permissions'
import type {
  CreateInventoryPickingInput,
  InventoryPickingDetail,
  InventoryPickingListItem,
  InventoryPickingListQuery,
  InventoryPickingStatus,
  UpdateInventoryPickingItemsInput,
} from '#/modules/inventory/domain/picking/types'

export type PickingRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

type Client = {
  rpc(
    name: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

async function context(organizationId: string, permission: PermissionKey) {
  const { can, isRolePreset, permissionsForRole } = await import(
    '@rescript/permissions'
  )
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )
  const client = createServerSupabaseClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('not_authenticated')

  const { data: membership } = await client
    .from('membership')
    .select('role,status')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (
    !membership ||
    !isRolePreset(membership.role) ||
    !can(permissionsForRole(membership.role), permission)
  ) {
    throw new Error('permission_denied')
  }

  return client as unknown as Client
}

async function rpc<T>(
  client: Client,
  name: string,
  args: Record<string, unknown>,
) {
  const { data, error } = await client.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

async function run<T>(handler: () => Promise<T>): Promise<PickingRpcResult<T>> {
  try {
    return { ok: true, data: await handler() }
  } catch (error) {
    const code = error instanceof Error ? error.message : 'picking_error'
    return {
      ok: false,
      error: {
        code,
        message: code.includes('permission')
          ? 'Você não tem permissão para esta operação.'
          : 'Não foi possível concluir a operação de separação.',
      },
    }
  }
}

function mapList(row: Record<string, unknown>): InventoryPickingListItem {
  return {
    id: String(row.picking_id ?? row.id),
    number: String(row.number),
    reservationId: String(row.reservation_id),
    reservationNumber: String(row.reservation_number),
    sourceType: row.source_type as 'sales_order',
    sourceId: String(row.source_id),
    sourceNumber: String(row.source_number),
    customerName: String(row.customer_name),
    customerDocument:
      row.customer_document == null ? null : String(row.customer_document),
    status: row.status as InventoryPickingStatus,
    totalQuantityReserved: String(row.total_quantity_reserved),
    totalQuantityPicked: String(row.total_quantity_picked),
    createdAt: String(row.created_at),
  }
}

function mapDetail(raw: {
  document: Record<string, unknown>
  items: Record<string, unknown>[]
  history: Record<string, unknown>[]
}): InventoryPickingDetail {
  const document = raw.document
  return {
    ...mapList({
      ...document,
      picking_id: document.id,
    }),
    customerId: document.customer_id == null ? null : String(document.customer_id),
    customerEmail:
      document.customer_email == null ? null : String(document.customer_email),
    customerPhone:
      document.customer_phone == null ? null : String(document.customer_phone),
    locationId: String(document.location_id),
    notes: document.notes == null ? null : String(document.notes),
    updatedAt: String(document.updated_at),
    items: raw.items.map((item) => ({
      id: String(item.id),
      reservationItemId: String(item.reservation_item_id),
      productId: String(item.product_id),
      variantId: String(item.variant_id),
      productName: String(item.product_name),
      description:
        item.variant_description == null
          ? null
          : String(item.variant_description),
      sku: String(item.sku),
      unitCode: String(item.unit_code),
      locationId: String(item.location_id),
      quantityReserved: String(item.quantity_reserved),
      quantityPicked: String(item.quantity_picked),
      status: item.status as InventoryPickingStatus,
    })),
    history: raw.history.map((entry) => ({
      id: String(entry.id),
      action: String(entry.action),
      oldValue: entry.old_value == null ? null : String(entry.old_value),
      newValue: entry.new_value == null ? null : String(entry.new_value),
      reason: entry.reason == null ? null : String(entry.reason),
      createdAt: String(entry.created_at),
    })),
  }
}

export const listInventoryPickings = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      query?: InventoryPickingListQuery
    }) => input,
  )
  .handler(({ data }) =>
    run(async () => {
      const client = await context(data.organizationId, 'picking.read')
      const rows = await rpc<Record<string, unknown>[]>(
        client,
        'list_inventory_pickings',
        {
          p_org: data.organizationId,
          p_query: data.query?.q ?? null,
          p_status: data.query?.status || null,
          p_limit: data.query?.limit ?? 50,
        },
      )
      return rows.map(mapList)
    }),
  )

export const getInventoryPicking = createServerFn({ method: 'POST' })
  .validator((input: { organizationId: string; pickingId: string }) => input)
  .handler(({ data }) =>
    run(async () => {
      const client = await context(data.organizationId, 'picking.read')
      const raw = await rpc<{
        document: Record<string, unknown>
        items: Record<string, unknown>[]
        history: Record<string, unknown>[]
      } | null>(client, 'get_inventory_picking', {
        p_org: data.organizationId,
        p_picking_id: data.pickingId,
      })
      if (!raw) throw new Error('picking_not_found')
      return mapDetail(raw)
    }),
  )

export const createInventoryPicking = createServerFn({ method: 'POST' })
  .validator(
    (input: { organizationId: string; input: CreateInventoryPickingInput }) =>
      input,
  )
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(await context(data.organizationId, 'picking.create'), 'create_inventory_picking', {
        p_org: data.organizationId,
        p_reservation_id: data.input.reservationId,
        p_notes: data.input.notes ?? null,
      }),
    ),
  )

export const startInventoryPicking = createServerFn({ method: 'POST' })
  .validator((input: { organizationId: string; pickingId: string }) => input)
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(await context(data.organizationId, 'picking.start'), 'start_inventory_picking', {
        p_org: data.organizationId,
        p_picking_id: data.pickingId,
      }),
    ),
  )

export const updateInventoryPickingItems = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      input: UpdateInventoryPickingItemsInput
    }) => input,
  )
  .handler(({ data }) =>
    run(async () => {
      const { validatePickingItemUpdates } = await import(
        '#/modules/inventory/domain/picking/validation'
      )
      validatePickingItemUpdates(data.input.items)
      return rpc<string>(
        await context(data.organizationId, 'picking.edit'),
        'update_inventory_picking_items',
        {
          p_org: data.organizationId,
          p_picking_id: data.input.pickingId,
          p_items: data.input.items,
          p_reason: data.input.reason ?? null,
        },
      )
    }),
  )

export const completeInventoryPicking = createServerFn({ method: 'POST' })
  .validator((input: { organizationId: string; pickingId: string }) => input)
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(
        await context(data.organizationId, 'picking.complete'),
        'complete_inventory_picking',
        {
          p_org: data.organizationId,
          p_picking_id: data.pickingId,
        },
      ),
    ),
  )

export const cancelInventoryPicking = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      pickingId: string
      reason?: string | null
    }) => input,
  )
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(
        await context(data.organizationId, 'picking.cancel'),
        'cancel_inventory_picking',
        {
          p_org: data.organizationId,
          p_picking_id: data.pickingId,
          p_reason: data.reason ?? null,
        },
      ),
    ),
  )
