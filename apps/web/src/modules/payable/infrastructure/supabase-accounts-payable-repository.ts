import '#/modules/payable/infrastructure/assert-server-only'
import type { AccountsPayableRepository } from '#/modules/payable/application/ports'
import type { AccountsPayable, PayableStatus, PayableTotals } from '#/modules/payable/domain/types'
import type { PayableReposOptions } from '#/modules/payable/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/payable/infrastructure/errors'
import { mapAccountsPayable, toNumeric } from '#/modules/payable/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/payable/infrastructure/tenant-context'
import type { Database } from '@rescript/database'

type AccountsPayableUpdate = Database['public']['Tables']['accounts_payable']['Update']

function totalsToDb(totals: PayableTotals) {
  return {
    currency: totals.currency,
    original_amount: toNumeric(totals.originalAmount),
    open_balance: toNumeric(totals.openBalance),
  }
}

export class SupabaseAccountsPayableRepository implements AccountsPayableRepository {
  constructor(private readonly options: PayableReposOptions) {}

  async getById(organizationId: string, id: string): Promise<AccountsPayable | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('accounts_payable')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapAccountsPayable(data) : null
  }

  async create(
    organizationId: string,
    userId: string,
    input: Parameters<AccountsPayableRepository['create']>[2],
  ): Promise<AccountsPayable> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('accounts_payable')
      .insert({
        organization_id: this.options.organizationId,
        number: input.number,
        supplier_id: input.supplier.supplierId,
        supplier_legal_name: input.supplier.legalName,
        supplier_document: input.supplier.document,
        supplier_email: input.supplier.email,
        supplier_phone: input.supplier.phone,
        purchase_order_id: input.purchase.purchaseOrderId,
        purchase_number: input.purchase.purchaseNumber,
        goods_receipt_id: input.receiving.goodsReceiptId,
        goods_receipt_number: input.receiving.goodsReceiptNumber,
        goods_receipt_received_at: input.receiving.receivedAt,
        status: input.status,
        previous_status: null,
        issue_date: input.issueDate,
        notes: input.notes,
        created_by: userId,
        updated_by: userId,
        ...totalsToDb(input.totals),
      })
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('payable_create_failed')
    return mapAccountsPayable(data)
  }

  async updateHeader(
    organizationId: string,
    userId: string,
    id: string,
    input: Parameters<AccountsPayableRepository['updateHeader']>[3],
  ): Promise<AccountsPayable> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const patch: AccountsPayableUpdate = { updated_by: userId }
    if (input.notes !== undefined) patch.notes = input.notes?.trim() || null
    if (input.issueDate !== undefined) patch.issue_date = input.issueDate

    const { data, error } = await this.options.client
      .from('accounts_payable')
      .update(patch)
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('payable_update_failed')
    return mapAccountsPayable(data)
  }

  async setStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: PayableStatus,
    archive?: {
      archivedAt: string | null
      archivedBy: string | null
      previousStatus: Exclude<PayableStatus, 'archived'> | null
    },
  ): Promise<AccountsPayable> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('accounts_payable')
      .update({
        status,
        archived_at: archive?.archivedAt ?? null,
        archived_by: archive?.archivedBy ?? null,
        previous_status: archive?.previousStatus ?? null,
        updated_by: userId,
      })
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('payable_status_failed')
    return mapAccountsPayable(data)
  }

  async updateTotals(
    organizationId: string,
    userId: string,
    id: string,
    totals: PayableTotals,
  ): Promise<AccountsPayable> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('accounts_payable')
      .update({
        ...totalsToDb(totals),
        updated_by: userId,
      })
      .eq('organization_id', this.options.organizationId)
      .eq('id', id)
      .select('*')
      .single()
    throwIfSupabaseError(error)
    if (!data) throw new Error('payable_totals_failed')
    return mapAccountsPayable(data)
  }
}
