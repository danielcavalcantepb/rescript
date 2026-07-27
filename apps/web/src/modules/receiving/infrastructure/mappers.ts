import type { Tables } from '@rescript/database'
import type {
  GoodsReceipt,
  GoodsReceiptItem,
  ReceiptDivergence,
  ReceiptHistoryEntry,
  ReceiptListItem,
  ReceiptStatus,
  ReceiptPurchaseSnapshot,
  ReceiptSupplierSnapshot,
} from '#/modules/receiving/domain/types'
import { pendingQuantity } from '#/modules/receiving/domain/totals'

function numericToString(value: number | string): string {
  if (typeof value === 'string') return value
  return value.toFixed(4)
}

function mapPurchaseSnapshot(row: Tables<'goods_receipt'>): ReceiptPurchaseSnapshot {
  return {
    purchaseOrderId: row.purchase_order_id,
    purchaseNumber: row.purchase_number,
  }
}

function mapSupplierSnapshot(row: Tables<'goods_receipt'>): ReceiptSupplierSnapshot {
  return {
    supplierId: row.supplier_id,
    legalName: row.supplier_legal_name,
    document: row.supplier_document,
  }
}

export function mapGoodsReceipt(row: Tables<'goods_receipt'>): GoodsReceipt {
  return {
    id: row.id,
    organizationId: row.organization_id,
    number: row.number,
    purchaseOrderId: row.purchase_order_id,
    purchaseSnapshot: mapPurchaseSnapshot(row),
    supplierSnapshot: mapSupplierSnapshot(row),
    status: row.status as ReceiptStatus,
    previousStatus: row.previous_status as GoodsReceipt['previousStatus'],
    locationId: row.location_id,
    notes: row.notes,
    receivedAt: row.received_at,
    postIdempotencyKey: row.post_idempotency_key,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapReceiptListItem(
  row: Tables<'goods_receipt_search'> | Tables<'goods_receipt'>,
): ReceiptListItem {
  if ('goods_receipt_id' in row) {
    return {
      id: row.goods_receipt_id,
      number: row.number,
      purchaseNumber: row.purchase_number,
      supplierLegalName: row.supplier_legal_name,
      supplierDocument: row.supplier_document,
      status: row.status as ReceiptStatus,
      receivedAt: row.received_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
  const receipt = mapGoodsReceipt(row)
  return {
    id: receipt.id,
    number: receipt.number,
    purchaseNumber: receipt.purchaseSnapshot.purchaseNumber,
    supplierLegalName: receipt.supplierSnapshot.legalName,
    supplierDocument: receipt.supplierSnapshot.document,
    status: receipt.status,
    receivedAt: receipt.receivedAt,
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
  }
}

export function mapGoodsReceiptItem(row: Tables<'goods_receipt_item'>): GoodsReceiptItem {
  const orderedQuantity = numericToString(row.ordered_quantity)
  const receivedQuantity = numericToString(row.received_quantity)
  return {
    id: row.id,
    organizationId: row.organization_id,
    goodsReceiptId: row.goods_receipt_id,
    purchaseItemId: row.purchase_item_id,
    variantId: row.variant_id,
    locationId: row.location_id,
    variantSku: row.variant_sku,
    variantName: row.variant_name,
    unitCode: row.unit_code,
    orderedQuantity,
    receivedQuantity,
    pendingQuantity: pendingQuantity(orderedQuantity, receivedQuantity),
    divergence: row.divergence as ReceiptDivergence | null,
    notes: row.notes,
    sortOrder: row.sort_order,
    ledgerMovementId: row.ledger_movement_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapReceiptHistory(row: Tables<'goods_receipt_history'>): ReceiptHistoryEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    goodsReceiptId: row.goods_receipt_id,
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
