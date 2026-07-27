import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell,EntityRow,EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Select } from '#/components/ui/select'
import { formatBRL,formatDate } from '#/lib/format'
import type { PaymentMethod,PaymentStatus } from '#/modules/payments'
import { useFinancialAccounts,usePayments } from '#/modules/payments/ui/use-payments'
import { PageLoading } from '#/platform/loading'
import { RequirePermission } from '#/platform/permissions'

const statusLabel:Record<PaymentStatus,string>={draft:'Rascunho',confirmed:'Confirmado',reversed:'Estornado',archived:'Arquivado'}
const methodLabel:Record<PaymentMethod,string>={cash:'Dinheiro',bank_transfer:'Transferência bancária',pix_manual:'PIX manual',boleto_manual:'Boleto manual',card_manual:'Cartão manual',other:'Outro'}

export function PaymentsListPage(){return <RequirePermission permission="payments.read"><PaymentsListContent/></RequirePermission>}
function PaymentsListContent(){
  const [q,setQ]=useState('');const [status,setStatus]=useState('');const [method,setMethod]=useState('');const [account,setAccount]=useState('');const [from,setFrom]=useState('');const [to,setTo]=useState('')
  const query=usePayments({q:q||undefined,status:(status||undefined) as PaymentStatus|undefined,method:(method||undefined) as PaymentMethod|undefined,financialAccountId:account||undefined,from:from||undefined,to:to||undefined})
  const accounts=useFinancialAccounts()
  return <div className="space-y-5"><AppBreadcrumb items={[{label:'Financeiro',href:'/finance/accounts-payable'},{label:'Pagamentos'}]}/>
    <PageHeader title="Pagamentos" description="Baixas confirmadas, parciais e estornos de contas a pagar." actions={<Button asChild><Link to="/finance/payments/new" search={{ payableId: undefined }}>Registrar pagamento</Link></Button>}/>
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6"><SearchBar value={q} onChange={setQ} placeholder="Fornecedor ou referência…"/>
      <Select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos os status</option>{Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</Select>
      <Select value={method} onChange={e=>setMethod(e.target.value)}><option value="">Todos os métodos</option>{Object.entries(methodLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</Select>
      <Select value={account} onChange={e=>setAccount(e.target.value)}><option value="">Todas as contas</option>{accounts.data?.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</Select>
      <Input type="date" value={from} onChange={e=>setFrom(e.target.value)} aria-label="Pagamento de"/><Input type="date" value={to} onChange={e=>setTo(e.target.value)} aria-label="Pagamento até"/>
    </div>
    {query.isLoading?<PageLoading/>:query.isError?<EmptyState title="Não foi possível carregar os pagamentos" description={query.error.message}/>:!query.data?.length?<EmptyState title="Nenhum pagamento encontrado" description="Registre uma baixa para iniciar o histórico financeiro." action={<Button asChild><Link to="/finance/payments/new" search={{ payableId: undefined }}>Registrar pagamento</Link></Button>}/>:<EntityTable headers={['Data','Fornecedor','Conta','Método','Valor líquido','Status']}>
      {query.data.map(row=><EntityRow key={row.id}><EntityCell><Link className="font-medium hover:underline" to="/finance/payments/$paymentId" params={{paymentId:row.id}}>{formatDate(row.paidAt)}</Link></EntityCell><EntityCell>{row.supplierLegalName}</EntityCell><EntityCell>{row.financialAccountName}</EntityCell><EntityCell>{methodLabel[row.method]}</EntityCell><EntityCell>{formatBRL(Number(row.netAmount))}</EntityCell><EntityCell><StatusBadge status={statusLabel[row.status]}/></EntityCell></EntityRow>)}
    </EntityTable>}
  </div>
}
