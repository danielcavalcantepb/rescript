import type { ReactNode } from 'react'
import { Button } from '#/components/ui/button'
import { PageHeader } from '#/components/PageHeader'
import { Badge } from '#/components/ui/badge'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { EmptyState } from '#/components/EmptyState'
import { formatDateTime } from '#/lib/format'
import { cn } from '#/lib/utils'
import { icons } from '#/platform/icons/catalog'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { RequirePermission } from '#/platform/permissions'
import type {
  CommandAlert,
  CommandCenterSnapshot,
  CommandCenterStatus,
  CommandInsight,
  CommandKpi,
  CommandPriority,
  HealthSignal,
  OperationStage,
  PriorityLevel,
} from '#/modules/command-center/domain/types'
import { useCommandCenter } from '../use-command-center'

const statusTone: Record<
  CommandCenterStatus,
  'neutral' | 'info' | 'warning' | 'success' | 'danger'
> = {
  good: 'success',
  attention: 'warning',
  critical: 'danger',
  unknown: 'neutral',
}

const statusLabel: Record<CommandCenterStatus, string> = {
  good: 'Sob controle',
  attention: 'Atenção',
  critical: 'Crítico',
  unknown: 'Sem base',
}

const levelTone: Record<PriorityLevel, 'neutral' | 'info' | 'warning' | 'danger'> = {
  info: 'info',
  attention: 'warning',
  critical: 'danger',
}

const levelLabel: Record<PriorityLevel, string> = {
  info: 'Informação',
  attention: 'Atenção',
  critical: 'Crítico',
}

export function CommandCenterPage() {
  return (
    <RequirePermission
      permission="insights.view"
      forbiddenDescription="Você não tem acesso à inteligência operacional desta organização."
    >
      <CommandCenterContent />
    </RequirePermission>
  )
}

function CommandCenterContent() {
  const query = useCommandCenter()

  if (query.isLoading) {
    return <PageLoading label="Analisando operação…" />
  }

  if (query.isError) {
    return <PageError error={query.error} onRetry={() => void query.refetch()} />
  }

  if (!query.data) {
    return (
      <EmptyState
        icon="central"
        title="Centro de Comando indisponível"
        description="Não foi possível compor a visão operacional agora."
      />
    )
  }

  return (
    <CommandCenterWorkspace
      data={query.data}
      isRefreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
    />
  )
}

