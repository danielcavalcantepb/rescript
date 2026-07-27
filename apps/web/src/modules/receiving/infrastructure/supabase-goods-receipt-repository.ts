import '#/modules/receiving/infrastructure/assert-server-only'
import type { GoodsReceiptRepository } from '#/modules/receiving/application/ports'
import type { GoodsReceipt, ReceiptStatus } from '#/modules/receiving/domain/types'
import type { ReceivingReposOptions } from '#/modules/receiving/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/receiving/infrastructure/errors'
import { mapGoodsReceipt } from '#/modules/receiving/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/receiving/infrastructure/tenant-context'
import type { Database } from '@rescript/database'

type GoodsReceiptUpdate = Database['public']['Tables']['goods_receipt']['Update']

export class SupabaseGoodsReceiptRepository implements GoodsReceiptRepository {
  constructor(private readonly options: ReceivingReposOptions) {}

  async getById(organizationId: string, id: string): Promise<GoodsReceipt | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('goods_receipt')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapGoodsReceipt(data) : null
  }

  async create(
    organizationId: string,
    userId: string,
    input: Parameters<GoodsReceiptRepository['create']>[2],
  ): Promise<GoodsReceipt> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('goods_receipt')
      .insert({
        organization_id: this.options.organizationId,
        number: input.number,
        purchase_order_id: input.purchase.purchaseOrderId,
        purchase_number: input.purchase.purchaseNumber,
        supplier_id: input.supplier.supplierId,
        supplier_legal_name: input.supplier.legalName,
        supplier_document: input.supplier.document,
        status: input.status,
        previous_status: null,
        location_id: input.locationId,
        notes: input.notes,
        created_by: userId,
        updated_by: userId,
      })
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('goods_receipt_create_failed')
    return mapGoodsReceipt(data)
  }

  async updateHeader(
    organizationId: string,
    userId: string,
    id: string,
    input: Parameters<GoodsReceiptRepository['updateHeader']>[3],
  ): Promise<GoodsReceipt> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const patch: GoodsReceiptUpdate = { updated_by: userId }
    if (input.notes !== undefined) patch.notes = input.notes?.trim() || null
    if (input.locationId !== undefined) patch.location_id = input.locationId

    const { data, error } = await this.options.client
      .from('goods_receipt')
      .update(patch)
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('goods_receipt_update_failed')
    return mapGoodsReceipt(data)
  }

  async setStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: ReceiptStatus,
    archive?: {
      archivedAt: string | null
      archivedBy: string | null
      previousStatus: Exclude<ReceiptStatus, 'archived'> | null
    },
  ): Promise<GoodsReceipt> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('goods_receipt')
      .update({
        status,
        archived_at: archive?.archivedAt ?? null,
        archived_by: archive?.archivedBy ?? null,
        previous_status: archive?.previousStatus ?? null,
        updated_by: userId,
      })
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('goods_receipt_status_failed')
    return mapGoodsReceipt(data)
  }
}
