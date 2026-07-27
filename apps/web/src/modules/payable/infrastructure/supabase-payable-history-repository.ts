import '#/modules/payable/infrastructure/assert-server-only'
import type { PayableHistoryRepository } from '#/modules/payable/application/ports'
import type { PayableHistoryEntry } from '#/modules/payable/domain/types'
import type { PayableReposOptions } from '#/modules/payable/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/payable/infrastructure/errors'
import { mapPayableHistory } from '#/modules/payable/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/payable/infrastructure/tenant-context'

export class SupabasePayableHistoryRepository implements PayableHistoryRepository {
  constructor(private readonly options: PayableReposOptions) {}

  async append(
    organizationId: string,
    entry: Parameters<PayableHistoryRepository['append']>[1],
  ): Promise<PayableHistoryEntry> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('accounts_payable_history')
      .insert({
        organization_id: this.options.organizationId,
        accounts_payable_id: entry.accountsPayableId,
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
    if (!data) throw new Error('payable_history_append_failed')
    return mapPayableHistory(data)
  }

  async listByPayable(
    organizationId: string,
    accountsPayableId: string,
    limit = 50,
  ): Promise<PayableHistoryEntry[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('accounts_payable_history')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('accounts_payable_id', accountsPayableId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))
    throwIfSupabaseError(error)
    return (data ?? []).map(mapPayableHistory)
  }
}
