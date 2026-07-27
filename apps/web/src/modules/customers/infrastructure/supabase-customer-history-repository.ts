import '#/modules/customers/infrastructure/assert-server-only'
import type { CustomerHistoryRepository } from '#/modules/customers/application/ports'
import type { CustomerHistoryEntry } from '#/modules/customers/domain/types'
import type { CustomerReposOptions } from '#/modules/customers/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/customers/infrastructure/errors'
import { mapHistory } from '#/modules/customers/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/customers/infrastructure/tenant-context'

export class SupabaseCustomerHistoryRepository
  implements CustomerHistoryRepository
{
  constructor(private readonly options: CustomerReposOptions) {}

  async append(
    organizationId: string,
    entry: Parameters<CustomerHistoryRepository['append']>[1],
  ): Promise<CustomerHistoryEntry> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer_history')
      .insert({
        organization_id: this.options.organizationId,
        customer_id: entry.customerId,
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
    if (!data) throw new Error('history_append_failed')
    return mapHistory(data)
  }

  async listByCustomer(
    organizationId: string,
    customerId: string,
    limit = 50,
  ): Promise<CustomerHistoryEntry[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('customer_history')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))
    throwIfSupabaseError(error)
    return (data ?? []).map(mapHistory)
  }
}
