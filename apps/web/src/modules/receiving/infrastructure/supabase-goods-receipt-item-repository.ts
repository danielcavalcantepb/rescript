import '#/modules/receiving/infrastructure/assert-server-only'
import type { GoodsReceiptItemRepository } from '#/modules/receiving/application/ports'
import type { GoodsReceiptItem } from '#/modules/receiving/domain/types'
import type { ReceivingReposOptions } from '#/modules/receiving/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/receiving/infrastructure/errors'
import { mapGoodsReceiptItem } from '#/modules/receiving/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/receiving/infrastructure/tenant-context'
import type { Database } from '@rescript/database'

type GoodsReceiptItemUpdate =
  Database['public']['Tables']['goods_receipt_item']['Update']

function toNumeric(value: string): number {
  return Number(value)
}

export class SupabaseGoodsReceiptItemRepository
  implements GoodsReceiptItemRepository
{
  constructor(private readonly options: ReceivingReposOptions) {}

  async listByReceipt(
    organizationId: string,
    goodsReceiptId: string,
  ): Promise<GoodsReceiptItem[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('goods_receipt_item')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('goods_receipt_id', goodsReceiptId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    throwIfSupabaseError(error)
    return (data ?? []).map(mapGoodsReceiptItem)
  }

  async getById(organizationId: string, id: string): Promise<GoodsReceiptItem | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('goods_receipt_item')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapGoodsReceiptItem(data) : null
  }

  async createMany(
    organizationId: string,
    userId: string,
    goodsReceiptId: string,
    items: Parameters<GoodsReceiptItemRepository['createMany']>[3],
  ): Promise<GoodsReceiptItem[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    if (items.length === 0) return []

    const rows = items.map((item) => ({
      organization_id: this.options.organizationId,
      goods_receipt_id: goodsReceiptId,
      purchase_item_id: item.purchaseItemId,
      variant_id: item.variantId,
      location_id: item.locationId,
      variant_sku: item.variantSku,
      variant_name: item.variantName,
      unit_code: item.unitCode,
      ordered_quantity: toNumeric(item.orderedQuantity),
      received_quantity: toNumeric(item.receivedQuantity),
      divergence: item.divergence,
      notes: item.notes,
      sort_order: item.sortOrder,
      created_by: userId,
      updated_by: userId,
    }))

    const { data, error } = await this.options.client
      .from('goods_receipt_item')
      .insert(rows)
      .select('*')
    throwIfSupabaseError(error)
    return (data ?? []).map(mapGoodsReceiptItem)
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: Parameters<GoodsReceiptItemRepository['update']>[3],
  ): Promise<GoodsReceiptItem> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const patch: GoodsReceiptItemUpdate = { updated_by: userId }
    if (input.receivedQuantity !== undefined) {
      patch.received_quantity = toNumeric(input.receivedQuantity)
    }
    if (input.notes !== undefined) patch.notes = input.notes
    if (input.divergence !== undefined) patch.divergence = input.divergence
    if (input.locationId !== undefined) patch.location_id = input.locationId

    const { data, error } = await this.options.client
      .from('goods_receipt_item')
      .update(patch)
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('goods_receipt_item_update_failed')
    return mapGoodsReceiptItem(data)
  }
}
