import { Link, useRouterState } from '@tanstack/react-router'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { OrganizationSwitcher } from '#/platform/organization/organization-switcher'
import { icons } from '#/platform/icons/catalog'
import { cn } from '#/lib/utils'
import { usePermission } from '#/platform/permissions'

const links = [
  { to: '/app', label: 'Centro de Comando', icon: icons.central },
  { to: '/analytics', label: 'Métricas', icon: icons.trending },
  { to: '/catalog/products', label: 'Produtos', icon: icons.product },
  { to: '/crm/customers', label: 'Clientes', icon: icons.customer },
  { to: '/procurement/purchases', label: 'Compras', icon: icons.product },
  { to: '/procurement/suppliers', label: 'Fornecedores', icon: icons.customer },
  { to: '/catalog/inventory/items', label: 'Estoque', icon: icons.inventory },
  { to: '/finance', label: 'Financeiro', icon: icons.finance },
  { to: '/sales/orders', label: 'Vendas', icon: icons.sale },
] as const

const soon = [
  { key: 'importacoes', label: 'Importar', icon: icons.import },
  { key: 'config', label: 'Configurações', icon: icons.settings },
] as const

export function Sidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const { canAny } = usePermission()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const PanelOpen = icons.panelOpen
  const PanelClose = icons.panelClose

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[var(--color-border-soft)] bg-[var(--color-surface)] transition-[width] duration-[var(--motion-base)] ease-[var(--ease-out)]',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div
        className={cn(
          'border-b border-[var(--color-border-soft)]',
          collapsed
            ? 'flex flex-col items-center gap-2 px-2 py-4'
            : 'flex flex-col px-4 pt-4 pb-0',
        )}
      >
        <Link
          to="/app"
          onClick={onNavigate}
          className={cn(
            'block min-w-0 rounded-[var(--radius-sm)] transition-opacity duration-[var(--motion-fast)] hover:opacity-[var(--opacity-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
            collapsed ? 'flex justify-center' : 'w-full',
          )}
          aria-label="Rescript — Central"
        >
          <RescriptLogo variant={collapsed ? 'sidebar-collapsed' : 'sidebar'} />
        </Link>
        <OrganizationSwitcher collapsed={collapsed} />
      </div>

      <nav
        className={cn('flex-1 space-y-0.5', collapsed ? 'p-1.5' : 'p-2 pt-2.5')}
        aria-label="Navegação principal"
      >
        {links.filter((item) =>
          item.to !== '/finance' ||
          canAny(['receivables.read', 'payable.read', 'payments.read']),
        ).map((item) => {
          const active =
            item.to === '/app'
              ? pathname === '/app'
              : pathname === item.to || pathname.startsWith(`${item.to}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center rounded-[var(--radius-md)] text-[13px]',
                'transition-[color,background-color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface)]',
                'active:scale-[0.99]',
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2',
                active
                  ? 'bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]',
              )}
            >
              <Icon className="size-3.5 shrink-0" strokeWidth={1.5} />
              {!collapsed ? item.label : null}
            </Link>
          )
        })}
        {soon.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.key}
              title={collapsed ? `${item.label} (em breve)` : 'Em breve'}
              aria-disabled="true"
              className={cn(
                'flex items-center rounded-[var(--radius-md)] text-[13px] text-[var(--color-muted)] opacity-[var(--opacity-disabled)]',
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2',
              )}
            >
              <Icon className="size-3.5 shrink-0" strokeWidth={1.5} />
              {!collapsed ? <span>{item.label}</span> : null}
            </div>
          )
        })}
      </nav>

      {onToggleCollapse ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'hidden items-center border-t border-[var(--color-border-soft)] text-[var(--color-muted)] lg:flex',
            'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)]',
            'hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus)]',
            collapsed ? 'justify-center px-0 py-3' : 'gap-2 px-3 py-3 text-xs',
          )}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelOpen className="size-3.5" strokeWidth={1.5} />
          ) : (
            <>
              <PanelClose className="size-3.5" strokeWidth={1.5} />
              Recolher
            </>
          )}
        </button>
      ) : null}
    </aside>
  )
}
