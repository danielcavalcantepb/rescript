import { Badge } from '#/components/ui/badge'

const saleTone: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent'> = {
  Rascunho: 'neutral',
  Orçamento: 'info',
  Pedido: 'warning',
  Confirmada: 'success',
  Cancelada: 'danger',
  PedidoCancelado: 'neutral',
  Descartada: 'neutral',
  OrçamentoRecusado: 'neutral',
  OrçamentoExpirado: 'neutral',
  ativo: 'success',
  arquivado: 'neutral',
  active: 'success',
  inactive: 'neutral',
  Ativo: 'success',
  Arquivado: 'neutral',

  'Em aberto': 'warning',
  Parcial: 'accent',
  Quitado: 'success',
  Vencido: 'danger',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={saleTone[status] ?? 'neutral'}>{status}</Badge>
}
