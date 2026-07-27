import '#/modules/customers/infrastructure/assert-server-only'
import type { CustomerReposOptions } from '#/modules/customers/infrastructure/client-options'
import { SupabaseCustomerAddressRepository } from '#/modules/customers/infrastructure/supabase-customer-address-repository'
import { SupabaseCustomerContactRepository } from '#/modules/customers/infrastructure/supabase-customer-contact-repository'
import { SupabaseCustomerHistoryRepository } from '#/modules/customers/infrastructure/supabase-customer-history-repository'
import { SupabaseCustomerRepository } from '#/modules/customers/infrastructure/supabase-customer-repository'
import { SupabaseCustomerSearchRepository } from '#/modules/customers/infrastructure/supabase-customer-search-repository'

export async function createSupabaseCustomerRepos(
  options: CustomerReposOptions,
) {
  return {
    organizationId: options.organizationId,
    actorUserId: options.actorUserId,
    customers: new SupabaseCustomerRepository(options),
    search: new SupabaseCustomerSearchRepository(options),
    contacts: new SupabaseCustomerContactRepository(options),
    addresses: new SupabaseCustomerAddressRepository(options),
    history: new SupabaseCustomerHistoryRepository(options),
  }
}

export type SupabaseCustomerRepos = Awaited<
  ReturnType<typeof createSupabaseCustomerRepos>
>