export function CommandCenterWorkspace({
  data,
  isRefreshing = false,
  onRefresh,
}: {
  data: CommandCenterSnapshot
  isRefreshing?: boolean
  onRefresh?: () => void
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Centro de Comando"
        description="Métricas e inteligência operacional para decidir o que fazer hoje."
        actions={
          <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Atualizando…' : 'Atualizar'}
          </Button>
        }
      />

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-[var(--color-primary)] uppercase">
              Leitura executiva
            </p>
            <h2 className="mt-1 text-2xl font-medium tracking-tight text-[var(--color-ink)] md:text-3xl">
              {data.priorities.some((item) => item.level === 'critical')
                ? 'Sua empresa precisa de decisão agora.'
                : data.priorities.length
                  ? 'Há pontos importantes para acompanhar hoje.'
                  : 'A operação está sob controle.'}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              A Central cruza vendas, estoque, clientes e financeiro sem alterar
              dados. Última leitura: {formatDateTime(data.generatedAt)}.
            </p>
          </div>
          <Badge tone={data.alerts.some((alert) => alert.category === 'critical') ? 'danger' : 'success'}>
            {data.alerts.length ? `${data.alerts.length} alerta(s)` : 'Sem alertas críticos'}
          </Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.health.map((signal) => (
            <HealthCard key={signal.id} signal={signal} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Prioridades"
          description="Poucos cartões, ordenados por impacto e urgência."
        >
          {data.priorities.length ? (
            <div className="space-y-3">
              {data.priorities.map((item) => (
                <PriorityCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <AllClear />
          )}
        </Panel>

        <Panel title="Alertas" description="Fatos que merecem acompanhamento.">
          {data.alerts.length ? (
            <div className="space-y-2">
              {data.alerts.map((item) => (
                <AlertCard key={item.id} alert={item} />
              ))}
            </div>
          ) : (
            <AllClear compact />
          )}
        </Panel>
      </section>

      <section>
        <SectionTitle
          title="KPIs principais"
          description="Cada indicador mostra período, comparação e contexto."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.kpis.map((item) => (
            <KpiCard key={item.id} kpi={item} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Fluxo operacional" description="Do pedido ao caixa.">
          <div className="space-y-3">
            {data.operation.map((stage, index) => (
              <OperationRow
                key={stage.id}
                stage={stage}
                isLast={index === data.operation.length - 1}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Insights" description="Conclusões textuais, rastreáveis e sem IA.">
          <div className="space-y-3">
            {data.insights.map((item) => (
              <InsightRow key={item.id} insight={item} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <SummaryPanel
          title="Financeiro"
          rows={[
            ['Entradas hoje', data.financial.expectedInToday],
            ['Saídas hoje', data.financial.expectedOutToday],
            ['Saldo previsto', data.financial.expectedBalanceToday],
            ['Recebíveis vencidos', data.financial.overdueReceivables],
            ['Pagamentos vencidos', data.financial.overduePayables],
            ['Receitas do mês', data.financial.monthRevenue],
            ['Despesas do mês', data.financial.monthExpenses],
            ['Fluxo', data.financial.cashFlow],
          ]}
        />
        <SummaryPanel
          title="Estoque"
          rows={[
            ['Valor total', data.inventory.totalValue],
            ['Produtos críticos', String(data.inventory.criticalProducts)],
            ['Sem giro', String(data.inventory.noMovementProducts)],
            ['Cobertura', data.inventory.coverage],
            ['Reposição necessária', String(data.inventory.replenishmentNeeded)],
            ['Itens negativos', String(data.inventory.negativeItems)],
            ['Curva ABC', data.inventory.abcCurve],
            ['Giro', data.inventory.turnover],
          ]}
        />
        <SummaryPanel
          title="Comercial"
          rows={[
            ['Receita', data.commercial.revenue],
            ['Pedidos', String(data.commercial.orders)],
            ['Ticket', data.commercial.ticket],
            ['Conversão', data.commercial.conversion],
            ['Clientes novos', String(data.commercial.newCustomers)],
            ['Recorrentes', String(data.commercial.recurringCustomers)],
            ['Top clientes', data.commercial.topCustomers.join(', ')],
            ['Top produtos', data.commercial.topProducts.join(', ')],
          ]}
        />
      </section>

      {data.dataGaps.length ? (
        <Panel
          title="Dados insuficientes"
          description="A Central declara lacunas em vez de inventar precisão."
        >
          <EntityTable headers={['Lacuna', 'Por que importa', 'Próximo passo']}>
            {data.dataGaps.map((gap) => (
              <EntityRow key={gap.id}>
                <EntityCell className="font-medium">{gap.title}</EntityCell>
                <EntityCell>{gap.description}</EntityCell>
                <EntityCell>
                  <a
                    href={gap.href}
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    Abrir
                  </a>
                </EntityCell>
              </EntityRow>
            ))}
          </EntityTable>
        </Panel>
      ) : null}
    </div>
  )
}

function HealthCard({ signal }: { signal: HealthSignal }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-canvas)]/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-[var(--color-ink)]">{signal.label}</h3>
        <Badge tone={statusTone[signal.status]}>{statusLabel[signal.status]}</Badge>
      </div>
      <p className="mt-2 font-mono text-2xl font-medium tabular-nums text-[var(--color-ink)]">
        {signal.score == null ? '—' : signal.score}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        {signal.description}
      </p>
      <p className="mt-2 text-[11px] text-[var(--color-muted)]">{signal.trend}</p>
    </article>
  )
}

function PriorityCard({ item }: { item: CommandPriority }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={levelTone[item.level]}>{levelLabel[item.level]}</Badge>
            <span className="text-xs text-[var(--color-muted)]">{item.impact}</span>
          </div>
          <h3 className="mt-2 text-sm font-medium text-[var(--color-ink)]">
            {item.title}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            {item.description}
          </p>
          <p className="mt-2 text-xs text-[var(--color-ink)]">
            {item.suggestedAction}
          </p>
        </div>
        <Button asChild variant="secondary" size="sm" className="shrink-0">
          <a href={item.href}>Abrir</a>
        </Button>
      </div>
    </article>
  )
}

function KpiCard({ kpi }: { kpi: CommandKpi }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3">
      <p className="text-[11px] font-medium tracking-wide text-[var(--color-muted)] uppercase">
        {kpi.label}
      </p>
      <p className="mt-2 font-mono text-xl font-medium tracking-tight tabular-nums text-[var(--color-ink)]">
        {kpi.value}
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
        {kpi.comparison}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[var(--color-muted)]">
        <span>{kpi.variation}</span>
        <span>{kpi.period}</span>
      </div>
    </article>
  )
}

function OperationRow({
  stage,
  isLast,
}: {
  stage: OperationStage
  isLast: boolean
}) {
  const ChevronRight = icons.chevronRight
  return (
    <div className="flex items-center gap-3">
      <a
        href={stage.href}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2.5 transition-colors hover:bg-[var(--color-hover)]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone={statusTone[stage.status]}>{statusLabel[stage.status]}</Badge>
            <h3 className="text-sm font-medium text-[var(--color-ink)]">
              {stage.label}
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {stage.quantity} registro(s) · {stage.value} · {stage.pending}
          </p>
        </div>
      </a>
      {!isLast ? (
        <ChevronRight className="hidden size-4 shrink-0 text-[var(--color-muted)] sm:block" />
      ) : null}
    </div>
  )
}

function InsightRow({ insight }: { insight: CommandInsight }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={levelTone[insight.level]}>{levelLabel[insight.level]}</Badge>
        <span className="text-[11px] text-[var(--color-muted)]">
          {insight.nature === 'fact'
            ? 'Fato'
            : insight.nature === 'projection'
              ? 'Projeção'
              : 'Recomendação'}
        </span>
        <span className="text-[11px] text-[var(--color-muted)]">
          Confiança {insight.confidence}
        </span>
      </div>
      <h3 className="mt-2 text-sm font-medium text-[var(--color-ink)]">
        {insight.title}
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        {insight.description}
      </p>
      <p className="mt-2 text-[11px] text-[var(--color-muted)]">
        Origem: {insight.evidence}
      </p>
      <a
        href={insight.href}
        className="mt-2 inline-flex text-xs font-medium text-[var(--color-primary)] hover:underline"
      >
        Ver origem
      </a>
    </article>
  )
}

function AlertCard({ alert }: { alert: CommandAlert }) {
  return (
    <a
      href={alert.href}
      className="block rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-hover)]"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone={levelTone[alert.category]}>{alert.priority}</Badge>
        <span className="text-[11px] text-[var(--color-muted)]">
          {formatDateTime(alert.date)}
        </span>
      </div>
      <h3 className="mt-2 text-sm font-medium text-[var(--color-ink)]">
        {alert.title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        {alert.description}
      </p>
      <p className="mt-2 text-[11px] text-[var(--color-muted)]">
        Origem: {alert.origin}
      </p>
    </a>
  )
}

function SummaryPanel({
  title,
  rows,
}: {
  title: string
  rows: Array<[string, string]>
}) {
  return (
    <Panel title={title}>
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-3 border-b border-[var(--color-border-soft)] pb-2 last:border-0 last:pb-0"
          >
            <dt className="text-xs text-[var(--color-text-secondary)]">{label}</dt>
            <dd className="max-w-[55%] text-right text-xs font-medium text-[var(--color-ink)]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <SectionTitle title={title} description={description} />
      <div className="mt-3">{children}</div>
    </section>
  )
}

function SectionTitle({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div>
      <h2 className="text-base font-medium text-[var(--color-ink)]">{title}</h2>
      {description ? (
        <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
          {description}
        </p>
      ) : null}
    </div>
  )
}

function AllClear({ compact = false }: { compact?: boolean }) {
  const Check = icons.check
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-canvas)] p-4',
        compact && 'p-3',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)]">
          <Check className="size-4 text-[var(--color-primary)]" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">
            Tudo sob controle
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Nenhum item crítico apareceu nas regras atuais.
          </p>
        </div>
      </div>
    </div>
  )
}
