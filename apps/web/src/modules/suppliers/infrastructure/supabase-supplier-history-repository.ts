import '#/modules/suppliers/infrastructure/assert-server-only'
import type { SupplierHistoryRepository } from '#/modules/suppliers/application/ports'
import type { SupplierHistoryEntry } from '#/modules/suppliers/domain/types'
import type { SupplierReposOptions } from '#/modules/suppliers/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/suppliers/infrastructure/errors'
import { mapHistory } from '#/modules/suppliers/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/suppliers/infrastructure/tenant-context'

export class SupabaseSupplierHistoryRepository
  implements SupplierHistoryRepository
{
  constructor(private readonly options: SupplierReposOptions) {}

  async append(
    organizationId: string,
    entry: Parameters<SupplierHistoryRepository['append']>[1],
  ): Promise<SupplierHistoryEntry> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('supplier_history')
      .insert({
        organization_id: this.options.organizationId,
        supplier_id: entry.supplierId,
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

  async listBySupplier(
    organizationId: string,
    supplierId: string,
    limit = 50,
  ): Promise<SupplierHistoryEntry[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('supplier_history')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))
    throwIfSupabaseError(error)
    return (data ?? []).map(mapHistory)
  }
}
