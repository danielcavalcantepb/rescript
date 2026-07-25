import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { icons, type AppIcon } from '#/platform/icons/catalog'
import type { InsightCategory, MockInsight } from '#/mocks/data'

const categoryIcon: Record<InsightCategory, AppIcon> = {
  Estoque: icons.product,
  Financeiro: icons.finance,
  Clientes: icons.customer,
  Vendas: icons.sale,
  Operação: icons.operation,
}

const severityDot = {
  alta: 'bg-[var(--color-danger)]',
  media: 'bg-[var(--color-warning)]',
  baixa: 'bg-[var(--color-muted)]',
} as const

const statusLabel = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  novo: 'Novo',
} as const

/** Compact insight row — details on demand only. */
export function InsightCard({ insight }: { insight: MockInsight }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const Icon = categoryIcon[insight.category]
  const ChevronDown = icons.chevronDown

  return (
    <article
      className={cn(
        'group border-b border-[var(--color-border-soft)] last:border-0',
        'bg-[var(--color-surface)]',
      )}
    >
      <div className="flex items-start gap-3 px-3 py-2.5">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-canvas)]">
          <Icon className="size-3.5 text-[var(--color-primary)]" strokeWidth={1.5} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn('size-1.5 shrink-0 rounded-full', severityDot[insight.severity])}
                  title={`Prioridade ${insight.severity}`}
                />
                <h3 className="truncate text-sm font-medium text-[var(--color-ink)]">
                  {insight.title}
                </h3>
              </div>
              <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                {insight.summary}
                <span className="text-[var(--color-muted)]"> · </span>
                <span className="text-[var(--color-ink)]">{insight.impact}</span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => void navigate({ href: insight.ctaHref })}
              >
                {insight.ctaLabel}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                Dispensar
              </Button>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-muted)]">
            <span>{insight.category}</span>
            <span>Confiança {insight.confidence}</span>
            <span>{statusLabel[insight.status]}</span>
            <button
              type="button"
              className="inline-flex items-center gap-0.5 text-[var(--color-primary)] hover:underline"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              Por quê?
              <ChevronDown
                className={cn('size-3 transition-transform', open && 'rotate-180')}
                strokeWidth={1.5}
              />
            </button>
          </div>

          {open ? (
            <div className="mt-2 rounded-[var(--radius-sm)] bg-[var(--color-canvas)] px-2.5 py-2 text-xs text-[var(--color-text-secondary)]">
              <p>{insight.explanation}</p>
              <p className="mt-1 text-[11px] text-[var(--color-muted)]">{insight.source}</p>
              <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                Tipo: {insight.type} · Prioridade #{insight.priority}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function InsightAllClear() {
  const Check = icons.check
  return (
    <div className="mb-2 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2.5">
      <div className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)]">
        <Check className="size-3.5 text-[var(--color-primary)]" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-ink)]">Tudo sob controle</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Nenhum risco encontrado agora.
        </p>
      </div>
    </div>
  )
}
