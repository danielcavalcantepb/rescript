import { useNavigate } from '@tanstack/react-router'
import type { PermissionKey } from '@rescript/permissions'
import { usePermission } from '#/platform/permissions'
import { getIcon, type IconName } from '#/platform/icons/catalog'
import { Skeleton } from '#/platform/loading'
import { cn } from '#/lib/utils'

type QuickAction = {
  id: string
  label: string
  icon: IconName
  /** Optional permission gate — omitted actions are always available. */
  permission?: PermissionKey
  run: (ctx: { navigate: (href: string) => void }) => void
}

/** Reuses the same routes + permission grammar as the command palette. */
const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    id: 'new-customer',
    label: 'Novo cliente',
    icon: 'customer',
    permission: 'customers.create',
    run: ({ navigate }) => navigate('/crm/customers/new'),
  },
  {
    id: 'new-product',
    label: 'Novo produto',
    icon: 'product',
    permission: 'products.create',
    run: ({ navigate }) => navigate('/catalog/products/new'),
  },
  {
    id: 'stock-entry',
    label: 'Nova entrada',
    icon: 'inventory',
    permission: 'inventory.move',
    run: ({ navigate }) => navigate('/catalog/inventory/movements/new?kind=entry'),
  },
  {
    id: 'stock-exit',
    label: 'Nova saída',
    icon: 'inventory',
    permission: 'inventory.move',
    run: ({ navigate }) => navigate('/catalog/inventory/movements/new?kind=exit'),
  },
  {
    id: 'stock-adjust',
    label: 'Novo ajuste',
    icon: 'operation',
    permission: 'inventory.adjust',
    run: ({ navigate }) => navigate('/catalog/inventory/movements/new?kind=adjustment'),
  },
  {
    id: 'search',
    label: 'Pesquisar',
    icon: 'search',
    run: () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          ctrlKey: true,
          bubbles: true,
        }),
      )
    },
  },
]

const gridClass =
  'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6'

export function QuickActions() {
  const navigate = useNavigate()
  const { can, status } = usePermission()

  if (status === 'loading') {
    return (
      <div className={gridClass}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px]" />
        ))}
      </div>
    )
  }

  const available = QUICK_ACTIONS.filter(
    (action) => !action.permission || can(action.permission),
  )

  if (available.length === 0) {
    return (
      <p className="text-[12px] text-[var(--color-text-secondary)]">
        Nenhuma ação disponível para o seu perfil nesta organização.
      </p>
    )
  }

  return (
    <div className={gridClass}>
      {available.map((action) => {
        const Icon = getIcon(action.icon)
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => action.run({ navigate: (href) => void navigate({ href }) })}
            className={cn(
              'group flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3 text-left transition-colors duration-[var(--motion-fast)]',
              'hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
            )}
          >
            <span className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Icon className="size-4" strokeWidth={1.6} aria-hidden />
            </span>
            <span className="text-[12px] font-medium text-[var(--color-ink)]">
              {action.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
