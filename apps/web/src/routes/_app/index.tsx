import { createFileRoute } from '@tanstack/react-router'
import { InsightAllClear } from '#/components/InsightCard'
import { InsightList } from '#/components/InsightList'
import { MetricCard } from '#/components/MetricCard'
import { SectionHeader } from '#/components/SectionHeader'
import { TodayPulse } from '#/components/TodayPulse'
import { formatBRL } from '#/lib/format'
import { insights, todayPulse } from '#/mocks/data'
import { useSession } from '#/providers/app-session'

export const Route = createFileRoute('/_app/')({
  component: CentralDecisionPage,
})

function CentralDecisionPage() {
  const { authUser } = useSession()
  const actionable = insights
    .filter((i) => i.block !== 'gap')
    .sort((a, b) => a.priority - b.priority)
  const gaps = insights.filter((i) => i.block === 'gap')
  const attentionEmpty = !actionable.some((i) => i.block === 'attention')
  const additional = actionable.filter((i) => i.priority > 6)
  const firstName =
    authUser?.displayName.split(' ')[0] ??
    authUser?.email.split('@')[0] ??
    'olá'

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-4">
        <p className="text-xs text-[var(--color-text-secondary)]">
          Bom dia, {firstName}
        </p>
        <h1 className="mt-0.5 text-xl font-medium tracking-tight text-[var(--color-ink)]">
          Central de Decisão
        </h1>
      </header>

      {/* 1. Resumo executivo */}
      <TodayPulse />

      {/* 2. KPIs — sempre no primeiro viewport */}
      <section className="mt-4">
        <SectionHeader title="Visão geral" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Vendas do mês" value={formatBRL(todayPulse.monthSales)} />
          <MetricCard label="Ticket médio" value={formatBRL(todayPulse.avgTicket)} />
          <MetricCard label="Recebido hoje" value={formatBRL(todayPulse.receivedToday)} />
          <MetricCard
            label="Vencido"
            value={formatBRL(todayPulse.overdueAmount)}
            hint={`Margem ~${(todayPulse.estimatedMargin * 100).toFixed(0)}%`}
          />
        </div>
      </section>

      {/* 3. Insights prioritários — lista inteligente, máx. 6 + mostrar mais */}
      <section className="mt-6">
        <SectionHeader title="Insights prioritários" />
        {attentionEmpty ? <InsightAllClear /> : null}
        <div className={attentionEmpty ? 'mt-2' : undefined}>
          <InsightList items={actionable} />
        </div>
      </section>

      {/* 4. Insights adicionais — agrupados por categoria */}
      {additional.length > 0 ? (
        <section className="mt-6">
          <SectionHeader title="Insights adicionais" />
          <InsightList items={additional} grouped />
        </section>
      ) : null}

      {/* 5. Dados insuficientes */}
      <section className="mt-6 mb-2">
        <SectionHeader title="Dados insuficientes" />
        <InsightList items={gaps} />
      </section>
    </div>
  )
}
