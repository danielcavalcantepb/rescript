import '#/modules/customers/infrastructure/assert-server-only'
import type { CustomerContactRepository } from '#/modules/customers/application/ports'
import type { CustomerContact } from '#/modules/customers/domain/types'
import type { CustomerReposOptions } from '#/modules/customers/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/customers/infrastructure/errors'
import { mapContact } from '#/modules/customers/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/customers/infrastructure/tenant-context'
import type { Database } from '@rescript/database'

type ContactUpdate = Database['public']['Tables']['customer_contact']['Update']

export class SupabaseCustomerContactRepository
  implements CustomerContactRepository
{
  constructor(private readonly options: CustomerReposOptions) {}

  async listByCustomer(
    organizationId: string,
    customerId: string,
  ): Promise<CustomerContact[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer_contact')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('customer_id', customerId)
      .neq('status', 'archived')
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true })
    throwIfSupabaseError(error)
    return (data ?? []).map(mapContact)
  }

  async getById(
    organizationId: string,
    id: string,
  ): Promise<CustomerContact | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer_contact')
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
    input: Parameters<CustomerContactRepository['create']>[2],
  ): Promise<CustomerContact> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer_contact')
      .insert({
        organization_id: this.options.organizationId,
        customer_id: input.customerId,
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
    input: Parameters<CustomerContactRepository['update']>[3],
  ): Promise<CustomerContact> {
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
      .from('customer_contact')
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
  ): Promise<CustomerContact> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer_contact')
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
    customerId: string,
    exceptId?: string,
  ): Promise<void> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    let builder = this.options.client
      .from('customer_contact')
      .update({ is_primary: false, updated_by: this.options.actorUserId })
      .eq('organization_id', this.options.organizationId)
      .eq('customer_id', customerId)
      .eq('is_primary', true)
    if (exceptId) builder = builder.neq('id', exceptId)
    const { error } = await builder
    throwIfSupabaseError(error)
  }
}
