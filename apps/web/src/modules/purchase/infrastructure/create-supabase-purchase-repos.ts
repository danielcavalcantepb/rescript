import '#/modules/purchase/infrastructure/assert-server-only'
import type { PurchaseReposOptions } from '#/modules/purchase/infrastructure/client-options'
import { SupabasePurchaseHistoryRepository } from '#/modules/purchase/infrastructure/supabase-purchase-history-repository'
import { SupabasePurchaseItemRepository } from '#/modules/purchase/infrastructure/supabase-purchase-item-repository'
import { SupabasePurchaseNumberAllocator } from '#/modules/purchase/infrastructure/supabase-purchase-number-allocator'
import { SupabasePurchaseRepository } from '#/modules/purchase/infrastructure/supabase-purchase-repository'
import { SupabasePurchaseSearchRepository } from '#/modules/purchase/infrastructure/supabase-purchase-search-repository'
import { SupabasePurchaseSnapshotSources } from '#/modules/purchase/infrastructure/supabase-purchase-snapshot-sources'

export async function createSupabasePurchaseRepos(
  options: PurchaseReposOptions,
) {
  return {
    organizationId: options.organizationId,
    actorUserId: options.actorUserId,
    numbers: new SupabasePurchaseNumberAllocator(options),
    snapshots: new SupabasePurchaseSnapshotSources(options),
    purchases: new SupabasePurchaseRepository(options),
    items: new SupabasePurchaseItemRepository(options),
    search: new SupabasePurchaseSearchRepository(options),
    history: new SupabasePurchaseHistoryRepository(options),
  }
}

export type SupabasePurchaseRepos = Awaited<
  ReturnType<typeof createSupabasePurchaseRepos>
>
