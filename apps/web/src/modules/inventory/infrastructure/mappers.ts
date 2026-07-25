import type {
  InventoryMovementRow,
  InventoryMovementType,
  ProductStatus,
  Tables,
} from '@rescript/database'
import { stockStatus } from '#/modules/inventory/domain/balance'
import type {
  InventoryMovement,
  ProductStock,
} from '#/modules/inventory/domain/types'

/** Numeric columns may arrive as string from PostgREST — always coerce. */
export function coerceQuantity(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function asInventoryMovementRow(
  row: Tables<'inventory_movement'>,
): InventoryMovementRow {
  return row as InventoryMovementRow
}

export function mapInventoryMovement(
  row: Tables<'inventory_movement'> | InventoryMovementRow,
): InventoryMovement {
  const r = asInventoryMovementRow(row)
  return {
    id: r.id,
    organizationId: r.organization_id,
    productId: r.product_id,
    type: r.type as InventoryMovementType,
    quantity: coerceQuantity(r.quantity),
    reason: r.reason,
    notes: r.notes,
    referenceType: r.reference_type,
    referenceId: r.reference_id,
    occurredAt: r.occurred_at,
    createdAt: r.created_at,
    createdBy: r.created_by,
  }
}

type BalanceEmbed =
  | { quantity: unknown; updated_at?: string | null; organization_id?: string }
  | Array<{
      quantity: unknown
      updated_at?: string | null
      organization_id?: string
    }>
  | null
  | undefined

export type ProductWithBalanceRow = {
  id: string
  organization_id: string
  name: string
  sku: string
  unit: string
  status: string
  updated_at: string
  inventory_balance?: BalanceEmbed
}

function pickBalance(
  embed: BalanceEmbed,
  organizationId: string,
): { quantity: number; updatedAt: string | null } {
  if (!embed) return { quantity: 0, updatedAt: null }
  const rows = Array.isArray(embed) ? embed : [embed]
  const match =
    rows.find((r) => r.organization_id === organizationId) ?? rows[0]
  if (!match) return { quantity: 0, updatedAt: null }
  return {
    quantity: coerceQuantity(match.quantity),
    updatedAt: match.updated_at ?? null,
  }
}

export function mapProductStock(
  row: ProductWithBalanceRow,
  balance?: { quantity: unknown; updated_at?: string | null } | null,
): ProductStock {
  const fromEmbed = pickBalance(row.inventory_balance, row.organization_id)
  const quantity = balance
    ? coerceQuantity(balance.quantity)
    : fromEmbed.quantity
  const balanceUpdatedAt = balance
    ? (balance.updated_at ?? null)
    : fromEmbed.updatedAt

  return {
    productId: row.id,
    organizationId: row.organization_id,
    name: row.name,
    sku: row.sku,
    unit: row.unit,
    status: row.status as ProductStatus,
    quantity,
    stockStatus: stockStatus(quantity),
    updatedAt: row.updated_at,
    balanceUpdatedAt,
  }
}
