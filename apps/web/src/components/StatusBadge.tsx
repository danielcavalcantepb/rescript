import { Badge } from '#/components/ui/badge'

const statusTone: Record<
  string,
  'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent'
> = {
  // Sales
  Rascunho: 'neutral',
  Orçamento: 'info',
  Pedido: 'warning',
  Confirmada: 'success',
  Cancelada: 'danger',
  PedidoCancelado: 'neutral',
  Descartada: 'neutral',
  OrçamentoRecusado: 'neutral',
  OrçamentoExpirado: 'neutral',

  // Catalog / Customer
  ativo: 'success',
  arquivado: 'neutral',
  active: 'success',
  inactive: 'neutral',
  draft: 'info',
  archived: 'neutral',
  Ativo: 'success',
  Inativo: 'warning',
  Arquivado: 'neutral',

  // Finance-ish (mock)
  'Em aberto': 'warning',
  Parcial: 'accent',
  Quitado: 'success',
  Vencido: 'danger',

  // Inventory
  Disponível: 'success',
  'Sem estoque': 'warning',
  Entrada: 'success',
  Saída: 'info',
  'Ajuste (+)': 'accent',
  'Ajuste (−)': 'warning',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? 'neutral'}>{status}</Badge>
}
