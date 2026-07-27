import '#/modules/purchase/infrastructure/assert-server-only'
import type { PurchaseRepository } from '#/modules/purchase/application/ports'
import type { PurchaseOrder, PurchaseTotals } from '#/modules/purchase/domain/types'
import type { PurchaseReposOptions } from '#/modules/purchase/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/purchase/infrastructure/errors'
import { mapPurchaseOrder } from '#/modules/purchase/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/purchase/infrastructure/tenant-context'
import type { Database } from '@rescript/database'

type PurchaseOrderUpdate = Database['public']['Tables']['purchase_order']['Update']

function toNumeric(value: string): number {
  return Number(value)
}

function totalsToDb(totals: PurchaseTotals) {
  return {
    subtotal: toNumeric(totals.subtotal),
    discount_total: toNumeric(totals.discountTotal),
    grand_total: toNumeric(totals.grandTotal),
    currency: totals.currency,
  }
}

export class SupabasePurchaseRepository implements PurchaseRepository {
  constructor(private readonly options: PurchaseReposOptions) {}

  async getById(organizationId: string, id: string): Promise<PurchaseOrder | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('purchase_order')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapPurchaseOrder(data) : null
  }

  async create(
    organizationId: string,
    userId: string,
    input: Parameters<PurchaseRepository['create']>[2],
  ): Promise<PurchaseOrder> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('purchase_order')
      .insert({
        organization_id: this.options.organizationId,
        number: input.number,
        supplier_id: input.supplierId,
        supplier_legal_name: input.supplierSnapshot.legalName,
        supplier_document: input.supplierSnapshot.document,
        supplier_email: input.supplierSnapshot.email,
        supplier_phone: input.supplierSnapshot.phone,
        status: input.status,
        previous_status: null,
        notes: input.notes,
        created_by: userId,
        updated_by: userId,
        ...totalsToDb(input.totals),
      })
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('purchase_create_failed')
    return mapPurchaseOrder(data)
  }

  async updateHeader(
    organizationId: string,
    userId: string,
    id: string,
    input: Parameters<PurchaseRepository['updateHeader']>[3],
  ): Promise<PurchaseOrder> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const patch: PurchaseOrderUpdate = { updated_by: userId }
    if (input.notes !== undefined) patch.notes = input.notes?.trim() || null
    if (input.currency !== undefined) patch.currency = input.currency
    if (input.totals !== undefined) Object.assign(patch, totalsToDb(input.totals))

    const { data, error } = await this.options.client
      .from('purchase_order')
      .update(patch)
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('purchase_update_failed')
    return mapPurchaseOrder(data)
  }

  async setStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: PurchaseOrder['status'],
    archive?: {
      archivedAt: string | null
      archivedBy: string | null
      previousStatus: Exclude<PurchaseOrder['status'], 'archived'> | null
    },
  ): Promise<PurchaseOrder> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('purchase_order')
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
    if (!data) throw new Error('purchase_status_failed')
    return mapPurchaseOrder(data)
  }

  async updateTotals(
    organizationId: string,
    userId: string,
    id: string,
    totals: PurchaseTotals,
  ): Promise<PurchaseOrder> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('purchase_order')
      .update({
        ...totalsToDb(totals),
        updated_by: userId,
      })
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('purchase_totals_failed')
    return mapPurchaseOrder(data)
  }
}
