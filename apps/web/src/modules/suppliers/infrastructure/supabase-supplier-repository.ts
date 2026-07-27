import '#/modules/suppliers/infrastructure/assert-server-only'
import type { SupplierRepository } from '#/modules/suppliers/application/ports'
import type { Supplier } from '#/modules/suppliers/domain/types'
import type { SupplierReposOptions } from '#/modules/suppliers/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/suppliers/infrastructure/errors'
import { mapSupplier } from '#/modules/suppliers/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/suppliers/infrastructure/tenant-context'
import type { Database } from '@rescript/database'

type SupplierUpdate = Database['public']['Tables']['supplier']['Update']

export class SupabaseSupplierRepository implements SupplierRepository {
  constructor(private readonly options: SupplierReposOptions) {}

  async getById(organizationId: string, id: string): Promise<Supplier | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('supplier')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapSupplier(data) : null
  }

  async create(
    organizationId: string,
    userId: string,
    input: Parameters<SupplierRepository['create']>[2],
  ): Promise<Supplier> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('supplier')
      .insert({
        organization_id: this.options.organizationId,
        name: input.legalName.trim(),
        trade_name: input.tradeName?.trim() || null,
        person_type: input.personType,
        document: input.document,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        city: input.city?.trim() || null,
        notes: input.notes?.trim() || null,
        status: input.status,
        created_by: userId,
        updated_by: userId,
      })
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('supplier_create_failed')
    return mapSupplier(data)
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: Parameters<SupplierRepository['update']>[3],
  ): Promise<Supplier> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const patch: SupplierUpdate = { updated_by: userId }
    if (input.legalName !== undefined) patch.name = input.legalName.trim()
    if (input.tradeName !== undefined)
      patch.trade_name = input.tradeName?.trim() || null
    if (input.document !== undefined) patch.document = input.document
    if (input.email !== undefined) patch.email = input.email?.trim() || null
    if (input.phone !== undefined) patch.phone = input.phone?.trim() || null
    if (input.city !== undefined) patch.city = input.city?.trim() || null
    if (input.notes !== undefined) patch.notes = input.notes?.trim() || null

    const { data, error } = await this.options.client
      .from('supplier')
      .update(patch)
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('supplier_update_failed')
    return mapSupplier(data)
  }

  async setStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: Supplier['status'],
    archive?: { archivedAt: string | null; archivedBy: string | null },
  ): Promise<Supplier> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('supplier')
      .update({
        status,
        archived_at: archive?.archivedAt ?? null,
        archived_by: archive?.archivedBy ?? null,
        updated_by: userId,
      })
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('supplier_status_failed')
    return mapSupplier(data)
  }
}
