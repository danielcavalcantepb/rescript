import { createServerFn } from '@tanstack/react-start'
import type { PermissionKey } from '@rescript/permissions'
import type {
  CreatePaymentInput,
  FinancialAccount,
  FinancialAccountType,
  ListPaymentsQuery,
  PaymentDetail,
  PaymentListItem,
} from '#/modules/payments/domain/types'

export type PaymentRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

type RpcResponse = PromiseLike<{ data: unknown; error: { message: string } | null }>
type RpcClient = { rpc(name: string, args: Record<string, unknown>): RpcResponse }

async function context(organizationId: string, permission: PermissionKey) {
  const { can, isRolePreset, permissionsForRole } = await import('@rescript/permissions')
  const { createServerSupabaseClient } = await import('#/lib/supabase/server.server')
  const client = createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('not_authenticated')
  const { data: membership } = await client.from('membership').select('role,status')
    .eq('organization_id',organizationId).eq('user_id',user.id).eq('status','active').maybeSingle()
  if (!membership || !isRolePreset(membership.role)) throw new Error('not_org_member')
  if (!can(permissionsForRole(membership.role),permission)) throw new Error('permission_denied')
  return client as unknown as RpcClient
}

function rpcError(error: unknown) {
  const raw = error instanceof Error ? error.message : 'payment_error'
  const messages: Record<string,string> = {
    permission_denied:'Você não tem permissão para esta operação.',
    invalid_allocation:'Selecione parcelas abertas válidas.',
    allocation_exceeds_balance:'O valor excede o saldo disponível.',
    allocation_exceeds_balance_or_mixed_supplier:'As parcelas devem ser do mesmo fornecedor e respeitar seus saldos.',
    allocation_total_mismatch:'A soma das alocações deve ser igual ao valor líquido.',
    invalid_net_amount:'O valor líquido deve ser maior que zero.',
    payment_not_draft:'Somente pagamentos em rascunho podem ser confirmados.',
    payment_not_confirmed:'Somente pagamentos confirmados podem ser estornados.',
  }
  const code = Object.keys(messages).find((key) => raw.includes(key)) ?? raw
  return { code, message: messages[code] ?? 'Não foi possível concluir a operação.' }
}

async function run<T>(work: () => Promise<T>): Promise<PaymentRpcResult<T>> {
  try { return { ok:true,data:await work() } }
  catch (error) { return { ok:false,error:rpcError(error) } }
}

async function rpc<T>(client: RpcClient,name:string,args:Record<string,unknown>):Promise<T> {
  const { data,error } = await client.rpc(name,args)
  if (error) throw new Error(error.message)
  return data as T
}

function paymentRow(row: Record<string,unknown>): PaymentListItem {
  return {
    id:String(row.payment_id ?? row.id), supplierId:String(row.supplier_id),
    supplierLegalName:String(row.supplier_legal_name), financialAccountId:String(row.financial_account_id),
    financialAccountName:String(row.financial_account_name), method:row.method as PaymentListItem['method'],
    status:row.status as PaymentListItem['status'], netAmount:String(row.net_amount), paidAt:String(row.paid_at),
    externalReference:row.external_reference == null ? null : String(row.external_reference),
  }
}

export const listPayments = createServerFn({ method:'POST' }).inputValidator((data:{organizationId:string;query:ListPaymentsQuery})=>data)
  .handler(({data})=>run(async()=>{
    const client=await context(data.organizationId,'payments.read')
    const rows=await rpc<Record<string,unknown>[]>(client,'list_payments',{
      p_organization_id:data.organizationId,p_query:data.query.q??null,p_supplier_id:data.query.supplierId??null,
      p_financial_account_id:data.query.financialAccountId??null,p_method:data.query.method??null,
      p_status:data.query.status??null,p_from:data.query.from??null,p_to:data.query.to??null,p_limit:data.query.limit??50,
    })
    return rows.map(paymentRow)
  }))

export const searchPayments = listPayments

