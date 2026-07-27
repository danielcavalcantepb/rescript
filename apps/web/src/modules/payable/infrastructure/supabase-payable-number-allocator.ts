import '#/modules/payable/infrastructure/assert-server-only'
import type { PayableNumberAllocator } from '#/modules/payable/application/ports'
import type { PayableReposOptions } from '#/modules/payable/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/payable/infrastructure/errors'
import { assertEntityOrganization } from '#/modules/payable/infrastructure/tenant-context'

export class SupabasePayableNumberAllocator implements PayableNumberAllocator {
  constructor(private readonly options: PayableReposOptions) {}

  async allocate(organizationId: string): Promise<string> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client.rpc(
      'allocate_accounts_payable_number',
      { p_organization_id: this.options.organizationId },
    )
    throwIfSupabaseError(error)
    if (!data || typeof data !== 'string') {
      throw new Error('payable_number_allocate_failed')
    }
    return data
  }
}
