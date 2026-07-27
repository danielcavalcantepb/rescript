import { createServerFn } from '@tanstack/react-start'
import type { PermissionKey } from '@rescript/permissions'
import type {
  CancelInventoryShipmentInput,
  CompleteInventoryShipmentInput,
  CreateInventoryShipmentInput,
  DispatchInventoryShipmentInput,
  InventoryShipmentDetail,
  InventoryShipmentListItem,
  InventoryShipmentListQuery,
  InventoryShipmentStatus,
  MarkInventoryShipmentReadyInput,
} from '#/modules/inventory/domain/shipment/types'

export type ShipmentRpcResult<T> =
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

async function run<T>(handler: () => Promise<T>): Promise<ShipmentRpcResult<T>> {
  try {
    return { ok: true, data: await handler() }
  } catch (error) {
    const code = error instanceof Error ? error.message : 'shipment_error'
    return {
      ok: false,
      error: {
        code,
        message: code.includes('permission')
          ? 'Você não tem permissão para esta operação.'
          : 'Não foi possível concluir a operação de expedição.',
      },
    }
  }
}

function mapList(row: Record<string, unknown>): InventoryShipmentListItem {
  return {
    id: String(row.shipment_id ?? row.id),
    number: String(row.number),
    packingId: String(row.packing_id),
    packingNumber: String(row.packing_number),
    pickingId: String(row.picking_id),
    pickingNumber: String(row.picking_number),
    reservationId: String(row.reservation_id),
    reservationNumber: String(row.reservation_number),
    sourceType: row.source_type as 'sales_order',
    sourceId: String(row.source_id),
    sourceNumber: String(row.source_number),
    customerName: String(row.customer_name),
    customerDocument:
      row.customer_document == null ? null : String(row.customer_document),
    status: row.status as InventoryShipmentStatus,
    totalQuantityPacked: String(row.total_quantity_packed),
    totalQuantityShipped: String(row.total_quantity_shipped),
    carrier: row.carrier == null ? null : String(row.carrier),
    service: row.service == null ? null : String(row.service),
    trackingCode: row.tracking_code == null ? null : String(row.tracking_code),
    dispatchDate: row.dispatch_date == null ? null : String(row.dispatch_date),
    deliveredDate: row.delivered_date == null ? null : String(row.delivered_date),
    createdAt: String(row.created_at),
  }
}

function mapDetail(raw: {
  document: Record<string, unknown>
  items: Record<string, unknown>[]
  movements: Record<string, unknown>[]
  history: Record<string, unknown>[]
}): InventoryShipmentDetail {
  const document = raw.document
  return {
    ...mapList({
      ...document,
      shipment_id: document.id,
    }),
    customerId: document.customer_id == null ? null : String(document.customer_id),
    customerEmail:
      document.customer_email == null ? null : String(document.customer_email),
    customerPhone:
      document.customer_phone == null ? null : String(document.customer_phone),
    locationId: String(document.location_id),
    freightAmount:
      document.freight_amount == null ? null : String(document.freight_amount),
    estimatedDeliveryDate:
      document.estimated_delivery_date == null
        ? null
        : String(document.estimated_delivery_date),
    notes: document.notes == null ? null : String(document.notes),
    updatedAt: String(document.updated_at),
    items: raw.items.map((item) => ({
      id: String(item.id),
      packingItemId: String(item.packing_item_id),
      pickingItemId: String(item.picking_item_id),
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
      quantityPacked: String(item.quantity_packed),
      quantityShipped: String(item.quantity_shipped),
      status: item.status as InventoryShipmentStatus,
      ledgerMovementId:
        item.ledger_movement_id == null ? null : String(item.ledger_movement_id),
    })),
    movements: raw.movements.map((movement) => ({
      id: String(movement.id),
      variantId: String(movement.variant_id),
      locationId: String(movement.location_id),
      inventoryItemId: String(movement.inventory_item_id),
      type: 'exit',
      quantity: String(movement.quantity),
      signedDelta: String(movement.signed_delta),
      beforeQuantity: String(movement.before_quantity),
      afterQuantity: String(movement.after_quantity),
      reason: String(movement.reason),
      occurredAt: String(movement.occurred_at),
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

export const listInventoryShipments = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      query?: InventoryShipmentListQuery
    }) => input,
  )
  .handler(({ data }) =>
    run(async () => {
      const client = await context(data.organizationId, 'shipment.read')
      const rows = await rpc<Record<string, unknown>[]>(
        client,
        'list_inventory_shipments',
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

export const getInventoryShipment = createServerFn({ method: 'POST' })
  .validator((input: { organizationId: string; shipmentId: string }) => input)
  .handler(({ data }) =>
    run(async () => {
      const client = await context(data.organizationId, 'shipment.read')
      const raw = await rpc<{
        document: Record<string, unknown>
        items: Record<string, unknown>[]
        movements: Record<string, unknown>[]
        history: Record<string, unknown>[]
      } | null>(client, 'get_inventory_shipment', {
        p_org: data.organizationId,
        p_shipment_id: data.shipmentId,
      })
      if (!raw) throw new Error('shipment_not_found')
      return mapDetail(raw)
    }),
  )

export const createInventoryShipment = createServerFn({ method: 'POST' })
  .validator(
    (input: { organizationId: string; input: CreateInventoryShipmentInput }) =>
      input,
  )
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(
        await context(data.organizationId, 'shipment.create'),
        'create_inventory_shipment',
        {
          p_org: data.organizationId,
          p_packing_id: data.input.packingId,
          p_notes: data.input.notes ?? null,
        },
      ),
    ),
  )

export const markInventoryShipmentReady = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      input: MarkInventoryShipmentReadyInput
    }) => input,
  )
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(
        await context(data.organizationId, 'shipment.ready'),
        'mark_inventory_shipment_ready',
        {
          p_org: data.organizationId,
          p_shipment_id: data.input.shipmentId,
          p_carrier: data.input.carrier ?? null,
          p_service: data.input.service ?? null,
          p_tracking_code: data.input.trackingCode ?? null,
          p_freight_amount: data.input.freightAmount ?? null,
          p_estimated_delivery_date: data.input.estimatedDeliveryDate ?? null,
          p_notes: data.input.notes ?? null,
        },
      ),
    ),
  )

export const dispatchInventoryShipment = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      input: DispatchInventoryShipmentInput
    }) => input,
  )
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(
        await context(data.organizationId, 'shipment.dispatch'),
        'dispatch_inventory_shipment',
        {
          p_org: data.organizationId,
          p_shipment_id: data.input.shipmentId,
          p_idempotency_key: data.input.idempotencyKey ?? null,
        },
      ),
    ),
  )

export const completeInventoryShipment = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      input: CompleteInventoryShipmentInput
    }) => input,
  )
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(
        await context(data.organizationId, 'shipment.complete'),
        'complete_inventory_shipment',
        {
          p_org: data.organizationId,
          p_shipment_id: data.input.shipmentId,
          p_delivered_date: data.input.deliveredDate ?? null,
        },
      ),
    ),
  )

export const cancelInventoryShipment = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      organizationId: string
      input: CancelInventoryShipmentInput
    }) => input,
  )
  .handler(({ data }) =>
    run(async () =>
      rpc<string>(
        await context(data.organizationId, 'shipment.cancel'),
        'cancel_inventory_shipment',
        {
          p_org: data.organizationId,
          p_shipment_id: data.input.shipmentId,
          p_reason: data.input.reason ?? null,
        },
      ),
    ),
  )
