import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { purchaseReturnList } from '#/modules/purchase-returns/ui/purchase-returns-api'

export const Route = createFileRoute('/_app/purchasing/returns/')({ component: PurchaseReturnsPage })

function PurchaseReturnsPage() {
  const { organizationId } = useSearch({ strict: false }) as { organizationId?: string }
  const query = useQuery({ queryKey: ['purchase-returns', organizationId], queryFn: () => purchaseReturnList({ data: { organizationId: organizationId ?? '00000000-0000-0000-0000-000000000000' } }), enabled: Boolean(organizationId) })
  return <main className="space-y-6 p-8"><header><p className="text-sm text-muted-foreground">Compras</p><h1 className="text-2xl font-semibold">Devoluções de compras</h1><p className="text-sm text-muted-foreground">Mercadorias devolvidas a partir de recebimentos concluídos.</p></header><section className="rounded-lg border p-4"><div className="grid grid-cols-5 gap-4 text-sm font-medium"><span>Número</span><span>Pedido</span><span>Recebimento</span><span>Status</span><span>Data</span></div>{query.isLoading && <p className="py-8 text-sm text-muted-foreground">Carregando devoluções…</p>}{query.data?.map((row) => <div key={row.purchase_return_id} className="grid grid-cols-5 gap-4 border-t py-3 text-sm"><span>{row.number}</span><span>{row.purchase_order_id}</span><span>{row.goods_receipt_id}</span><span>{row.status}</span><span>{row.returned_at ?? '—'}</span></div>)}{!query.isLoading && !query.data?.length && <p className="py-8 text-sm text-muted-foreground">Nenhuma devolução encontrada.</p>}</section></main>
}
