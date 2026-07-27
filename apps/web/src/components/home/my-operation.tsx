import { HomeBlock, BlockEmpty } from '#/components/home/home-block'
import { getIcon, type IconName } from '#/platform/icons/catalog'
import { cn } from '#/lib/utils'

/**
 * A single actionable item that needs the user's attention.
 * This is the contract future modules (Inventory, Sales, ...) will emit —
 * the block renders whatever real items it receives, and nothing when empty.
 */
export type OperationItem = {
  id: string
  label: string
  detail?: string
  icon?: IconName
  tone?: 'neutral' | 'warning'
  href?: string
  onSelect?: () => void
}

export function MyOperation({
  items = [],
}: {
  items?: readonly OperationItem[]
}) {
  return (
    <HomeBlock
      title="Minha operação"
      hint="O que precisa da sua atenção agora"
    >
      {items.length === 0 ? (
        <BlockEmpty
          title="Tudo em ordem por aqui"
          description="Quando algo precisar da sua atenção — estoque, cadastros ou pendências — aparece neste painel."
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <OperationRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </HomeBlock>
  )
}

function OperationRow({ item }: { item: OperationItem }) {
  const Icon = item.icon ? getIcon(item.icon) : null
  const interactive = Boolean(item.href || item.onSelect)

  const content = (
    <>
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]',
          item.tone === 'warning'
            ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
            : 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
        )}
      >
        {Icon ? <Icon className="size-4" strokeWidth={1.6} aria-hidden /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[var(--color-ink)]">
          {item.label}
        </span>
        {item.detail ? (
          <span className="block truncate text-[12px] text-[var(--color-text-secondary)]">
            {item.detail}
          </span>
        ) : null}
      </span>
    </>
  )

  return (
    <li>
      {interactive ? (
        <button
          type="button"
          onClick={item.onSelect}
          className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 text-left transition-colors duration-[var(--motion-fast)] hover:bg-[var(--color-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
        >
          {content}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-2 py-2">{content}</div>
      )}
    </li>
  )
}
