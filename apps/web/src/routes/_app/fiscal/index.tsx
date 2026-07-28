import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/fiscal/')({ component: FiscalWorkspacePage })

function FiscalWorkspacePage() {
  return <main className="space-y-6 p-8"><header><p className="text-sm text-muted-foreground">Fiscal</p><h1 className="text-2xl font-semibold">Documentos fiscais internos</h1><p className="text-sm text-muted-foreground">Documentos vinculados às operações elegíveis do ERP.</p></header><nav className="flex gap-2 text-sm"><span className="rounded-md border bg-muted px-3 py-2">Documentos</span><span className="rounded-md border px-3 py-2">Perfis</span><span className="rounded-md border px-3 py-2">Operações</span><span className="rounded-md border px-3 py-2">Regras</span><span className="rounded-md border px-3 py-2">Simulador Fiscal</span></nav><section className="rounded-lg border p-8 text-sm text-muted-foreground">A consulta server-side de documentos fiscais será carregada conforme a organização selecionada.</section></main>
}
