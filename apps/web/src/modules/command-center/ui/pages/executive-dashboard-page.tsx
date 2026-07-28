import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useOrganization } from '#/platform/organization/organization-context'
import { getExecutiveDashboard } from '../executive-dashboard-api'

type DashboardData = {
  cards: Record<string, number>
  revenue: Array<{ date: string; value: number }>
  topProducts: Array<{ product: string; quantity: number; value: number }>
  stock: {
    quantity: number | null
    value: number | null
    lowStock: number | null
    withoutMovement: number | null
  }
}
const money = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

export function ExecutiveDashboardPage() {
  const { currentOrganization } = useOrganization()
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '12m'>('30d')
  const query = useQuery({
    queryKey: ['executive-dashboard', currentOrganization?.id, period],
    queryFn: () =>
      getExecutiveDashboard({
        data: { organizationId: currentOrganization!.id, period },
      }),
    enabled: Boolean(currentOrganization?.id),
  })
  if (query.isLoading)
    return (
      <main className="min-h-full bg-[var(--color-bg)] p-8 text-sm text-[var(--color-muted)]">
        Carregando visão executiva…
      </main>
    )
  if (query.isError)
    return (
      <main className="min-h-full bg-[var(--color-bg)] p-8 text-sm text-[var(--color-danger)]">
        Não foi possível carregar o dashboard.
      </main>
    )
  const data = query.data as DashboardData | undefined
  if (!data)
    return (
      <main className="min-h-full bg-[var(--color-bg)] p-8 text-sm text-[var(--color-muted)]">
        Nenhum dado disponível.
      </main>
    )
  const cards: Array<[string, number, boolean]> = [
    ['Faturamento hoje', data.cards.revenueToday, true],
    ['Faturamento do mês', data.cards.revenueMonth, true],
    ['Vendas do mês', data.cards.salesMonth, false],
    ['Ticket médio', data.cards.averageTicket, true],
    ['Clientes', data.cards.customers, false],
    ['Produtos', data.cards.products, false],
    ['Contas a receber', data.cards.receivables, true],
    ['Contas a pagar', data.cards.payables, true],
  ]
  const maxRevenue = Math.max(...data.revenue.map((row) => row.value), 1)
  return (
    <main className="min-h-full bg-[var(--color-bg)] p-4 text-[var(--color-ink)] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8eea49]">
              Visão executiva · {periodLabel(period)}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Bom dia. Aqui está sua operação.
            </h1>
            <p className="mt-2 text-sm text-[#9aa6a0]">
              Uma leitura objetiva para decidir o próximo movimento.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
              {(
                [
                  ['today', 'Hoje'],
                  ['7d', '7 dias'],
                  ['30d', '30 dias'],
                  ['12m', '12 meses'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`rounded-md px-3 py-1.5 text-xs transition ${period === key ? 'bg-[#8eea49] font-medium text-[#102016]' : 'text-[#aebbb2] hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[#d8e2db] transition hover:border-[#8eea49] hover:text-[#8eea49]"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              {query.isFetching ? 'Atualizando…' : 'Atualizar dados'}
            </button>
          </div>
        </header>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, isMoney], index) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-[#1a1e20] p-4 shadow-[0_12px_35px_rgba(0,0,0,.18)]"
            >
              <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-[#8eea49]/[0.07] blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between text-xs text-[#9aa6a0]">
                  <span>{label}</span>
                  <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-[#8eea49]">
                    {index < 4 ? periodLabel(period) : 'base'}
                  </span>
                </div>
                <div className="mt-4 text-2xl font-semibold tracking-tight">
                  {isMoney ? money(Number(value)) : Number(value).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          ))}
      </section>
      <ReferenceCharts data={data} period={period} />
      <section className="grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
          <div className="rounded-xl border border-white/10 bg-[#1a1e20] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">Faturamento</h2>
                <p className="mt-1 text-xs text-[#9aa6a0]">
                  Evolução diária do período selecionado
                </p>
              </div>
              <span className="rounded-full border border-[#8eea49]/30 px-3 py-1 text-xs text-[#8eea49]">
                {periodLabel(period)}
              </span>
            </div>
            {data.revenue.length ? (
              <div className="mt-8 flex h-48 items-end gap-1.5 sm:gap-2">
                {data.revenue.map((row) => (
                  <div
                    key={row.date}
                    className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#52bc42] to-[#c4ff67] opacity-80 transition group-hover:opacity-100"
                      style={{
                        height: `${Math.max((row.value / maxRevenue) * 100, 4)}%`,
                      }}
                      title={`${row.date}: ${money(Number(row.value))}`}
                    />
                    <span className="hidden text-[9px] text-[#718078] sm:block">
                      {row.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-[#9aa6a0]">
                Nenhuma venda confirmada no período.
              </div>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-[#1a1e20] p-5">
            <h2 className="text-lg font-medium">Produtos mais vendidos</h2>
            <p className="mt-1 text-xs text-[#9aa6a0]">Top 10 por valor vendido</p>
            <div className="mt-5 space-y-3">
              {data.topProducts.length ? (
                data.topProducts.map((row, index) => (
                  <div key={row.product} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[11px] text-[#8eea49]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{row.product}</div>
                      <div className="mt-1 h-1 rounded-full bg-white/10">
                        <div
                          className="h-1 rounded-full bg-[#8eea49]"
                          style={{
                            width: `${Math.max((row.value / Number(data.topProducts[0].value || 1)) * 100, 5)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-[#cbd6ce]">
                      {money(Number(row.value))}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-8 text-sm text-[#9aa6a0]">
                  Nenhuma venda confirmada no período.
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="grid gap-5 lg:grid-cols-[1fr_1fr_.8fr]">
          <div className="rounded-xl border border-white/10 bg-[#1a1e20] p-5">
            <h2 className="text-lg font-medium">Estoque</h2>
            <p className="mt-1 text-xs text-[#9aa6a0]">Posição operacional atual</p>
            <div className="mt-6 text-3xl font-semibold">
              {Number(data.stock.quantity ?? 0).toLocaleString('pt-BR')}{' '}
              <span className="text-sm font-normal text-[#9aa6a0]">unidades</span>
            </div>
            <p className="mt-3 text-xs text-[#9aa6a0]">
              Valor financeiro ainda não disponível no domínio atual.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#1a1e20] p-5">
            <h2 className="text-lg font-medium">Saúde financeira</h2>
            <p className="mt-1 text-xs text-[#9aa6a0]">Obrigações já persistidas</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="A receber" value={money(Number(data.cards.receivables))} />
              <Metric label="A pagar" value={money(Number(data.cards.payables))} />
            </div>
          </div>
          <div className="rounded-xl border border-[#8eea49]/30 bg-gradient-to-br from-[#1e3328] to-[#17201c] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-[#8eea49]">
              Próximo passo
            </div>
            <h2 className="mt-3 text-xl font-medium">
              Mantenha o contexto perto da decisão.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#b7c7bc]">
              Use os módulos ao lado para aprofundar cada sinal operacional.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function ReferenceCharts({ data, period }: { data: DashboardData; period: 'today' | '7d' | '30d' | '12m' }) {
  const total = data.topProducts.reduce((sum, item) => sum + Number(item.value), 0)
  let cursor = 0
  const colors = ['#c4ff67', '#8eea49', '#4fbf65', '#2d7652', '#1e4938']
  const stops = data.topProducts.slice(0, 5).map((item, index) => { const start = cursor; cursor += total ? Number(item.value) / total * 100 : 0; return `${colors[index]} ${start}% ${cursor}%` }).join(', ')
  const points = data.revenue.map((item, index) => `${(index / Math.max(data.revenue.length - 1, 1)) * 100},${100 - (Number(item.value) / Math.max(...data.revenue.map((row) => row.value), 1)) * 86}`).join(' ')
  return <section className="grid gap-5 xl:grid-cols-[1.1fr_1.4fr_.8fr]"><div className="rounded-xl border border-white/10 bg-[#1a1e20] p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-medium">Sales Overview</h2><p className="mt-1 text-xs text-[#9aa6a0]">Participação por produto · {periodLabel(period)}</p></div><span className="text-xs text-[#8eea49]">● Atual</span></div>{total ? <div className="mt-6 flex items-center gap-6"><div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: `conic-gradient(${stops})` }}><div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-[#1a1e20]"><span className="text-xl font-semibold">{money(total)}</span><span className="text-[10px] text-[#9aa6a0]">vendas</span></div></div><div className="min-w-0 space-y-2">{data.topProducts.slice(0, 5).map((item, index) => <div key={item.product} className="flex items-center justify-between gap-4 text-xs"><span className="flex min-w-0 items-center gap-2 truncate"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index] }} />{item.product}</span><span className="text-[#cbd6ce]">{money(Number(item.value))}</span></div>)}</div></div> : <div className="flex h-36 items-center justify-center text-sm text-[#9aa6a0]">Sem dados de vendas.</div>}</div><div className="rounded-xl border border-white/10 bg-[#1a1e20] p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-medium">Revenue Overview</h2><p className="mt-1 text-xs text-[#9aa6a0]">Tendência de faturamento</p></div><span className="rounded-full bg-[#8eea49]/10 px-3 py-1 text-xs text-[#8eea49]">{periodLabel(period)}</span></div>{data.revenue.length ? <svg className="mt-6 h-36 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Gráfico de faturamento"><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8eea49" stopOpacity=".35" /><stop offset="100%" stopColor="#8eea49" stopOpacity="0" /></linearGradient></defs><polyline points={`0,100 ${points} 100,100`} fill="url(#revenue-fill)" stroke="none" /><polyline points={points} fill="none" stroke="#8eea49" strokeWidth="1.8" vectorEffect="non-scaling-stroke" /></svg> : <div className="flex h-36 items-center justify-center text-sm text-[#9aa6a0]">Sem faturamento no período.</div>}</div><div className="rounded-xl border border-[#8eea49]/25 bg-gradient-to-br from-[#1f3829] to-[#151d19] p-5"><div className="text-xs uppercase tracking-[0.18em] text-[#8eea49]">Resumo</div><div className="mt-5 text-3xl font-semibold">{data.revenue.length}</div><div className="mt-1 text-sm text-[#b7c7bc]">dias com movimento</div><div className="mt-6 border-t border-white/10 pt-4 text-xs text-[#9aa6a0]">Os gráficos refletem somente vendas confirmadas persistidas.</div></div></section>
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.05] p-3">
      <div className="text-xs text-[#9aa6a0]">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  )
}
function periodLabel(period: 'today' | '7d' | '30d' | '12m') {
  return period === 'today'
    ? 'Hoje'
    : period === '7d'
      ? '7 dias'
      : period === '12m'
        ? '12 meses'
        : '30 dias'
}
