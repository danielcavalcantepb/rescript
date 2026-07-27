import '#/modules/receiving/infrastructure/assert-server-only'
import type { GoodsReceiptHistoryRepository } from '#/modules/receiving/application/ports'
import type { ReceiptHistoryEntry } from '#/modules/receiving/domain/types'
import type { ReceivingReposOptions } from '#/modules/receiving/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/receiving/infrastructure/errors'
import { mapReceiptHistory } from '#/modules/receiving/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/receiving/infrastructure/tenant-context'

export class SupabaseGoodsReceiptHistoryRepository
  implements GoodsReceiptHistoryRepository
{
  constructor(private readonly options: ReceivingReposOptions) {}

  async append(
    organizationId: string,
    entry: Parameters<GoodsReceiptHistoryRepository['append']>[1],
  ): Promise<ReceiptHistoryEntry> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('goods_receipt_history')
      .insert({
        organization_id: this.options.organizationId,
        goods_receipt_id: entry.goodsReceiptId,
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
    if (!data) throw new Error('goods_receipt_history_append_failed')
    return mapReceiptHistory(data)
  }

  async listByReceipt(
    organizationId: string,
    goodsReceiptId: string,
    limit = 50,
  ): Promise<ReceiptHistoryEntry[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('goods_receipt_history')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('goods_receipt_id', goodsReceiptId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))
    throwIfSupabaseError(error)
    return (data ?? []).map(mapReceiptHistory)
  }
}
