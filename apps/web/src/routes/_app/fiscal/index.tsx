import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/fiscal/')({ component: FiscalWorkspacePage })

function FiscalWorkspacePage() {
  return <main className="space-y-6 p-8"><header><p className="text-sm text-muted-foreground">Fiscal</p><h1 className="text-2xl font-semibold">Documentos fiscais internos</h1><p className="text-sm text-muted-foreground">Documentos e origens fiscais configuradas para as operações do ERP.</p></header><nav className="flex gap-2 text-sm"><span className="rounded-md border bg-muted px-3 py-2">Origens Fiscais</span><span className="rounded-md border px-3 py-2">Documentos</span><span className="rounded-md border px-3 py-2">Perfis</span><span className="rounded-md border px-3 py-2">Operações</span><span className="rounded-md border px-3 py-2">Regras</span></nav><section className="rounded-lg border p-8 text-sm text-muted-foreground">Configure operação, perfil fiscal, UFs, data e responsável para cada origem operacional.</section></main>
}
