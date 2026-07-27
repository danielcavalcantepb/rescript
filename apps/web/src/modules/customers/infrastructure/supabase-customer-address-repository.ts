import '#/modules/customers/infrastructure/assert-server-only'
import type { CustomerAddressRepository } from '#/modules/customers/application/ports'
import type { CustomerAddress } from '#/modules/customers/domain/types'
import type { CustomerReposOptions } from '#/modules/customers/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/customers/infrastructure/errors'
import { mapAddress } from '#/modules/customers/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/customers/infrastructure/tenant-context'
import type { Database } from '@rescript/database'

type AddressUpdate = Database['public']['Tables']['customer_address']['Update']

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '') || value.trim()
}

export class SupabaseCustomerAddressRepository
  implements CustomerAddressRepository
{
  constructor(private readonly options: CustomerReposOptions) {}

  async listByCustomer(
    organizationId: string,
    customerId: string,
  ): Promise<CustomerAddress[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer_address')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('customer_id', customerId)
      .neq('status', 'archived')
      .order('kind', { ascending: true })
      .order('is_primary', { ascending: false })
    throwIfSupabaseError(error)
    return (data ?? []).map(mapAddress)
  }

  async getById(
    organizationId: string,
    id: string,
  ): Promise<CustomerAddress | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer_address')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapAddress(data) : null
  }

  async create(
    organizationId: string,
    userId: string,
    input: Parameters<CustomerAddressRepository['create']>[2],
  ): Promise<CustomerAddress> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer_address')
      .insert({
        organization_id: this.options.organizationId,
        customer_id: input.customerId,
        kind: input.kind,
        postal_code: digitsOnly(input.postalCode),
        street: input.street.trim(),
        number: input.number?.trim() || null,
        complement: input.complement?.trim() || null,
        district: input.district?.trim() || null,
        city: input.city.trim(),
        state: input.state.trim().toUpperCase(),
        country: (input.country ?? 'BR').trim().toUpperCase(),
        is_primary: Boolean(input.isPrimary),
        status: 'active',
        created_by: userId,
        updated_by: userId,
      })
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('address_create_failed')
    return mapAddress(data)
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: Parameters<CustomerAddressRepository['update']>[3],
  ): Promise<CustomerAddress> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const patch: AddressUpdate = { updated_by: userId }
    if (input.kind !== undefined) patch.kind = input.kind
    if (input.postalCode !== undefined)
      patch.postal_code = digitsOnly(input.postalCode)
    if (input.street !== undefined) patch.street = input.street.trim()
    if (input.number !== undefined) patch.number = input.number?.trim() || null
    if (input.complement !== undefined)
      patch.complement = input.complement?.trim() || null
    if (input.district !== undefined)
      patch.district = input.district?.trim() || null
    if (input.city !== undefined) patch.city = input.city.trim()
    if (input.state !== undefined) patch.state = input.state.trim().toUpperCase()
    if (input.country !== undefined)
      patch.country = input.country.trim().toUpperCase()
    if (input.isPrimary !== undefined) patch.is_primary = input.isPrimary
    if (input.status !== undefined) patch.status = input.status

    const { data, error } = await this.options.client
      .from('customer_address')
      .update(patch)
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('address_update_failed')
    return mapAddress(data)
  }

  async softRemove(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<CustomerAddress> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer_address')
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
    if (!data) throw new Error('address_remove_failed')
    return mapAddress(data)
  }

  async clearPrimaryForKind(
    organizationId: string,
    customerId: string,
    kind: CustomerAddress['kind'],
    exceptId?: string,
  ): Promise<void> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    let builder = this.options.client
      .from('customer_address')
      .update({ is_primary: false, updated_by: this.options.actorUserId })
      .eq('organization_id', this.options.organizationId)
      .eq('customer_id', customerId)
      .eq('kind', kind)
      .eq('is_primary', true)
    if (exceptId) builder = builder.neq('id', exceptId)
    const { error } = await builder
    throwIfSupabaseError(error)
  }
}
