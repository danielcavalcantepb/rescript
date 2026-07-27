import '#/modules/purchase/infrastructure/assert-server-only'
import type { PurchaseHistoryRepository } from '#/modules/purchase/application/ports'
import type { PurchaseHistoryEntry } from '#/modules/purchase/domain/types'
import type { PurchaseReposOptions } from '#/modules/purchase/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/purchase/infrastructure/errors'
import { mapHistory } from '#/modules/purchase/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/purchase/infrastructure/tenant-context'

export class SupabasePurchaseHistoryRepository
  implements PurchaseHistoryRepository
{
  constructor(private readonly options: PurchaseReposOptions) {}

  async append(
    organizationId: string,
    entry: Parameters<PurchaseHistoryRepository['append']>[1],
  ): Promise<PurchaseHistoryEntry> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('purchase_history')
      .insert({
        organization_id: this.options.organizationId,
        purchase_order_id: entry.purchaseOrderId,
        action: entry.action,
        field_name: entry.fieldName ?? null,
        old_value: entry.oldValue ?? null,
        new_value: entry.newValue ?? null,
        reason: entry.reason ?? null,
        actor_user_id: entry.actorUserId,
        actor_ip: entry.actorIp ?? null,
      })
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('purchase_history_append_failed')
    return mapHistory(data)
  }

  async listByPurchase(
    organizationId: string,
    purchaseOrderId: string,
    limit = 50,
  ): Promise<PurchaseHistoryEntry[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('purchase_history')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))
    throwIfSupabaseError(error)
    return (data ?? []).map(mapHistory)
  }
}
