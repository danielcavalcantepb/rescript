import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import type { CreatePaymentInput, FinancialAccountType, ListPaymentsQuery } from '#/modules/payments/domain/types'
import { archivePayment, confirmPayment, createFinancialAccount, createPayment, getPayment, listFinancialAccounts, listPayments, reversePayment, type PaymentRpcResult } from './payments-api'

function unwrap<T>(result: PaymentRpcResult<T>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}
function useOrgId(){ return useOrganization().currentOrganization?.id }

export function usePayments(query:ListPaymentsQuery){
  const organizationId=useOrgId()
  return useQuery({queryKey:queryKeys.payments.list(organizationId??'none',query),enabled:Boolean(organizationId),queryFn:async()=>{
    if(!organizationId) throw new Error('missing_org')
    return unwrap(await listPayments({data:{organizationId,query}}))
  }})
}
export function usePayment(paymentId:string){
  const organizationId=useOrgId()
  return useQuery({queryKey:queryKeys.payments.detail(organizationId??'none',paymentId),enabled:Boolean(organizationId&&paymentId),queryFn:async()=>{
    if(!organizationId) throw new Error('missing_org')
    return unwrap(await getPayment({data:{organizationId,paymentId}}))
  }})
}
export function useFinancialAccounts(){
  const organizationId=useOrgId()
  return useQuery({queryKey:queryKeys.payments.accounts(organizationId??'none'),enabled:Boolean(organizationId),queryFn:async()=>{
    if(!organizationId) throw new Error('missing_org')
    return unwrap(await listFinancialAccounts({data:{organizationId}}))
  }})
}
function useAction<T>(action:(organizationId:string,input:T)=>Promise<string>){
  const organizationId=useOrgId(); const qc=useQueryClient()
  return useMutation({mutationFn:async(input:T)=>{if(!organizationId)throw new Error('missing_org');return action(organizationId,input)},onSuccess:()=>{
    if(!organizationId)return;void qc.invalidateQueries({queryKey:queryKeys.payments.all(organizationId)});void qc.invalidateQueries({queryKey:queryKeys.payables.all(organizationId)})
  }})
}
export function useCreatePayment(){return useAction<CreatePaymentInput>(async(organizationId,input)=>unwrap(await createPayment({data:{organizationId,input}})))}
export function useConfirmPayment(){return useAction<{paymentId:string;idempotencyKey:string}>(async(organizationId,input)=>unwrap(await confirmPayment({data:{organizationId,...input}})))}
export function useReversePayment(){return useAction<{paymentId:string;reason:string;idempotencyKey:string}>(async(organizationId,input)=>unwrap(await reversePayment({data:{organizationId,...input}})))}
export function useArchivePayment(){return useAction<string>(async(organizationId,paymentId)=>unwrap(await archivePayment({data:{organizationId,paymentId}})))}
export function useCreateFinancialAccount(){return useAction<{name:string;type:FinancialAccountType}>(async(organizationId,input)=>unwrap(await createFinancialAccount({data:{organizationId,...input}})))}
