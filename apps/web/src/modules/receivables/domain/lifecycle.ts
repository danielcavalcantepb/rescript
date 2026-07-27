import type{ReceivableStatus}from'./types'
const next:Record<ReceivableStatus,readonly ReceivableStatus[]>={draft:['open','archived'],open:['partially_paid','cancelled'],partially_paid:['paid'],paid:['archived'],cancelled:['archived'],archived:[]}
export function assertReceivableTransition(from:ReceivableStatus,to:ReceivableStatus){if(!next[from].includes(to))throw new Error('invalid_receivable_transition')}
export function receivableStatusLabel(s:ReceivableStatus){return({draft:'Rascunho',open:'Em aberto',partially_paid:'Parcialmente pago',paid:'Pago',cancelled:'Cancelado',archived:'Arquivado'}as const)[s]}