export const getPayment = createServerFn({ method:'POST' }).inputValidator((data:{organizationId:string;paymentId:string})=>data)
  .handler(({data})=>run(async()=>{
    const client=await context(data.organizationId,'payments.read')
    const raw=await rpc<{payment:Record<string,unknown>;allocations:Record<string,unknown>[];history:Record<string,unknown>[]} | null>(client,'get_payment',{p_organization_id:data.organizationId,p_payment_id:data.paymentId})
    if (!raw) throw new Error('payment_not_found')
    const base=paymentRow(raw.payment)
    return { ...base,grossAmount:String(raw.payment.gross_amount),discountAmount:String(raw.payment.discount_amount),
      interestAmount:String(raw.payment.interest_amount),penaltyAmount:String(raw.payment.penalty_amount),feeAmount:String(raw.payment.fee_amount),
      confirmedAt:raw.payment.confirmed_at==null?null:String(raw.payment.confirmed_at),reversedAt:raw.payment.reversed_at==null?null:String(raw.payment.reversed_at),
      notes:raw.payment.notes==null?null:String(raw.payment.notes),reversesPaymentId:raw.payment.reverses_payment_id==null?null:String(raw.payment.reverses_payment_id),
      allocations:raw.allocations.map(a=>({id:String(a.id),installmentId:String(a.payable_installment_id),accountsPayableId:String(a.accounts_payable_id),installmentSequence:Number(a.installment_sequence),payableNumber:String(a.payable_number),amount:String(a.amount)})),
      history:raw.history.map(h=>({id:String(h.id),action:String(h.action),reason:h.reason==null?null:String(h.reason),createdAt:String(h.created_at)})),
    } satisfies PaymentDetail
  }))

export const createPayment = createServerFn({ method:'POST' }).inputValidator((data:{organizationId:string;input:CreatePaymentInput})=>data)
  .handler(({data})=>run(async()=>{
    const { calculateNetAmount,assertAllocationTotal }=await import('#/modules/payments/domain/amounts')
    const net=calculateNetAmount(data.input); assertAllocationTotal(data.input.allocations,net)
    const client=await context(data.organizationId,'payments.create')
    return rpc<string>(client,'create_payment',{p_organization_id:data.organizationId,p_financial_account_id:data.input.financialAccountId,
      p_method:data.input.method,p_paid_at:data.input.paidAt,p_gross_amount:data.input.grossAmount,p_discount_amount:data.input.discountAmount,
      p_interest_amount:data.input.interestAmount,p_penalty_amount:data.input.penaltyAmount,p_fee_amount:data.input.feeAmount,
      p_allocations:data.input.allocations,p_external_reference:data.input.externalReference??null,p_notes:data.input.notes??null})
  }))

export const confirmPayment = createServerFn({ method:'POST' }).inputValidator((data:{organizationId:string;paymentId:string;idempotencyKey:string})=>data)
  .handler(({data})=>run(async()=>rpc<string>(await context(data.organizationId,'payments.confirm'),'confirm_payment',{p_organization_id:data.organizationId,p_payment_id:data.paymentId,p_idempotency_key:data.idempotencyKey})))

export const reversePayment = createServerFn({ method:'POST' }).inputValidator((data:{organizationId:string;paymentId:string;reason:string;idempotencyKey:string})=>data)
  .handler(({data})=>run(async()=>rpc<string>(await context(data.organizationId,'payments.reverse'),'reverse_payment',{p_organization_id:data.organizationId,p_payment_id:data.paymentId,p_reason:data.reason,p_idempotency_key:data.idempotencyKey})))

export const archivePayment = createServerFn({ method:'POST' }).inputValidator((data:{organizationId:string;paymentId:string})=>data)
  .handler(({data})=>run(async()=>rpc<string>(await context(data.organizationId,'payments.archive'),'archive_payment',{p_organization_id:data.organizationId,p_payment_id:data.paymentId})))

export const listFinancialAccounts = createServerFn({ method:'POST' }).inputValidator((data:{organizationId:string})=>data)
  .handler(({data})=>run(async()=>{
    const rows=await rpc<Record<string,unknown>[]>(await context(data.organizationId,'financial_accounts.read'),'list_financial_accounts',{p_organization_id:data.organizationId})
    return rows.map(row=>({id:String(row.id),organizationId:String(row.organization_id),name:String(row.name),type:row.type as FinancialAccountType,active:Boolean(row.active)} satisfies FinancialAccount))
  }))

export const createFinancialAccount = createServerFn({ method:'POST' }).inputValidator((data:{organizationId:string;name:string;type:FinancialAccountType})=>data)
  .handler(({data})=>run(async()=>rpc<string>(await context(data.organizationId,'financial_accounts.manage'),'create_financial_account',{p_organization_id:data.organizationId,p_name:data.name,p_type:data.type})))
