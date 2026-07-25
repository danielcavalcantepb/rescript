/** Domain package — pure logic (Sprint 0: stubs only). */
export type Money = { amount: number; currency: 'BRL' }
export type Quantity = { amount: number; unit: string; precision: number }

export const SALE_STATUSES = [
  'Rascunho',
  'Orcamento',
  'Pedido',
  'Confirmada',
  'Cancelada',
  'Descartada',
  'OrcamentoRecusado',
  'OrcamentoExpirado',
  'PedidoCancelado',
] as const

export type SaleStatus = (typeof SALE_STATUSES)[number]
