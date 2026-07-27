import { HomeBlock, BlockEmpty } from '#/components/home/home-block'
import { getIcon, type IconName } from '#/platform/icons/catalog'

/**
 * Activity feed contract. Future modules will persist real events (customer
 * created, product edited, movement registered, org switched) and this block
 * will render them as a timeline. No fabricated activity is shown.
 */
export type ActivityItem = {
  id: string
  title: string
  meta?: string
  icon?: IconName
  timestamp: string
}

export function RecentActivity({
  items = [],
}: {
  items?: readonly ActivityItem[]
}) {
  return (
    <HomeBlock
      title="Atividades recentes"
      hint="O histórico da sua operação"
    >
      {items.length === 0 ? (
        <BlockEmpty
          title="Ainda sem atividade registrada"
          description="Assim que você cadastrar clientes, produtos ou movimentar estoque, o histórico aparece aqui."
        />
      ) : (
        <ol className="relative flex flex-col">
          {items.map((item, index) => (
            <ActivityRow
              key={item.id}
              item={item}
              last={index === items.length - 1}
            />
          ))}
        </ol>
      )}
    </HomeBlock>
  )
}

function ActivityRow({ item, last }: { item: ActivityItem; last: boolean }) {
  const Icon = item.icon ? getIcon(item.icon) : null
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last ? (
        <span
          className="absolute top-7 bottom-0 left-[13px] w-px bg-[var(--color-border)]"
          aria-hidden
        />
      ) : null}
      <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface)] text-[var(--color-muted)]">
        {Icon ? <Icon className="size-3.5" strokeWidth={1.6} aria-hidden /> : null}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="truncate text-[13px] text-[var(--color-ink)]">
          {item.title}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
          {item.meta ? `${item.meta} · ` : ''}
          {item.timestamp}
        </p>
      </div>
    </li>
  )
}
