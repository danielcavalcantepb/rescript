import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Banknote, ChevronRight, CircleDollarSign, Clock3, PackageSearch, ReceiptText, RefreshCw, ShoppingBag, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import { RequirePermission } from '#/platform/permissions'
import { cn } from '#/lib/utils'
import { useAnalyticsKpis, useAnalyticsOperationalFeed, useAnalyticsRanking, useAnalyticsTimeSeries } from '#/modules/analytics/ui/use-analytics'

type Period = 'today' | '7d' | '30d' | '12m'
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

const periods: Array<{ id: Period; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '12m', label: '12 meses' },
]

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

function dateRange(period: Period) {
  const to = new Date()
  const from = new Date(to)
  if (period === 'today') from.setHours(0, 0, 0, 0)
  if (period === '7d') from.setDate(to.getDate() - 6)
  if (period === '30d') from.setDate(to.getDate() - 29)
  if (period === '12m') from.setMonth(to.getMonth() - 11)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

function record(value: Json | undefined): Record<string, Json> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function rows(value: Json | undefined): Array<Record<string, Json>> {
  return Array.isArray(value) ? value.map(record) : []
}

function numeric(value: Json | undefined) {
  return typeof value === 'number' ? value : typeof value === 'string' ? Number(value) || 0 : 0
}

function text(value: Json | undefined, fallback = '—') {
  return typeof value === 'string' && value.length ? value : fallback
}

export function ExecutiveDashboardPage() {
  return (
    <RequirePermission permission="analytics.view" forbiddenDescription="Você não tem acesso ao Centro de Comando desta organização.">
      <ExecutiveDashboard />
    </RequirePermission>
  )
}

function ExecutiveDashboard() {
  const [period, setPeriod] = useState<Period>('30d')
  const range = useMemo(() => dateRange(period), [period])
  const kpis = useAnalyticsKpis(range)
  const series = useAnalyticsTimeSeries({ ...range, grain: period === '12m' ? 'month' : 'day' })
  const products = useAnalyticsRanking({ ...range, dimension: 'product', limit: 5 })
  const feed = useAnalyticsOperationalFeed({ limit: 5 })
  const loading = kpis.isLoading || series.isLoading || products.isLoading || feed.isLoading
  const failed = kpis.isError || series.isError || products.isError || feed.isError
  const data = record(kpis.data)
  const activity = record(feed.data)
  const chartPoints = rows(series.data)
  const productRows = rows(products.data)
  const recentSales = rows(activity.recentSales)
  const recentCash = rows(activity.recentCash)
  const overdue = rows(activity.overdueReceivables)
  const refresh = () => void Promise.all([kpis.refetch(), series.refetch(), products.refetch(), feed.refetch()])

  if (loading) return <DashboardSkeleton />
  if (failed) return <DashboardError onRetry={refresh} />

  const cards: Array<{ label: string; value: string; detail: string; icon: typeof ReceiptText; href: string; tone?: 'default' | 'warning' }> = [
    { label: 'Receita comercial', value: money.format(numeric(data.revenue)), detail: `${number.format(numeric(data.orders))} pedidos confirmados`, icon: ReceiptText, href: '/app/sales/orders' },
    { label: 'Saldo de caixa', value: money.format(numeric(data.cashBalance)), detail: `${money.format(numeric(data.cashInflows))} em entradas`, icon: Wallet, href: '/app/finance/cash' },
    { label: 'A receber', value: money.format(numeric(data.openReceivables)), detail: `${overdue.length} título(s) vencido(s)`, icon: ArrowDownRight, href: '/app/finance/receivables', tone: overdue.length ? 'warning' : 'default' },
    { label: 'A pagar', value: money.format(numeric(data.openPayables)), detail: `${money.format(numeric(data.cashOutflows))} em saídas no período`, icon: ArrowUpRight, href: '/app/finance/accounts-payable' },
    { label: 'Ticket médio', value: data.averageTicket === null ? 'Sem base' : money.format(numeric(data.averageTicket)), detail: 'somente pedidos confirmados', icon: CircleDollarSign, href: '/app/analytics' },
  ]

  return (
    <main className="min-h-full bg-[var(--color-bg)] px-4 py-5 text-[var(--color-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1560px]">
        <DashboardHeader period={period} refreshing={kpis.isFetching || series.isFetching} onPeriodChange={setPeriod} onRefresh={refresh} />
        <div className="mt-6 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {cards.map((card) => <KpiCard key={card.label} {...card} />)}
            </section>
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.9fr)]">
              <RevenueChart points={chartPoints} period={period} revenue={numeric(data.revenue)} />
              <OperationalSummary data={data} />
            </section>
            <section className="grid gap-4 lg:grid-cols-2">
              <RankingCard rows={productRows} />
              <RecentSalesCard rows={recentSales} />
            </section>
            <section className="grid gap-4 lg:grid-cols-3">
              <SummaryCard label="Clientes cadastrados" value={number.format(numeric(data.customers))} icon={ShoppingBag} detail="base atual da empresa" />
              <SummaryCard label="Produtos ativos" value={number.format(numeric(data.activeProducts))} icon={PackageSearch} detail="catálogo disponível" />
              <SummaryCard label="Quantidade vendida" value={number.format(numeric(data.quantitySold))} icon={Banknote} detail="no período selecionado" />
            </section>
          </div>
          <OperationalCenter overdue={overdue} cash={recentCash} sales={recentSales} />
        </div>
      </div>
    </main>
  )
}

