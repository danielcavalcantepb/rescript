import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/finance/cash/')({ component: CashWorkspacePage })

function CashWorkspacePage() {
  return <main className="space-y-6 p-8"><header><p className="text-sm text-muted-foreground">Financeiro</p><h1 className="text-2xl font-semibold">Fluxo de caixa</h1><p className="text-sm text-muted-foreground">Movimentações, contas e consulta do Ledger financeiro.</p></header><nav className="flex gap-2 text-sm"><span className="rounded-md border bg-muted px-3 py-2">Movimentações</span><span className="rounded-md border px-3 py-2">Contas</span><span className="rounded-md border px-3 py-2">Consulta</span></nav><section className="rounded-lg border p-8 text-sm text-muted-foreground">Nenhuma movimentação encontrada.</section></main>
}
