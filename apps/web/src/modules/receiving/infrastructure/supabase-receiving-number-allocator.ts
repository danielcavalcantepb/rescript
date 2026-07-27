import '#/modules/receiving/infrastructure/assert-server-only'
import type { ReceivingNumberAllocator } from '#/modules/receiving/application/ports'
import type { ReceivingReposOptions } from '#/modules/receiving/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/receiving/infrastructure/errors'
import { assertEntityOrganization } from '#/modules/receiving/infrastructure/tenant-context'

export class SupabaseReceivingNumberAllocator implements ReceivingNumberAllocator {
  constructor(private readonly options: ReceivingReposOptions) {}

  async allocate(organizationId: string): Promise<string> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client.rpc(
      'allocate_goods_receipt_number',
      { p_organization_id: this.options.organizationId },
    )
    throwIfSupabaseError(error)
    if (!data || typeof data !== 'string') {
      throw new Error('goods_receipt_number_allocate_failed')
    }
    return data
  }
}
