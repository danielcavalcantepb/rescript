import '#/modules/payable/infrastructure/assert-server-only'
import type { PayableInstallmentRepository } from '#/modules/payable/application/ports'
import type { PayableInstallment } from '#/modules/payable/domain/types'
import type { PayableReposOptions } from '#/modules/payable/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/payable/infrastructure/errors'
import { mapPayableInstallment, toNumeric } from '#/modules/payable/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/payable/infrastructure/tenant-context'

export class SupabasePayableInstallmentRepository
  implements PayableInstallmentRepository
{
  constructor(private readonly options: PayableReposOptions) {}

  async listByPayable(
    organizationId: string,
    accountsPayableId: string,
  ): Promise<PayableInstallment[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('payable_installment')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('accounts_payable_id', accountsPayableId)
      .order('sequence', { ascending: true })
    throwIfSupabaseError(error)
    return (data ?? []).map(mapPayableInstallment)
  }

  async createMany(
    organizationId: string,
    userId: string,
    accountsPayableId: string,
    installments: Parameters<PayableInstallmentRepository['createMany']>[3],
  ): Promise<PayableInstallment[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const rows = installments.map((inst, index) => ({
      organization_id: this.options.organizationId,
      accounts_payable_id: accountsPayableId,
      sequence: index + 1,
      due_date: inst.dueDate,
      amount: toNumeric(inst.amount),
      open_balance: toNumeric(inst.amount),
      status: 'open' as const,
      notes: inst.notes?.trim() || null,
      created_by: userId,
      updated_by: userId,
    }))

    const { data, error } = await this.options.client
      .from('payable_installment')
      .insert(rows)
      .select('*')
    throwIfSupabaseError(error)
    return (data ?? []).map(mapPayableInstallment)
  }

  async cancelAll(
    organizationId: string,
    userId: string,
    accountsPayableId: string,
  ): Promise<void> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { error } = await this.options.client
      .from('payable_installment')
      .update({
        status: 'cancelled',
        open_balance: 0,
        updated_by: userId,
      })
      .eq('organization_id', this.options.organizationId)
      .eq('accounts_payable_id', accountsPayableId)
    throwIfSupabaseError(error)
  }
}
