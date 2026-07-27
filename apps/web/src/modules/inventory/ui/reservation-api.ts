import { createServerFn } from '@tanstack/react-start'
import type { PermissionKey } from '@rescript/permissions'
import type {
  CreateInventoryReservationInput,
  InventoryReservationDetail,
  InventoryReservationListItem,
  InventoryReservationListQuery,
  InventoryReservationStatus,
  ReleaseInventoryReservationInput,
} from '#/modules/inventory/domain/reservation/types'

export type ReservationRpcResult<T> =
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

async function run<T>(handler: () => Promise<T>): Promise<ReservationRpcResult<T>> {
  try {
    return { ok: true, data: await handler() }
  } catch (error) {
    const code = error instanceof Error ? error.message : 'reservation_error'
    return {
      ok: false,
      error: {
        code,
        message: code.includes('permission')
          ? 'Você não tem permissão para esta operação.'
          : 'Não foi possível concluir a operação de reserva.',
      },
    }
  }
}

function mapList(row: Record<string, unknown>): InventoryReservationListItem {
  return {
    id: String(row.reservation_id ?? row.id),
    number: String(row.number),
    sourceType: row.source_type as 'sales_order',
    sourceId: String(row.source_id),
    sourceNumber: String(row.source_number),
    customerName: String(row.customer_name),
    customerDocument:
      row.customer_document == null ? null : String(row.customer_document),
    status: row.status as InventoryReservationStatus,
    totalQuantityReserved: String(row.total_quantity_reserved),
    totalQuantityReleased: String(row.total_quantity_released),
    createdAt: String(row.created_at),
  }
}

function mapDetail(raw: {
  document: Record<string, unknown>
  items: Record<string, unknown>[]
  history: Record<string, unknown>[]
}): InventoryReservationDetail {
  const document = raw.document
  return {
    ...mapList({
      ...document,
      reservation_id: document.id,
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
      salesOrderItemId:
        item.sales_order_item_id == null
          ? null
          : String(item.sales_order_item_id),
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
      quantityReleased: String(item.quantity_released),
      status: item.status as InventoryReservationStatus,
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

export const listInventoryReservations = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      query?: InventoryReservationListQuery
    }) => input,
  )
  .handler(({ data }) =>
    run(async () => {
      const client = await context(data.organizationId, 'reservation.read')
      const rows = await rpc<Record<string, unknown>[]>(
        client,
        'list_inventory_reservations',
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

export const getInventoryReservation = createServerFn({ method: 'POST' })
  .validator((input: { organizationId: string; reservationId: string }) => input)
  .handler(({ data }) =>
    run(async () => {
      const client = await context(data.organizationId, 'reservation.read')
      const raw = await rpc<{
        document: Record<string, unknown>
        items: Record<string, unknown>[]
        history: Record<string, unknown>[]
      } | null>(client, 'get_inventory_reservation', {
        p_org: data.organizationId,
        p_reservation_id: data.reservationId,
      })
      if (!raw) throw new Error('reservation_not_found')
      return mapDetail(raw)
    }),
  )

export const createInventoryReservation = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      input: CreateInventoryReservationInput
    }) => input,
  )
  .handler(({ data }) =>
    run(async () => {
      const client = await context(data.organizationId, 'reservation.create')
      return rpc<string>(client, 'create_inventory_reservation_from_sales_order', {
        p_org: data.organizationId,
        p_sales_order_id: data.input.salesOrderId,
        p_notes: data.input.notes ?? null,
      })
    }),
  )

export const activateInventoryReservation = createServerFn({ method: 'POST' })
  .validator((input: { organizationId: string; reservationId: string }) => input)
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(
        await context(data.organizationId, 'reservation.activate'),
        'activate_inventory_reservation',
        {
          p_org: data.organizationId,
          p_reservation_id: data.reservationId,
        },
      ),
    ),
  )

export const releaseInventoryReservation = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      input: ReleaseInventoryReservationInput
    }) => input,
  )
  .handler(({ data }) =>
    run(async () => {
      const { validateReservationReleaseItems } = await import(
        '#/modules/inventory/domain/reservation/validation'
      )
      validateReservationReleaseItems(data.input.items)
      return rpc<string>(
        await context(data.organizationId, 'reservation.release'),
        'release_inventory_reservation',
        {
          p_org: data.organizationId,
          p_reservation_id: data.input.reservationId,
          p_items: data.input.items ?? null,
          p_reason: data.input.reason ?? null,
        },
      )
    }),
  )

export const cancelInventoryReservation = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      reservationId: string
      reason?: string | null
    }) => input,
  )
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(
        await context(data.organizationId, 'reservation.cancel'),
        'cancel_inventory_reservation',
        {
          p_org: data.organizationId,
          p_reservation_id: data.reservationId,
          p_reason: data.reason ?? null,
        },
      ),
    ),
  )
