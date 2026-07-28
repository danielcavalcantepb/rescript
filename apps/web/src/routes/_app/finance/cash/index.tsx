import { createFileRoute } from '@tanstack/react-router'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import { useCashFlow } from '#/modules/cash/ui/use-cash-flow'

export const Route = createFileRoute('/_app/finance/cash/')({ component: CashWorkspacePage })

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function CashWorkspacePage() {
  return <RequirePermission permission="finance.cash_flow.read"><CashWorkspaceContent /></RequirePermission>
}

function CashWorkspaceContent() {
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const cash = useCashFlow(currentOrganization?.id)
  if (orgLoading || !currentOrganization) return <PageLoading label="Carregando financeiro…" />
  if (cash.isError) return <PageError error={cash.error} />
  if (!cash.data) return <PageLoading label="Calculando fluxo de caixa…" />
  const data = cash.data
  const cards = [
    ['Saldo realizado', data.realizedBalance],
    ['Entradas previstas', data.forecastIn],
    ['Saídas previstas', data.forecastOut],
    ['Saldo projetado', data.projectedBalance],
  ] as const
  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Financeiro</p>
        <h1 className="text-2xl font-semibold">Caixa e fluxo financeiro</h1>
        <p className="text-sm text-muted-foreground">Saldos derivados do livro-caixa e obrigações abertas.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo financeiro">
        {cards.map(([label, value]) => <article key={label} className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5"><p className="text-sm text-[var(--color-text-secondary)]">{label}</p><p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">{money.format(value)}</p></article>)}
      </section>
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-secondary)]">
        <h2 className="font-medium text-[var(--color-ink)]">Base da projeção</h2>
        <p className="mt-2">O realizado é derivado exclusivamente do Ledger. Entradas e saídas previstas usam somente títulos abertos; transferências internas não compõem o resultado consolidado.</p>
      </section>
    </main>
  )
}
