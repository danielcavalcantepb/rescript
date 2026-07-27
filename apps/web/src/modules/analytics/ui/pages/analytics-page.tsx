import { useMemo, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/EmptyState'
import { PageHeader } from '#/components/PageHeader'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { RequirePermission } from '#/platform/permissions'
import { cn } from '#/lib/utils'
import type {
  AnalyticsCategory,
  AnalyticsFilters,
  AnalyticsMetric,
  AnalyticsPeriodPreset,
  AnalyticsWorkspaceSnapshot,
} from '../../domain/types'
import { useAnalytics } from '../use-analytics'

const periods: Array<{ value: AnalyticsPeriodPreset; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7_days', label: '7 dias' },
  { value: 'last_15_days', label: '15 dias' },
  { value: 'last_30_days', label: '30 dias' },
  { value: 'last_90_days', label: '90 dias' },
  { value: 'this_month', label: 'Mês atual' },
  { value: 'previous_month', label: 'Mês anterior' },
  { value: 'this_quarter', label: 'Trimestre' },
  { value: 'this_year', label: 'Ano' },
]

const defaultFilters: AnalyticsFilters = { period: 'last_30_days' }

export function AnalyticsPage() {
  return (
    <RequirePermission
      permission="analytics.view"
      forbiddenDescription="Você não tem acesso às métricas corporativas desta organização."
    >
      <AnalyticsContent />
    </RequirePermission>
  )
}

function AnalyticsContent() {
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters)
  const query = useAnalytics(filters)

  if (query.isLoading) return <PageLoading label="Calculando métricas…" />
  if (query.isError) return <PageError error={query.error} onRetry={() => void query.refetch()} />
  if (!query.data) {
    return (
      <EmptyState
        icon="trending"
        title="Métricas indisponíveis"
        description="Não foi possível compor a visão corporativa agora."
      />
    )
  }

  return (
    <AnalyticsWorkspace
      data={query.data}
      filters={filters}
      isRefreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
      onPeriodChange={(period) => setFilters({ ...filters, period })}
    />
  )
}

export function AnalyticsWorkspace({
  data,
  filters,
  isRefreshing = false,
  onRefresh,
  onPeriodChange,
}: {
  data: AnalyticsWorkspaceSnapshot
  filters: AnalyticsFilters
  isRefreshing?: boolean
  onRefresh?: () => void
  onPeriodChange?: (period: AnalyticsPeriodPreset) => void
}) {
  const [activeTab, setActiveTab] = useState<AnalyticsCategory>('overview')
  const [selectedMetricId, setSelectedMetricId] = useState('revenue')
  const active = data.tabs.find((tab) => tab.id === activeTab) ?? data.tabs[0]
  const metricsById = useMemo(
    () => new Map(data.metrics.map((metric) => [metric.id, metric])),
    [data.metrics],
  )
  const activeMetrics = active.metricIds
    .map((id) => metricsById.get(id))
    .filter((metric): metric is AnalyticsMetric => Boolean(metric))
  const selectedMetric = metricsById.get(selectedMetricId) ?? activeMetrics[0] ?? data.metrics[0]
  const drilldown = data.drilldowns.find((item) => item.metricId === selectedMetric?.id)
  const readyCount = data.metrics.filter((metric) => metric.status === 'ready').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Métricas"
        description="Visão corporativa para entender receita, clientes, produtos, estoque e financeiro sem alterar fatos operacionais."
        actions={
          <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Atualizando…' : 'Atualizar'}
          </Button>
        }
      />

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-[var(--color-primary)] uppercase">
              Business Analytics
            </p>
            <h2 className="mt-1 text-2xl font-medium tracking-tight text-[var(--color-ink)] md:text-3xl">
              Como está o seu negócio?
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              O Centro de Comando mostra o que exige atenção. Métricas mostra
              desempenho, evolução e comparativos para gestão.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">{readyCount} métricas prontas</Badge>
            <Badge tone={data.sourceIssues.length ? 'warning' : 'success'}>
              {data.sourceIssues.length ? 'Dados parciais' : 'Fontes conectadas'}
            </Badge>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <button
                key={period.value}
                type="button"
                onClick={() => onPeriodChange?.(period.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  filters.period === period.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border-soft)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]',
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
          <div className="grid gap-2 text-xs text-[var(--color-muted)] md:grid-cols-3">
            <FilterPill label="Empresa" value="Organização atual" />
            <FilterPill label="Filtros combinados" value="cliente, produto, vendedor, status e origem" />
            <FilterPill label="Atualização" value={new Date(data.generatedAt).toLocaleString('pt-BR')} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.slice(0, 8).map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            active={selectedMetric.id === metric.id}
            onClick={() => setSelectedMetricId(metric.id)}
          />
        ))}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {data.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors',
                activeTab === tab.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-canvas)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h3 className="text-base font-medium text-[var(--color-ink)]">{active.label}</h3>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">{active.description}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {activeMetrics.map((metric) => (
                <MetricRow
                  key={metric.id}
                  metric={metric}
                  onClick={() => setSelectedMetricId(metric.id)}
                />
              ))}
            </div>
          </div>
          <MetricDetail metric={selectedMetric} drilldown={drilldown} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Receita por dia" points={data.series.revenue ?? []} />
        <ChartCard title="Fluxo previsto" points={data.series.cash_flow ?? []} />
      </section>

      {data.sourceIssues.length ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-4">
          <h3 className="text-sm font-medium text-[var(--color-ink)]">Dados parciais</h3>
          <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">
            {data.sourceIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function FilterPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-canvas)] px-3 py-2">
      <span className="font-medium text-[var(--color-ink)]">{label}: </span>
      {value}
    </div>
  )
}

