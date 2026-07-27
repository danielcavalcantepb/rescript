import '#/modules/inventory/infrastructure/foundation/assert-server-only'
import type { InventoryLedgerPort } from '#/modules/inventory/application/foundation/ledger-ports'
import type {
  InventoryHistoryPort,
  InventoryItemRepository,
  InventoryVariantLookupPort,
  StockLocationRepository,
} from '#/modules/inventory/application/foundation/ports'
import type { InventoryFoundationReposOptions } from '#/modules/inventory/infrastructure/foundation/client-options'
import { assertInventoryTenantAccess } from '#/modules/inventory/infrastructure/foundation/tenant-context'
import { SupabaseInventoryHistoryRepository } from '#/modules/inventory/infrastructure/foundation/supabase-inventory-history-repository'
import { SupabaseInventoryItemRepository } from '#/modules/inventory/infrastructure/foundation/supabase-inventory-item-repository'
import { SupabaseInventoryLedgerRepository } from '#/modules/inventory/infrastructure/foundation/supabase-inventory-ledger-repository'
import { SupabaseStockLocationRepository } from '#/modules/inventory/infrastructure/foundation/supabase-stock-location-repository'
import { SupabaseVariantLookupRepository } from '#/modules/inventory/infrastructure/foundation/supabase-variant-lookup-repository'

export type SupabaseInventoryFoundationRepos = {
  locations: StockLocationRepository
  items: InventoryItemRepository
  history: InventoryHistoryPort
  variantLookup: InventoryVariantLookupPort
  ledger: InventoryLedgerPort
  organizationId: string
  actorUserId: string
}

export async function createSupabaseInventoryFoundationRepos(
  options: InventoryFoundationReposOptions,
): Promise<SupabaseInventoryFoundationRepos> {
  await assertInventoryTenantAccess(options)
  return {
    locations: new SupabaseStockLocationRepository(options),
    items: new SupabaseInventoryItemRepository(options),
    history: new SupabaseInventoryHistoryRepository(options),
    variantLookup: new SupabaseVariantLookupRepository(options),
    ledger: new SupabaseInventoryLedgerRepository(options),
    organizationId: options.organizationId,
    actorUserId: options.actorUserId,
  }
}
