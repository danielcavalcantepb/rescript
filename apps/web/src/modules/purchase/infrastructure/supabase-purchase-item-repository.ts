import '#/modules/purchase/infrastructure/assert-server-only'
import type { PurchaseItemRepository } from '#/modules/purchase/application/ports'
import type { PurchaseItem } from '#/modules/purchase/domain/types'
import type { PurchaseReposOptions } from '#/modules/purchase/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/purchase/infrastructure/errors'
import { mapPurchaseItem } from '#/modules/purchase/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/purchase/infrastructure/tenant-context'
import type { Database } from '@rescript/database'

type PurchaseItemUpdate = Database['public']['Tables']['purchase_item']['Update']

function toNumeric(value: string): number {
  return Number(value)
}

export class SupabasePurchaseItemRepository implements PurchaseItemRepository {
  constructor(private readonly options: PurchaseReposOptions) {}

  async listByPurchase(
    organizationId: string,
    purchaseOrderId: string,
    includeRemoved = false,
  ): Promise<PurchaseItem[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    let builder = this.options.client
      .from('purchase_item')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('purchase_order_id', purchaseOrderId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!includeRemoved) {
      builder = builder.eq('status', 'active')
    }

    const { data, error } = await builder
    throwIfSupabaseError(error)
    return (data ?? []).map(mapPurchaseItem)
  }

  async getById(organizationId: string, id: string): Promise<PurchaseItem | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('purchase_item')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapPurchaseItem(data) : null
  }

  async create(
    organizationId: string,
    userId: string,
    input: Parameters<PurchaseItemRepository['create']>[2],
  ): Promise<PurchaseItem> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('purchase_item')
      .insert({
        organization_id: this.options.organizationId,
        purchase_order_id: input.purchaseOrderId,
        variant_id: input.variantId,
        variant_sku: input.variantSnapshot.sku,
        variant_name: input.variantSnapshot.name,
        unit_code: input.variantSnapshot.unitCode,
        description: input.description,
        quantity: toNumeric(input.quantity),
        unit_price: toNumeric(input.priceSnapshot.unitPrice),
        currency: input.priceSnapshot.currency,
        discount: toNumeric(input.discount),
        subtotal: toNumeric(input.subtotal),
        total: toNumeric(input.total),
        price_list_id: input.priceSnapshot.priceListId,
        price_source: input.priceSnapshot.source,
        sort_order: input.sortOrder,
        status: 'active',
        created_by: userId,
        updated_by: userId,
      })
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('purchase_item_create_failed')
    return mapPurchaseItem(data)
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: Parameters<PurchaseItemRepository['update']>[3],
  ): Promise<PurchaseItem> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const patch: PurchaseItemUpdate = { updated_by: userId }
    if (input.quantity !== undefined) patch.quantity = toNumeric(input.quantity)
    if (input.unitPrice !== undefined)
      patch.unit_price = toNumeric(input.unitPrice)
    if (input.discount !== undefined) patch.discount = toNumeric(input.discount)
    if (input.description !== undefined) patch.description = input.description
    if (input.subtotal !== undefined) patch.subtotal = toNumeric(input.subtotal)
    if (input.total !== undefined) patch.total = toNumeric(input.total)
    if (input.currency !== undefined) patch.currency = input.currency

    const { data, error } = await this.options.client
      .from('purchase_item')
      .update(patch)
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('purchase_item_update_failed')
    return mapPurchaseItem(data)
  }

  async softRemove(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<PurchaseItem> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const removedAt = new Date().toISOString()
    const { data, error } = await this.options.client
      .from('purchase_item')
      .update({
        status: 'removed',
        removed_at: removedAt,
        updated_by: userId,
      })
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('purchase_item_remove_failed')
    return mapPurchaseItem(data)
  }
}
