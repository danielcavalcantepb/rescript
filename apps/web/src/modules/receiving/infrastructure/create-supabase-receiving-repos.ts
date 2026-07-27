import '#/modules/receiving/infrastructure/assert-server-only'
import type { ReceivingReposOptions } from '#/modules/receiving/infrastructure/client-options'
import { SupabaseGoodsReceiptHistoryRepository } from '#/modules/receiving/infrastructure/supabase-goods-receipt-history-repository'
import { SupabaseGoodsReceiptItemRepository } from '#/modules/receiving/infrastructure/supabase-goods-receipt-item-repository'
import { SupabaseGoodsReceiptPostPort } from '#/modules/receiving/infrastructure/supabase-goods-receipt-post-port'
import { SupabaseGoodsReceiptRepository } from '#/modules/receiving/infrastructure/supabase-goods-receipt-repository'
import { SupabaseGoodsReceiptSearchRepository } from '#/modules/receiving/infrastructure/supabase-goods-receipt-search-repository'
import { SupabasePurchaseReceivingPort } from '#/modules/receiving/infrastructure/supabase-purchase-receiving-port'
import { SupabaseReceivingNumberAllocator } from '#/modules/receiving/infrastructure/supabase-receiving-number-allocator'

export async function createSupabaseReceivingRepos(
  options: ReceivingReposOptions,
) {
  return {
    organizationId: options.organizationId,
    actorUserId: options.actorUserId,
    numbers: new SupabaseReceivingNumberAllocator(options),
    purchases: new SupabasePurchaseReceivingPort(options),
    receipts: new SupabaseGoodsReceiptRepository(options),
    items: new SupabaseGoodsReceiptItemRepository(options),
    search: new SupabaseGoodsReceiptSearchRepository(options),
    history: new SupabaseGoodsReceiptHistoryRepository(options),
    poster: new SupabaseGoodsReceiptPostPort(options),
  }
}

export type SupabaseReceivingRepos = Awaited<
  ReturnType<typeof createSupabaseReceivingRepos>
>
