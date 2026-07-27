import type { Tables } from '@rescript/database'
import type {
  PurchaseHistoryEntry,
  PurchaseItem,
  PurchaseListItem,
  PurchaseOrder,
  PurchasePriceSource,
  PurchaseStatus,
  PurchaseTotals,
  SupplierSnapshot,
} from '#/modules/purchase/domain/types'

function numericToString(value: number | string): string {
  if (typeof value === 'string') return value
  return value.toFixed(4)
}

function mapSupplierSnapshot(row: Tables<'purchase_order'>): SupplierSnapshot {
  return {
    supplierId: row.supplier_id,
    legalName: row.supplier_legal_name,
    document: row.supplier_document,
    email: row.supplier_email,
    phone: row.supplier_phone,
  }
}

function mapTotals(row: Tables<'purchase_order'>): PurchaseTotals {
  return {
    currency: row.currency,
    subtotal: numericToString(row.subtotal),
    discountTotal: numericToString(row.discount_total),
    grandTotal: numericToString(row.grand_total),
  }
}

export function mapPurchaseOrder(row: Tables<'purchase_order'>): PurchaseOrder {
  return {
    id: row.id,
    organizationId: row.organization_id,
    number: row.number,
    supplierId: row.supplier_id,
    supplierSnapshot: mapSupplierSnapshot(row),
    status: row.status as PurchaseStatus,
    previousStatus: row.previous_status as PurchaseOrder['previousStatus'],
    currency: row.currency,
    totals: mapTotals(row),
    notes: row.notes,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapPurchaseListItem(
  row: Tables<'purchase_search'> | Tables<'purchase_order'>,
): PurchaseListItem {
  if ('purchase_order_id' in row) {
    return {
      id: row.purchase_order_id,
      number: row.number,
      supplierLegalName: row.supplier_legal_name,
      supplierDocument: row.supplier_document,
      status: row.status as PurchaseStatus,
      currency: row.currency,
      grandTotal: numericToString(row.grand_total),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
  const order = mapPurchaseOrder(row)
  return {
    id: order.id,
    number: order.number,
    supplierLegalName: order.supplierSnapshot.legalName,
    supplierDocument: order.supplierSnapshot.document,
    status: order.status,
    currency: order.currency,
    grandTotal: order.totals.grandTotal,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

export function mapPurchaseItem(row: Tables<'purchase_item'>): PurchaseItem {
  const quantity = numericToString(row.quantity)
  const receivedQuantity = numericToString(row.received_quantity ?? 0)
  const pending = Math.max(0, Number(quantity) - Number(receivedQuantity))
  return {
    id: row.id,
    organizationId: row.organization_id,
    purchaseOrderId: row.purchase_order_id,
    variantId: row.variant_id,
    variantSku: row.variant_sku,
    variantName: row.variant_name,
    unitCode: row.unit_code,
    description: row.description,
    quantity,
    receivedQuantity,
    pendingQuantity: pending.toFixed(4),
    unitPrice: numericToString(row.unit_price),
    currency: row.currency,
    discount: numericToString(row.discount),
    subtotal: numericToString(row.subtotal),
    total: numericToString(row.total),
    priceListId: row.price_list_id,
    priceSource: row.price_source as PurchasePriceSource,
    sortOrder: row.sort_order,
    status: row.status as PurchaseItem['status'],
    removedAt: row.removed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapHistory(row: Tables<'purchase_history'>): PurchaseHistoryEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    purchaseOrderId: row.purchase_order_id,
    action: row.action,
    fieldName: row.field_name,
    oldValue: row.old_value,
    newValue: row.new_value,
    reason: row.reason,
    actorUserId: row.actor_user_id,
    actorIp: row.actor_ip,
    createdAt: row.created_at,
  }
}
