import type{QuotationStatus,SalesOrderStatus}from'./types'
const quotation:Record<QuotationStatus,readonly QuotationStatus[]>={draft:['sent','archived'],sent:['approved','rejected','expired'],approved:['archived'],rejected:['archived'],expired:['archived'],archived:[]}
const order:Record<SalesOrderStatus,readonly SalesOrderStatus[]>={draft:['confirmed','cancelled','archived'],confirmed:['cancelled'],cancelled:['archived'],archived:[]}
export function assertQuotationTransition(from:QuotationStatus,to:QuotationStatus){if(!quotation[from].includes(to))throw Error('invalid_quotation_transition')}
export function assertSalesOrderTransition(from:SalesOrderStatus,to:SalesOrderStatus){if(!order[from].includes(to))throw Error('invalid_sales_order_transition')}
export const quotationStatusLabel=(s:QuotationStatus)=>({draft:'Rascunho',sent:'Enviada',approved:'Aprovada',rejected:'Rejeitada',expired:'Expirada',archived:'Arquivada'}as const)[s]
export const salesOrderStatusLabel=(s:SalesOrderStatus)=>({draft:'Rascunho',confirmed:'Confirmado',cancelled:'Cancelado',archived:'Arquivado'}as const)[s]
