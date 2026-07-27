import '#/modules/payable/infrastructure/assert-server-only'
import type { PayableReposOptions } from '#/modules/payable/infrastructure/client-options'
import { SupabaseAccountsPayableRepository } from '#/modules/payable/infrastructure/supabase-accounts-payable-repository'
import { SupabasePayableHistoryRepository } from '#/modules/payable/infrastructure/supabase-payable-history-repository'
import { SupabasePayableInstallmentRepository } from '#/modules/payable/infrastructure/supabase-payable-installment-repository'
import { SupabasePayableNumberAllocator } from '#/modules/payable/infrastructure/supabase-payable-number-allocator'
import { SupabasePayableOriginSource } from '#/modules/payable/infrastructure/supabase-payable-origin-source'
import { SupabasePayableSearchRepository } from '#/modules/payable/infrastructure/supabase-payable-search-repository'

export async function createSupabasePayableRepos(options: PayableReposOptions) {
  return {
    organizationId: options.organizationId,
    actorUserId: options.actorUserId,
    numbers: new SupabasePayableNumberAllocator(options),
    origins: new SupabasePayableOriginSource(options),
    payables: new SupabaseAccountsPayableRepository(options),
    installments: new SupabasePayableInstallmentRepository(options),
    search: new SupabasePayableSearchRepository(options),
    history: new SupabasePayableHistoryRepository(options),
  }
}

export type SupabasePayableRepos = Awaited<
  ReturnType<typeof createSupabasePayableRepos>
>
