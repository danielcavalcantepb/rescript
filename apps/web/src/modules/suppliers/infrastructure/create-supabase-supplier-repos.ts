import '#/modules/suppliers/infrastructure/assert-server-only'
import type { SupplierReposOptions } from '#/modules/suppliers/infrastructure/client-options'
import { SupabaseSupplierAddressRepository } from '#/modules/suppliers/infrastructure/supabase-supplier-address-repository'
import { SupabaseSupplierContactRepository } from '#/modules/suppliers/infrastructure/supabase-supplier-contact-repository'
import { SupabaseSupplierHistoryRepository } from '#/modules/suppliers/infrastructure/supabase-supplier-history-repository'
import { SupabaseSupplierRepository } from '#/modules/suppliers/infrastructure/supabase-supplier-repository'
import { SupabaseSupplierSearchRepository } from '#/modules/suppliers/infrastructure/supabase-supplier-search-repository'

export async function createSupabaseSupplierRepos(
  options: SupplierReposOptions,
) {
  return {
    organizationId: options.organizationId,
    actorUserId: options.actorUserId,
    suppliers: new SupabaseSupplierRepository(options),
    search: new SupabaseSupplierSearchRepository(options),
    contacts: new SupabaseSupplierContactRepository(options),
    addresses: new SupabaseSupplierAddressRepository(options),
    history: new SupabaseSupplierHistoryRepository(options),
  }
}

export type SupabaseSupplierRepos = Awaited<
  ReturnType<typeof createSupabaseSupplierRepos>
>