function DashboardHeader({ period, refreshing, onPeriodChange, onRefresh }: { period: Period; refreshing: boolean; onPeriodChange: (value: Period) => void; onRefresh: () => void }) {
  return <header className="flex flex-col gap-4 border-b border-[var(--color-border-soft)] pb-5 xl:flex-row xl:items-end xl:justify-between">
    <div><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[var(--color-primary)]">Centro de comando · leitura ao vivo</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">O que exige sua atenção agora.</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Vendas confirmadas, caixa e obrigações em uma visão operacional.</p></div>
    <div className="flex flex-wrap items-center gap-2"><div className="flex rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-1">{periods.map((item) => <button key={item.id} type="button" onClick={() => onPeriodChange(item.id)} className={cn('rounded-[calc(var(--radius-md)-3px)] px-3 py-1.5 text-xs transition-colors', period === item.id ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]')}>{item.label}</button>)}</div><Button variant="secondary" size="sm" onClick={onRefresh} disabled={refreshing}><RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />Atualizar</Button></div>
  </header>
}

function KpiCard({ label, value, detail, icon: Icon, href, tone = 'default' }: { label: string; value: string; detail: string; icon: typeof ReceiptText; href: string; tone?: 'default' | 'warning' }) {
  return <Link to={href} className="kpi-card group relative min-h-40 overflow-hidden rounded-[var(--radius-lg)] border p-4 transition duration-200 hover:-translate-y-0.5 focus-visible:outline-offset-4"><div className={cn('absolute -right-6 -top-7 size-24 rounded-full blur-2xl', tone === 'warning' ? 'bg-[var(--color-warning)]/25' : 'bg-[var(--kpi-card-icon)]/20')} /><div className="relative flex h-full flex-col"><div className="flex items-center justify-between"><span className="text-xs text-[var(--kpi-card-muted)]">{label}</span><Icon className={cn('size-4', tone === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--kpi-card-icon)]')} /></div><strong className="mt-5 font-mono text-xl font-semibold tracking-tight tabular-nums text-[var(--kpi-card-foreground)]">{value}</strong><span className="mt-auto text-[11px] text-[var(--kpi-card-muted)]">{detail}</span></div></Link>
}

function RevenueChart({ points, period, revenue }: { points: Array<Record<string, Json>>; period: Period; revenue: number }) {
  const values = points.map((point) => numeric(point.revenue)); const max = Math.max(...values, 1)
  const graph = points.map((point, index) => `${points.length < 2 ? 50 : (index / (points.length - 1)) * 100},${100 - (numeric(point.revenue) / max) * 78}`).join(' ')
  return <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-[var(--color-text-secondary)]">Faturamento</p><h2 className="mt-1 text-xl font-semibold">Evolução da receita comercial</h2></div><span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-primary)]">{periods.find((item) => item.id === period)?.label}</span></div><div className="mt-2 font-mono text-3xl font-semibold tabular-nums">{money.format(revenue)}</div><div className="mt-5 h-60 rounded-[var(--radius-md)] bg-[linear-gradient(180deg,rgba(55,197,139,.08),transparent_65%)] p-3">{points.length ? <svg className="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Evolução do faturamento"><defs><linearGradient id="rescript-revenue" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity=".35"/><stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0"/></linearGradient></defs><path d={`M 0 100 L ${graph} L 100 100 Z`} fill="url(#rescript-revenue)"/><polyline points={graph} fill="none" stroke="var(--color-primary)" strokeWidth="1.6" vectorEffect="non-scaling-stroke"/>{points.map((point, index) => <circle key={`${text(point.period)}-${index}`} cx={points.length < 2 ? 50 : (index / (points.length - 1)) * 100} cy={100 - (numeric(point.revenue) / max) * 78} r="1.7" fill="var(--color-primary)"><title>{`${text(point.period)}: ${money.format(numeric(point.revenue))}`}</title></circle>)}</svg> : <EmptyChart />}</div></section>
}

function OperationalSummary({ data }: { data: Record<string, Json> }) { return <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5"><p className="text-xs font-medium text-[var(--color-text-secondary)]">Resumo financeiro</p><h2 className="mt-1 text-xl font-semibold">Fluxo no período</h2><div className="mt-6 space-y-3"><DataLine label="Entradas" value={money.format(numeric(data.cashInflows))} tone="success"/><DataLine label="Saídas" value={money.format(numeric(data.cashOutflows))} tone="danger"/><DataLine label="Saldo consolidado" value={money.format(numeric(data.cashBalance))} tone="primary"/></div><p className="mt-6 border-t border-[var(--color-border-soft)] pt-4 text-xs leading-relaxed text-[var(--color-muted)]">O saldo é derivado do livro-caixa. Obrigações abertas permanecem visíveis nos indicadores ao lado.</p></section> }
function DataLine({ label, value, tone }: { label: string; value: string; tone: 'success' | 'danger' | 'primary' }) { return <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-canvas)] px-3 py-3"><span className="text-xs text-[var(--color-text-secondary)]">{label}</span><span className={cn('font-mono text-sm font-semibold tabular-nums', tone === 'success' && 'text-[var(--color-success)]', tone === 'danger' && 'text-[var(--color-danger)]', tone === 'primary' && 'text-[var(--color-primary)]')}>{value}</span></div> }
function RankingCard({ rows: ranking }: { rows: Array<Record<string, Json>> }) { const top = Math.max(...ranking.map((row) => numeric(row.revenue)), 1); return <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5"><SectionHeader title="Produtos que movimentam receita" subtitle="Ranking por vendas confirmadas" href="/app/catalog/products"/>{ranking.length ? <div className="mt-5 space-y-4">{ranking.map((item, index) => <div key={`${text(item.product_id)}-${index}`} className="flex items-center gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] text-xs font-medium text-[var(--color-primary)]">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><span className="truncate text-sm">{text(item.product_name, text(item.sku))}</span><span className="font-mono text-xs tabular-nums">{money.format(numeric(item.revenue))}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-canvas)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.max((numeric(item.revenue) / top) * 100, 4)}%` }}/></div></div></div>)}</div> : <EmptyCard label="Ainda não há produtos vendidos no período."/>}</section> }
function RecentSalesCard({ rows: sales }: { rows: Array<Record<string, Json>> }) { return <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5"><SectionHeader title="Pedidos recentes" subtitle="Últimas vendas confirmadas" href="/app/sales/orders"/>{sales.length ? <div className="mt-5 divide-y divide-[var(--color-border-soft)]">{sales.map((sale) => <div key={text(sale.sales_order_id)} className="flex items-center justify-between gap-3 py-3 first:pt-0"><div className="min-w-0"><p className="text-sm font-medium">{text(sale.number)}</p><p className="truncate text-xs text-[var(--color-muted)]">{text(sale.customer_name, 'Cliente não identificado')}</p></div><span className="font-mono text-xs font-semibold tabular-nums text-[var(--color-primary)]">{money.format(numeric(sale.revenue))}</span></div>)}</div> : <EmptyCard label="Nenhum pedido confirmado ainda."/>}</section> }
function OperationalCenter({ overdue, cash, sales }: { overdue: Array<Record<string, Json>>; cash: Array<Record<string, Json>>; sales: Array<Record<string, Json>> }) { const alerts = [{ label: 'Recebíveis vencidos', value: overdue.length, icon: AlertTriangle, tone: overdue.length ? 'warning' : 'success' }, { label: 'Últimos recebimentos e pagamentos', value: cash.length, icon: Clock3, tone: 'info' as const }, { label: 'Vendas recentes', value: sales.length, icon: ShoppingBag, tone: 'success' as const }]; return <aside className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-[var(--color-primary)]">CENTRO OPERACIONAL</p><h2 className="mt-1 text-xl font-semibold">Sinais da empresa</h2></div><span className="size-2 rounded-full bg-[var(--color-success)] shadow-[0_0_12px_var(--color-success)]" title="Atualização baseada nos fatos persistidos"/></div><div className="mt-5 space-y-2">{alerts.map((alert) => <div key={alert.label} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-canvas)] p-3"><alert.icon className={cn('size-4', alert.tone === 'warning' ? 'text-[var(--color-warning)]' : alert.tone === 'info' ? 'text-[var(--color-info)]' : 'text-[var(--color-success)]')}/><span className="min-w-0 flex-1 text-xs text-[var(--color-text-secondary)]">{alert.label}</span><strong className="font-mono text-sm">{alert.value}</strong></div>)}</div><div className="mt-6 border-t border-[var(--color-border-soft)] pt-5"><p className="text-xs font-medium text-[var(--color-text-secondary)]">Atividade financeira</p>{cash.length ? <div className="mt-3 space-y-3">{cash.slice(0, 4).map((item) => <div key={text(item.cash_ledger_entry_id)} className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--color-primary)]"/><div className="min-w-0"><p className="text-xs font-medium">{text(item.origin)}</p><p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{text(item.entry_type)} · {money.format(numeric(item.amount))}</p></div></div>)}</div> : <EmptyCard label="Nenhuma movimentação financeira recente."/>}</div><div className="mt-6 border-t border-[var(--color-border-soft)] pt-5"><p className="text-xs font-medium text-[var(--color-text-secondary)]">Atenção imediata</p>{overdue.length ? <div className="mt-3 space-y-2">{overdue.slice(0, 3).map((item) => <div key={text(item.installment_id, text(item.receivable_id))} className="rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] p-3"><p className="text-xs font-medium text-[var(--color-warning)]">Título vencido</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Vencimento {text(item.due_date)} · {money.format(numeric(item.open_amount))}</p></div>)}</div> : <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">Nenhum recebível vencido foi encontrado na projeção atual.</p>}</div></aside> }
function SummaryCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Banknote }) { return <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-hover)]"><div className="flex items-center justify-between"><p className="text-xs text-[var(--color-text-secondary)]">{label}</p><Icon className="size-4 text-[var(--color-primary)]"/></div><p className="mt-4 font-mono text-2xl font-semibold tabular-nums">{value}</p><p className="mt-2 text-xs text-[var(--color-muted)]">{detail}</p></section> }
function SectionHeader({ title, subtitle, href }: { title: string; subtitle: string; href: string }) { return <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{subtitle}</p></div><Link to={href} className="rounded-[var(--radius-sm)] p-1 text-[var(--color-muted)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-primary)]" aria-label={`Abrir ${title}`}><ChevronRight className="size-4"/></Link></div> }
function EmptyCard({ label }: { label: string }) { return <p className="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-soft)] bg-[var(--color-canvas)] p-4 text-center text-xs text-[var(--color-muted)]">{label}</p> }
function EmptyChart() { return <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">Sem faturamento no período selecionado.</div> }
function DashboardSkeleton() { return <main className="min-h-full bg-[var(--color-bg)] p-6"><div className="mx-auto max-w-[1560px] animate-pulse space-y-5"><div className="h-20 rounded-[var(--radius-lg)] bg-[var(--color-surface)]"/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-40 rounded-[var(--radius-lg)] bg-[var(--color-surface)]"/>)}</div><div className="grid gap-4 xl:grid-cols-[1.65fr_.9fr]"><div className="h-80 rounded-[var(--radius-lg)] bg-[var(--color-surface)]"/><div className="h-80 rounded-[var(--radius-lg)] bg-[var(--color-surface)]"/></div></div></main> }
function DashboardError({ onRetry }: { onRetry: () => void }) { return <main className="flex min-h-full items-center justify-center bg-[var(--color-bg)] p-6"><div className="max-w-md rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-[var(--color-surface)] p-6 text-center"><AlertTriangle className="mx-auto size-6 text-[var(--color-danger)]"/><h1 className="mt-3 text-lg font-semibold">Não foi possível atualizar o Centro de Comando</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">A leitura analítica está indisponível no momento. Nenhum dado operacional foi alterado.</p><Button className="mt-5" onClick={onRetry}>Tentar novamente</Button></div></main> }
