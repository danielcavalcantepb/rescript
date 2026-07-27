import '#/modules/receiving/infrastructure/assert-server-only'
import type { PurchaseReceivingPort } from '#/modules/receiving/application/ports'
import type { ReceivingReposOptions } from '#/modules/receiving/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/receiving/infrastructure/errors'
import { assertEntityOrganization } from '#/modules/receiving/infrastructure/tenant-context'

function numericToString(value: number | string): string {
  if (typeof value === 'string') return value
  return value.toFixed(4)
}

export class SupabasePurchaseReceivingPort implements PurchaseReceivingPort {
  constructor(private readonly options: ReceivingReposOptions) {}

  async getPurchaseForReceiving(
    organizationId: string,
    purchaseOrderId: string,
  ) {
    assertEntityOrganization(organizationId, this.options.organizationId)

    const { data: order, error: orderError } = await this.options.client
      .from('purchase_order')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', purchaseOrderId)
      .maybeSingle()
    throwIfSupabaseError(orderError)
    if (!order) return null

    const { data: items, error: itemsError } = await this.options.client
      .from('purchase_item')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('purchase_order_id', purchaseOrderId)
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    throwIfSupabaseError(itemsError)

    return {
      purchaseOrderId: order.id,
      purchaseNumber: order.number,
      status: order.status,
      supplier: {
        supplierId: order.supplier_id,
        legalName: order.supplier_legal_name,
        document: order.supplier_document,
      },
      items: (items ?? []).map((row) => {
        const orderedQuantity = numericToString(row.quantity)
        const receivedQuantity = numericToString(
          (row as typeof row & { received_quantity?: number }).received_quantity ?? 0,
        )
        const pending = Math.max(0, Number(orderedQuantity) - Number(receivedQuantity))
        return {
          purchaseItemId: row.id,
          variantId: row.variant_id,
          variantSku: row.variant_sku,
          variantName: row.variant_name,
          unitCode: row.unit_code,
          orderedQuantity,
          receivedQuantity,
          pendingQuantity: pending.toFixed(4),
          status: row.status as 'active' | 'removed',
        }
      }),
    }
  }
}
