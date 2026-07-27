import '#/modules/suppliers/infrastructure/assert-server-only'
import type { SupplierContactRepository } from '#/modules/suppliers/application/ports'
import type { SupplierContact } from '#/modules/suppliers/domain/types'
import type { SupplierReposOptions } from '#/modules/suppliers/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/suppliers/infrastructure/errors'
import { mapContact } from '#/modules/suppliers/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/suppliers/infrastructure/tenant-context'
import type { Database } from '@rescript/database'

type ContactUpdate = Database['public']['Tables']['supplier_contact']['Update']

export class SupabaseSupplierContactRepository
  implements SupplierContactRepository
{
  constructor(private readonly options: SupplierReposOptions) {}

  async listBySupplier(
    organizationId: string,
    supplierId: string,
  ): Promise<SupplierContact[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('supplier_contact')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('supplier_id', supplierId)
      .neq('status', 'archived')
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true })
    throwIfSupabaseError(error)
    return (data ?? []).map(mapContact)
  }

  async getById(
    organizationId: string,
    id: string,
  ): Promise<SupplierContact | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('supplier_contact')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapContact(data) : null
  }

  async create(
    organizationId: string,
    userId: string,
    input: Parameters<SupplierContactRepository['create']>[2],
  ): Promise<SupplierContact> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('supplier_contact')
      .insert({
        organization_id: this.options.organizationId,
        supplier_id: input.supplierId,
        name: input.name.trim(),
        role_title: input.roleTitle?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        is_primary: Boolean(input.isPrimary),
        status: 'active',
        created_by: userId,
        updated_by: userId,
      })
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('contact_create_failed')
    return mapContact(data)
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: Parameters<SupplierContactRepository['update']>[3],
  ): Promise<SupplierContact> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const patch: ContactUpdate = { updated_by: userId }
    if (input.name !== undefined) patch.name = input.name.trim()
    if (input.roleTitle !== undefined)
      patch.role_title = input.roleTitle?.trim() || null
    if (input.email !== undefined) patch.email = input.email?.trim() || null
    if (input.phone !== undefined) patch.phone = input.phone?.trim() || null
    if (input.isPrimary !== undefined) patch.is_primary = input.isPrimary
    if (input.status !== undefined) patch.status = input.status

    const { data, error } = await this.options.client
      .from('supplier_contact')
      .update(patch)
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('contact_update_failed')
    return mapContact(data)
  }

  async softRemove(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<SupplierContact> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('supplier_contact')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        is_primary: false,
        updated_by: userId,
      })
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('contact_remove_failed')
    return mapContact(data)
  }

  async clearPrimary(
    organizationId: string,
    supplierId: string,
    exceptId?: string,
  ): Promise<void> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    let builder = this.options.client
      .from('supplier_contact')
      .update({ is_primary: false, updated_by: this.options.actorUserId })
      .eq('organization_id', this.options.organizationId)
      .eq('supplier_id', supplierId)
      .eq('is_primary', true)
    if (exceptId) builder = builder.neq('id', exceptId)
    const { error } = await builder
    throwIfSupabaseError(error)
  }
}