function MetricCard({
  metric,
  active,
  onClick,
}: {
  metric: AnalyticsMetric
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-sm)] transition-colors',
        active
          ? 'border-[var(--color-primary)]'
          : 'border-[var(--color-border-soft)] hover:bg-[var(--color-hover)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[var(--color-muted)]">{metric.name}</p>
        <Badge tone={metric.status === 'ready' ? 'success' : 'warning'}>
          {metric.status === 'ready' ? 'Pronto' : 'Sem base'}
        </Badge>
      </div>
      <p className="mt-3 font-mono text-2xl font-medium tabular-nums text-[var(--color-ink)]">
        {metric.formattedValue}
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
        {metric.comparison.label}
      </p>
    </button>
  )
}

function MetricRow({ metric, onClick }: { metric: AnalyticsMetric; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-canvas)] p-3 text-left transition-colors hover:bg-[var(--color-hover)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--color-ink)]">{metric.name}</span>
        <span className="font-mono text-sm tabular-nums text-[var(--color-ink)]">
          {metric.formattedValue}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
        {metric.description}
      </p>
    </button>
  )
}

function MetricDetail({
  metric,
  drilldown,
}: {
  metric: AnalyticsMetric
  drilldown?: AnalyticsWorkspaceSnapshot['drilldowns'][number]
}) {
  return (
    <aside className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-canvas)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-[var(--color-ink)]">{metric.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {metric.description}
          </p>
        </div>
        <Badge tone={metric.status === 'ready' ? 'success' : 'warning'}>
          {metric.unit}
        </Badge>
      </div>
      <dl className="mt-4 space-y-2 text-xs">
        <Detail label="Origem" value={metric.origin.join(', ')} />
        <Detail label="Fórmula" value={metric.formula} />
        <Detail label="Comparação" value={metric.comparison.label} />
        <Detail label="Filtros" value={metric.filters.join(', ')} />
      </dl>
      {drilldown?.rows.length ? (
        <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-soft)]">
          {drilldown.rows.slice(0, 5).map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-3 gap-2 border-b border-[var(--color-border-soft)] px-3 py-2 text-xs last:border-0"
            >
              {Object.values(row).slice(0, 3).map((value, valueIndex) => (
                <span key={valueIndex} className="truncate text-[var(--color-text-secondary)]">
                  {String(value)}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-text-secondary)]">
          Drill-down preparado. Esta métrica ainda depende de projeção específica para listar detalhes.
        </p>
      )}
    </aside>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-[var(--color-border-soft)] pb-2 last:border-0">
      <dt className="w-24 shrink-0 text-[var(--color-muted)]">{label}</dt>
      <dd className="min-w-0 text-[var(--color-ink)]">{value}</dd>
    </div>
  )
}

function ChartCard({ title, points }: { title: string; points: Array<{ label: string; value: number }> }) {
  const max = Math.max(...points.map((point) => Math.abs(point.value)), 1)
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <h3 className="text-base font-medium text-[var(--color-ink)]">{title}</h3>
      <div className="mt-4 flex h-44 items-end gap-1" role="img" aria-label={title}>
        {points.length ? (
          points.slice(-30).map((point) => (
            <div
              key={point.label}
              title={`${point.label}: ${point.value}`}
              className="min-w-1 flex-1 rounded-t bg-[var(--color-primary)]/80"
              style={{ height: `${Math.max(4, (Math.abs(point.value) / max) * 100)}%` }}
            />
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-soft)] text-xs text-[var(--color-muted)]">
            Sem dados suficientes para gráfico.
          </div>
        )}
      </div>
    </section>
  )
}
