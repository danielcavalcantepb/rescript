import '#/modules/inventory/infrastructure/foundation/assert-server-only'
import type { InventoryLedgerPort } from '#/modules/inventory/application/foundation/ledger-ports'
import type {
  InventoryLedgerMovement,
  InventoryMovementResult,
  LedgerMovementType,
} from '#/modules/inventory/domain/ledger/types'
import { quantityAvailable } from '#/modules/inventory/domain/foundation/types'
import type { InventoryFoundationReposOptions } from '#/modules/inventory/infrastructure/foundation/client-options'
import { throwIfSupabaseError } from '#/modules/inventory/infrastructure/foundation/errors'
import { assertEntityOrganization } from '#/modules/inventory/infrastructure/foundation/tenant-context'
import type { Database } from '@rescript/database'

type Row = Database['public']['Tables']['inventory_ledger_movement']['Row']

function opt<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined
}

function mapMovement(row: Row): InventoryLedgerMovement {
  return {
    id: row.id,
    organizationId: row.organization_id,
    variantId: row.variant_id,
    locationId: row.location_id,
    inventoryItemId: row.inventory_item_id,
    type: row.type as LedgerMovementType,
    quantity: Number(row.quantity),
    signedDelta: Number(row.signed_delta),
    beforeQuantity: Number(row.before_quantity),
    afterQuantity: Number(row.after_quantity),
    reason: row.reason,
    notes: row.notes,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    correlationId: row.correlation_id,
    idempotencyKey: row.idempotency_key,
    reversesMovementId: row.reverses_movement_id,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

async function loadProjection(
  options: InventoryFoundationReposOptions,
  variantId: string,
  locationId: string,
): Promise<InventoryMovementResult['projection']> {
  const { data, error } = await options.client
    .from('inventory_item')
    .select('qty_on_hand, qty_reserved, version')
    .eq('organization_id', options.organizationId)
    .eq('variant_id', variantId)
    .eq('location_id', locationId)
    .maybeSingle()
  throwIfSupabaseError(error)
  const onHand = Number(data?.qty_on_hand ?? 0)
  const reserved = Number(data?.qty_reserved ?? 0)
  return {
    variantId,
    locationId,
    quantityOnHand: onHand,
    quantityReserved: reserved,
    quantityAvailable: quantityAvailable({
      quantityOnHand: onHand,
      quantityReserved: reserved,
    }),
    version: Number(data?.version ?? 0),
  }
}

export class SupabaseInventoryLedgerRepository implements InventoryLedgerPort {
  constructor(private readonly options: InventoryFoundationReposOptions) {}

  async registerMovement(
    organizationId: string,
    input: Parameters<InventoryLedgerPort['registerMovement']>[1],
  ): Promise<InventoryMovementResult> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client.rpc(
      'register_inventory_ledger_movement',
      {
        p_organization_id: this.options.organizationId,
        p_variant_id: input.variantId,
        p_location_id: input.locationId,
        p_type: input.type,
        p_quantity: input.quantity,
        p_reason: input.reason,
        p_notes: opt(input.notes),
        p_occurred_at: input.occurredAt ?? new Date().toISOString(),
        p_reference_type: opt(input.referenceType),
        p_reference_id: opt(input.referenceId),
        p_correlation_id: opt(input.correlationId),
        p_idempotency_key: opt(input.idempotencyKey),
      },
    )
    throwIfSupabaseError(error)
    const movement = mapMovement(data as Row)
    return {
      movement,
      projection: await loadProjection(
        this.options,
        movement.variantId,
        movement.locationId,
      ),
      related: [],
    }
  }

  async registerTransfer(
    organizationId: string,
    input: Parameters<InventoryLedgerPort['registerTransfer']>[1],
  ): Promise<InventoryMovementResult> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client.rpc(
      'register_inventory_ledger_transfer',
      {
        p_organization_id: this.options.organizationId,
        p_variant_id: input.variantId,
        p_from_location_id: input.fromLocationId,
        p_to_location_id: input.toLocationId,
        p_quantity: input.quantity,
        p_reason: input.reason,
        p_notes: opt(input.notes),
        p_occurred_at: input.occurredAt ?? new Date().toISOString(),
        p_idempotency_key: opt(input.idempotencyKey),
      },
    )
    throwIfSupabaseError(error)
    const rows = (data ?? []) as Row[]
    const related = rows.map(mapMovement)
    const movement = related[0]
    if (!movement) throw new Error('transfer_failed')
    return {
      movement,
      projection: await loadProjection(
        this.options,
        movement.variantId,
        movement.locationId,
      ),
      related,
    }
  }

  async reverseMovement(
    organizationId: string,
    input: Parameters<InventoryLedgerPort['reverseMovement']>[1],
  ): Promise<InventoryMovementResult> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const target = await this.getById(organizationId, input.movementId)
    if (!target) throw new Error('movement_not_found')

    const { data, error } = await this.options.client.rpc(
      'register_inventory_ledger_movement',
      {
        p_organization_id: this.options.organizationId,
        p_variant_id: target.variantId,
        p_location_id: target.locationId,
        p_type: 'reversal',
        p_quantity: target.quantity,
        p_reason: input.reason,
        p_notes: opt(input.notes),
        p_occurred_at: new Date().toISOString(),
        p_reference_type: 'reversal',
        p_reference_id: target.id,
        p_correlation_id: opt(target.correlationId),
        p_idempotency_key: opt(input.idempotencyKey),
        p_reverses_movement_id: target.id,
      },
    )
    throwIfSupabaseError(error)
    const movement = mapMovement(data as Row)
    return {
      movement,
      projection: await loadProjection(
        this.options,
        movement.variantId,
        movement.locationId,
      ),
      related: [],
    }
  }

  async getById(
    organizationId: string,
    movementId: string,
  ): Promise<InventoryLedgerMovement | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('inventory_ledger_movement')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', movementId)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapMovement(data as Row) : null
  }

  async list(
    organizationId: string,
    query: Parameters<InventoryLedgerPort['list']>[1],
  ) {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
    let builder = this.options.client
      .from('inventory_ledger_movement')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .order('occurred_at', { ascending: false })
      .limit(limit)

    if (query.variantId) builder = builder.eq('variant_id', query.variantId)
    if (query.locationId) builder = builder.eq('location_id', query.locationId)
    if (query.inventoryItemId) {
      builder = builder.eq('inventory_item_id', query.inventoryItemId)
    }
    if (query.type && query.type !== 'all') {
      builder = builder.eq('type', query.type)
    }
    if (query.correlationId) {
      builder = builder.eq('correlation_id', query.correlationId)
    }

    const { data, error } = await builder
    throwIfSupabaseError(error)
    return {
      items: ((data ?? []) as Row[]).map(mapMovement),
      nextCursor: null,
    }
  }
}
