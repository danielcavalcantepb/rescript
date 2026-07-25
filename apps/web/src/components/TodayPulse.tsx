import { Link } from '@tanstack/react-router'
import { formatBRL } from '#/lib/format'
import { todayPulse } from '#/mocks/data'
import { icons } from '#/platform/icons/catalog'

/** Compact executive summary for the Decision Center. */
export function TodayPulse() {
  const TrendingUp = icons.trending
  const chips = [
    { label: `${todayPulse.salesCount} venda` },
    { label: `${todayPulse.openOrders} pedido` },
    { label: `${todayPulse.alertCount} alertas` },
  ]

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3">
      <div
        className="pointer-events-none absolute top-3 right-3 flex flex-col gap-[3px] opacity-[0.12]"
        aria-hidden
      >
        <span className="h-[2px] w-4 rounded-full bg-[var(--color-primary)]" />
        <span className="h-[2px] w-4 rounded-full bg-[var(--color-primary)]" />
        <span className="h-[2px] w-4 rounded-full bg-[var(--color-primary)]" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-[var(--color-muted)] uppercase">
            Hoje
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
            <p className="font-mono text-2xl font-medium tracking-tight tabular-nums text-[var(--color-ink)]">
              {formatBRL(todayPulse.salesAmount)}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
              <TrendingUp className="size-3" strokeWidth={1.5} />↑ {todayPulse.deltaPercent}%
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.label}
                className="rounded-[var(--radius-sm)] bg-[var(--color-canvas)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]"
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
        <Link
          to="/vendas"
          className="text-xs font-medium text-[var(--color-primary)] hover:underline"
        >
          Ver vendas
        </Link>
      </div>
    </section>
  )
}
