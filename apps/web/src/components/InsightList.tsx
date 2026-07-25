import { useMemo, useState } from 'react'
import { InsightCard } from '#/components/InsightCard'
import { icons } from '#/platform/icons/catalog'
import { cn } from '#/lib/utils'
import type { InsightCategory, MockInsight } from '#/mocks/data'

const INITIAL = 6
const STEP = 6

const CATEGORY_ORDER: InsightCategory[] = [
  'Estoque',
  'Financeiro',
  'Clientes',
  'Vendas',
  'Operação',
]

export function InsightList({
  items,
  grouped = false,
}: {
  items: MockInsight[]
  grouped?: boolean
}) {
  const [visible, setVisible] = useState(INITIAL)
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.priority - b.priority),
    [items],
  )

  if (!grouped) {
    const slice = sorted.slice(0, visible)
    const remaining = sorted.length - visible
    return (
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)]">
        {slice.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
        {remaining > 0 ? (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 border-t border-[var(--color-border-soft)] px-3 py-2 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-canvas)]"
            onClick={() => setVisible((v) => v + STEP)}
          >
            Mostrar mais ({remaining})
          </button>
        ) : null}
        {visible > INITIAL && remaining <= 0 ? (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 border-t border-[var(--color-border-soft)] px-3 py-2 text-xs text-[var(--color-muted)] hover:bg-[var(--color-canvas)]"
            onClick={() => setVisible(INITIAL)}
          >
            Ver menos
          </button>
        ) : null}
      </div>
    )
  }

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    items: sorted.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-2">
      {byCategory.map((group) => (
        <InsightGroup key={group.category} category={group.category} items={group.items} />
      ))}
    </div>
  )
}

function InsightGroup({
  category,
  items,
}: {
  category: InsightCategory
  items: MockInsight[]
}) {
  const [open, setOpen] = useState(false)
  const ChevronDown = icons.chevronDown

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[var(--color-canvas)]/60"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
          {category}
          <span className="ml-2 tabular-nums text-[var(--color-text-secondary)]">
            {items.length}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 text-[var(--color-muted)] transition-transform',
            open && 'rotate-180',
          )}
          strokeWidth={1.5}
        />
      </button>
      {open ? (
        <div className="border-t border-[var(--color-border-soft)]">
          {items.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
