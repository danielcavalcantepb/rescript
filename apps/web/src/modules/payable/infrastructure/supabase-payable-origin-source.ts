import '#/modules/payable/infrastructure/assert-server-only'
import type { PayableOriginSource } from '#/modules/payable/application/ports'
import type { PayableReposOptions } from '#/modules/payable/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/payable/infrastructure/errors'
import { assertEntityOrganization } from '#/modules/payable/infrastructure/tenant-context'

function round4(n: number): string {
  return (Math.round(n * 10000) / 10000).toFixed(4)
}

export class SupabasePayableOriginSource implements PayableOriginSource {
  constructor(private readonly options: PayableReposOptions) {}

  async getPostedReceiptOrigin(
    organizationId: string,
    goodsReceiptId: string,
  ) {
    assertEntityOrganization(organizationId, this.options.organizationId)

    const { data: receipt, error: receiptError } = await this.options.client
      .from('goods_receipt')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', goodsReceiptId)
      .eq('status', 'posted')
      .maybeSingle()
    throwIfSupabaseError(receiptError)
    if (!receipt) return null

    const { data: order, error: orderError } = await this.options.client
      .from('purchase_order')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', receipt.purchase_order_id)
      .maybeSingle()
    throwIfSupabaseError(orderError)
    if (!order) return null

    const { data: purchaseItems, error: itemsError } = await this.options.client
      .from('purchase_item')
      .select('id, unit_price')
      .eq('organization_id', this.options.organizationId)
      .eq('purchase_order_id', order.id)
    throwIfSupabaseError(itemsError)

    const priceByItemId = new Map(
      (purchaseItems ?? []).map((row) => [row.id, Number(row.unit_price)]),
    )

    const { data: grItems, error: grItemsError } = await this.options.client
      .from('goods_receipt_item')
      .select('purchase_item_id, received_quantity')
      .eq('organization_id', this.options.organizationId)
      .eq('goods_receipt_id', goodsReceiptId)
    throwIfSupabaseError(grItemsError)

    let total = 0
    for (const line of grItems ?? []) {
      const qty = Number(line.received_quantity)
      if (!Number.isFinite(qty) || qty <= 0) continue
      const unitPrice = priceByItemId.get(line.purchase_item_id) ?? 0
      total += qty * unitPrice
    }

    const originalAmount = round4(total)

    return {
      supplier: {
        supplierId: receipt.supplier_id,
        legalName: receipt.supplier_legal_name,
        document: receipt.supplier_document,
        email: order.supplier_email ?? null,
        phone: order.supplier_phone ?? null,
      },
      purchase: {
        purchaseOrderId: order.id,
        purchaseNumber: order.number,
      },
      receiving: {
        goodsReceiptId: receipt.id,
        goodsReceiptNumber: receipt.number,
        receivedAt: receipt.received_at,
      },
      currency: order.currency,
      originalAmount,
    }
  }
}
