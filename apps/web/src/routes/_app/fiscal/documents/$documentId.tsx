import { createFileRoute, Link, useParams, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getFiscalDocument } from '#/modules/fiscal/ui/fiscal-api'

export const Route = createFileRoute('/_app/fiscal/documents/$documentId')({ component: FiscalDocumentPage })
function FiscalDocumentPage() {
  const { documentId } = useParams({ from: '/_app/fiscal/documents/$documentId' }); const { organizationId } = useSearch({ strict: false }) as { organizationId?: string }
  const query = useQuery({ queryKey: ['fiscal-document', organizationId, documentId], queryFn: () => getFiscalDocument({ data: { organizationId: organizationId ?? '00000000-0000-0000-0000-000000000000', id: documentId } }), enabled: Boolean(organizationId) })
  if (query.isLoading) return <main className="p-8 text-sm text-muted-foreground">Carregando documento fiscal…</main>
  if (query.isError || !query.data?.ok) return <main className="p-8 text-sm text-destructive">Não foi possível carregar o documento fiscal.</main>
  const { document, items, history } = query.data.data
  return <main className="space-y-6 p-8"><Link to="/fiscal" className="text-sm text-muted-foreground">← Documentos fiscais</Link><header><p className="text-sm text-muted-foreground">Fiscal Document</p><h1 className="text-2xl font-semibold">{String(document.internal_number)}</h1><p className="text-sm text-muted-foreground">{String(document.status)} · {String(document.source_document ?? 'Sem origem')}</p></header><section className="rounded-lg border p-4"><h2 className="mb-3 font-medium">Itens e snapshots fiscais</h2>{items.map((item: Record<string, unknown>) => <div key={String(item.id)} className="border-t py-3 text-sm"><strong>{String((item.variant_snapshot as Record<string, unknown>)?.sku ?? item.variant_id)}</strong> · {String(item.quantity)} {String(item.unit_code)} · CFOP {String(item.cfop ?? '—')} · CST {String(item.cst ?? '—')} · NCM {String(item.ncm ?? '—')}</div>)}</section><section className="rounded-lg border p-4"><h2 className="mb-3 font-medium">Timeline</h2>{history.map((event: Record<string, unknown>) => <div key={String(event.id)} className="border-t py-2 text-sm">{String(event.action)} · {String(event.created_at)}</div>)}</section></main>
}
