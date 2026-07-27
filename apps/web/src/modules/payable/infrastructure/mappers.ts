import type { Tables } from '@rescript/database'
import type {
  AccountsPayable,
  PayableHistoryEntry,
  PayableInstallment,
  PayableListItem,
  PayableStatus,
  PayableTotals,
} from '#/modules/payable/domain/types'

export function numericToString(value: number | string): string {
  if (typeof value === 'string') return value
  return Number(value).toFixed(4)
}

export function toNumeric(value: string): number {
  return Number(value)
}

function mapTotals(row: Tables<'accounts_payable'>): PayableTotals {
  return {
    currency: row.currency,
    originalAmount: numericToString(row.original_amount),
    openBalance: numericToString(row.open_balance),
  }
}

export function mapAccountsPayable(
  row: Tables<'accounts_payable'>,
): AccountsPayable {
  return {
    id: row.id,
    organizationId: row.organization_id,
    number: row.number,
    supplierSnapshot: {
      supplierId: row.supplier_id,
      legalName: row.supplier_legal_name,
      document: row.supplier_document,
      email: row.supplier_email,
      phone: row.supplier_phone,
    },
    purchaseSnapshot: {
      purchaseOrderId: row.purchase_order_id,
      purchaseNumber: row.purchase_number,
    },
    receivingSnapshot: {
      goodsReceiptId: row.goods_receipt_id,
      goodsReceiptNumber: row.goods_receipt_number,
      receivedAt: row.goods_receipt_received_at,
    },
    status: row.status as PayableStatus,
    previousStatus: row.previous_status as AccountsPayable['previousStatus'],
    currency: row.currency,
    totals: mapTotals(row),
    issueDate: row.issue_date,
    notes: row.notes,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapPayableListItem(
  row: Tables<'accounts_payable_search'>,
): PayableListItem {
  return {
    id: row.accounts_payable_id,
    number: row.number,
    supplierLegalName: row.supplier_legal_name,
    supplierDocument: row.supplier_document,
    purchaseNumber: row.purchase_number,
    goodsReceiptNumber: row.goods_receipt_number,
    status: row.status as PayableStatus,
    currency: row.currency,
    originalAmount: numericToString(row.original_amount),
    openBalance: numericToString(row.open_balance),
    issueDate: row.issue_date,
    nextDueDate: row.next_due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapPayableInstallment(
  row: Tables<'payable_installment'>,
): PayableInstallment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    accountsPayableId: row.accounts_payable_id,
    sequence: row.sequence,
    dueDate: row.due_date,
    amount: numericToString(row.amount),
    openBalance: numericToString(row.open_balance),
    status: row.status as PayableInstallment['status'],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** @deprecated alias */
export const mapInstallment = mapPayableInstallment

export function mapPayableHistory(
  row: Tables<'accounts_payable_history'>,
): PayableHistoryEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    accountsPayableId: row.accounts_payable_id,
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

/** @deprecated alias */
export const mapHistory = mapPayableHistory
