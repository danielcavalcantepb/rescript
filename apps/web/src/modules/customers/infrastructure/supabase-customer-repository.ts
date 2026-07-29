import '#/modules/customers/infrastructure/assert-server-only'
import type { CustomerRepository } from '#/modules/customers/application/ports'
import type { Customer } from '#/modules/customers/domain/types'
import type { CustomerReposOptions } from '#/modules/customers/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/customers/infrastructure/errors'
import { mapCustomer } from '#/modules/customers/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/customers/infrastructure/tenant-context'
import type { Database } from '@rescript/database'

type CustomerUpdate = Database['public']['Tables']['customer']['Update']

export class SupabaseCustomerRepository implements CustomerRepository {
  constructor(private readonly options: CustomerReposOptions) {}

  async getById(organizationId: string, id: string): Promise<Customer | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapCustomer(data) : null
  }

  async create(
    organizationId: string,
    userId: string,
    input: Parameters<CustomerRepository['create']>[2],
  ): Promise<Customer> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data: branch, error: branchError } = await this.options.client
      .from('branch')
      .select('id')
      .eq('organization_id', this.options.organizationId)
      .eq('is_default', true)
      .eq('status', 'active')
      .maybeSingle()
    throwIfSupabaseError(branchError)
    if (!branch) throw new Error('default_branch_not_found')

    const { data, error } = await this.options.client
      .from('customer')
      .insert({
        organization_id: this.options.organizationId,
        company_id: this.options.organizationId,
        branch_id: branch.id,
        name: input.legalName.trim(),
        short_name: input.shortName?.trim() || input.tradeName?.trim() || input.legalName.trim(),
        trade_name: input.tradeName?.trim() || null,
        person_type: input.personType,
        document: input.document,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        secondary_phone: input.secondaryPhone?.trim() || null,
        commercial_phone: input.commercialPhone?.trim() || null,
        instagram: input.instagram?.trim().replace(/^@/, '') || null,
        acquisition_source_id: input.acquisitionSourceId || null,
        acquisition_source_other: input.acquisitionSourceOther?.trim() || null,
        gender: input.gender?.trim() || null,
        birth_day: input.birthDay ?? null,
        birth_month: input.birthMonth ?? null,
        rg: input.rg?.trim() || null,
        state_registration: input.stateRegistration?.trim() || null,
        municipal_registration: input.municipalRegistration?.trim() || null,
        legal_representative: input.legalRepresentative?.trim() || null,
        city: input.city?.trim() || null,
        notes: input.notes?.trim() || null,
        status: input.status,
        created_by: userId,
        updated_by: userId,
      })
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('customer_create_failed')
    return mapCustomer(data)
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: Parameters<CustomerRepository['update']>[3],
  ): Promise<Customer> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const patch: CustomerUpdate = { updated_by: userId }
    if (input.legalName !== undefined) patch.name = input.legalName.trim()
    if (input.shortName !== undefined) patch.short_name = input.shortName?.trim() || undefined
    if (input.tradeName !== undefined)
      patch.trade_name = input.tradeName?.trim() || null
    if (input.document !== undefined) patch.document = input.document
    if (input.email !== undefined) patch.email = input.email?.trim() || null
    if (input.phone !== undefined) patch.phone = input.phone?.trim() || null
    if (input.secondaryPhone !== undefined) patch.secondary_phone = input.secondaryPhone?.trim() || null
    if (input.commercialPhone !== undefined) patch.commercial_phone = input.commercialPhone?.trim() || null
    if (input.instagram !== undefined) patch.instagram = input.instagram?.trim().replace(/^@/, '') || null
    if (input.acquisitionSourceId !== undefined) patch.acquisition_source_id = input.acquisitionSourceId || null
    if (input.acquisitionSourceOther !== undefined) patch.acquisition_source_other = input.acquisitionSourceOther?.trim() || null
    if (input.gender !== undefined) patch.gender = input.gender?.trim() || null
    if (input.birthDay !== undefined) patch.birth_day = input.birthDay
    if (input.birthMonth !== undefined) patch.birth_month = input.birthMonth
    if (input.rg !== undefined) patch.rg = input.rg?.trim() || null
    if (input.stateRegistration !== undefined) patch.state_registration = input.stateRegistration?.trim() || null
    if (input.municipalRegistration !== undefined) patch.municipal_registration = input.municipalRegistration?.trim() || null
    if (input.legalRepresentative !== undefined) patch.legal_representative = input.legalRepresentative?.trim() || null
    if (input.city !== undefined) patch.city = input.city?.trim() || null
    if (input.notes !== undefined) patch.notes = input.notes?.trim() || null

    const { data, error } = await this.options.client
      .from('customer')
      .update(patch)
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('customer_update_failed')
    return mapCustomer(data)
  }

  async setStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: Customer['status'],
    archive?: { archivedAt: string | null; archivedBy: string | null },
  ): Promise<Customer> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer')
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
    if (!data) throw new Error('customer_status_failed')
    return mapCustomer(data)
  }
}
