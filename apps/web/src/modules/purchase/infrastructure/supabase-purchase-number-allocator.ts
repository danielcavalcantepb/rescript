import '#/modules/purchase/infrastructure/assert-server-only'
import type { PurchaseNumberAllocator } from '#/modules/purchase/application/ports'
import type { PurchaseReposOptions } from '#/modules/purchase/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/purchase/infrastructure/errors'
import { assertEntityOrganization } from '#/modules/purchase/infrastructure/tenant-context'

export class SupabasePurchaseNumberAllocator implements PurchaseNumberAllocator {
  constructor(private readonly options: PurchaseReposOptions) {}

  async allocate(organizationId: string): Promise<string> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client.rpc(
      'allocate_purchase_number',
      { p_organization_id: this.options.organizationId },
    )
    throwIfSupabaseError(error)
    if (!data || typeof data !== 'string') {
      throw new Error('purchase_number_allocate_failed')
    }
    return data
  }
}
