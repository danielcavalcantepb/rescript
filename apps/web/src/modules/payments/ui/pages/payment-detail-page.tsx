import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell,EntityRow,EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { formatBRL,formatDate,formatDateTime } from '#/lib/format'
import { useArchivePayment,usePayment,useReversePayment } from '#/modules/payments/ui/use-payments'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { FeatureGate,RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'

const labels={draft:'Rascunho',confirmed:'Confirmado',reversed:'Estornado',archived:'Arquivado'} as const
export function PaymentDetailPage({paymentId}:{paymentId:string}){return <RequirePermission permission="payments.read"><Content paymentId={paymentId}/></RequirePermission>}
function Content({paymentId}:{paymentId:string}){
  const query=usePayment(paymentId);const reverse=useReversePayment();const archive=useArchivePayment();const [reason,setReason]=useState('')
  if(query.isLoading)return <PageLoading/>;if(query.isError)return <PageError error={query.error} onRetry={()=>void query.refetch()}/>;if(!query.data)return null
  const p=query.data
  return <div className="space-y-6"><AppBreadcrumb items={[{label:'Financeiro',href:'/finance/accounts-payable'},{label:'Pagamentos',href:'/finance/payments'},{label:formatDate(p.paidAt)}]}/>
    <PageHeader title={`Pagamento · ${p.supplierLegalName}`} description={`${p.financialAccountName} · ${formatDate(p.paidAt)}`} actions={<div className="flex gap-2"><StatusBadge status={labels[p.status]}/>
      {p.status==='confirmed'?<FeatureGate permission="payments.reverse"><Input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Motivo do estorno" className="w-52"/><Button variant="secondary" disabled={!reason.trim()||reverse.isPending} onClick={()=>void reverse.mutateAsync({paymentId,reason,idempotencyKey:crypto.randomUUID()}).then(()=>{notificationService.success('Pagamento estornado.');void query.refetch()})}>Estornar</Button></FeatureGate>:null}
      {(p.status==='draft'||p.status==='reversed')?<FeatureGate permission="payments.archive"><Button variant="secondary" onClick={()=>void archive.mutateAsync(paymentId).then(()=>void query.refetch())}>Arquivar</Button></FeatureGate>:null}</div>}/>
    <section className="grid gap-4 sm:grid-cols-3"><Card label="Valor bruto" value={formatBRL(Number(p.grossAmount))}/><Card label="Valor líquido" value={formatBRL(Number(p.netAmount))}/><Card label="Conta de origem" value={p.financialAccountName}/></section>
    <section><h2 className="mb-3 font-semibold">Composição</h2><EntityTable headers={['Desconto','Juros','Multa','Tarifa']}><EntityRow><EntityCell>{formatBRL(Number(p.discountAmount))}</EntityCell><EntityCell>{formatBRL(Number(p.interestAmount))}</EntityCell><EntityCell>{formatBRL(Number(p.penaltyAmount))}</EntityCell><EntityCell>{formatBRL(Number(p.feeAmount))}</EntityCell></EntityRow></EntityTable></section>
    <section><h2 className="mb-3 font-semibold">Alocações</h2><EntityTable headers={['Conta a pagar','Parcela','Valor']}>
      {p.allocations.map(a=><EntityRow key={a.id}><EntityCell><Link className="hover:underline" to="/finance/accounts-payable/$payableId" params={{payableId:a.accountsPayableId}}>{a.payableNumber}</Link></EntityCell><EntityCell>Parcela {a.installmentSequence}</EntityCell><EntityCell>{formatBRL(Number(a.amount))}</EntityCell></EntityRow>)}</EntityTable></section>
    <section><h2 className="mb-3 font-semibold">Histórico</h2><ul className="space-y-2">{p.history.map(h=><li key={h.id} className="rounded-md border p-3 text-sm"><span className="font-medium">{h.action}</span><span className="ml-2 text-[var(--color-text-secondary)]">{formatDateTime(h.createdAt)}{h.reason?` · ${h.reason}`:''}</span></li>)}</ul></section>
  </div>
}
function Card({label,value}:{label:string;value:string}){return <div className="rounded-md border p-4"><div className="text-xs text-[var(--color-text-secondary)]">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>}
