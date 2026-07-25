import { Link, useRouterState } from '@tanstack/react-router'
import { RescriptLogo } from '#/components/brand/RescriptLogo'
import { OrganizationSwitcher } from '#/platform/organization/organization-switcher'
import { icons } from '#/platform/icons/catalog'
import { cn } from '#/lib/utils'

const links = [
  { to: '/', label: 'Central', icon: icons.central },
  { to: '/clientes', label: 'Clientes', icon: icons.customer },
  { to: '/produtos', label: 'Produtos', icon: icons.product },
  { to: '/vendas', label: 'Vendas', icon: icons.sale },
] as const

const soon = [
  { key: 'estoque', label: 'Estoque', icon: icons.inventory },
  { key: 'financeiro', label: 'Financeiro', icon: icons.finance },
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
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const PanelOpen = icons.panelOpen
  const PanelClose = icons.panelClose

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[var(--color-border-soft)] bg-[var(--color-surface)] transition-[width] duration-[var(--motion-base)]',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div
        className={cn(
          'border-b border-[var(--color-border-soft)]',
          collapsed ? 'flex flex-col items-center gap-2 px-2 py-4' : 'flex flex-col px-4 pt-4 pb-0',
        )}
      >
        <Link
          to="/"
          onClick={onNavigate}
          className={cn(
            'block min-w-0',
            collapsed ? 'flex justify-center' : 'w-full',
          )}
          aria-label="Rescript — Central"
        >
          <RescriptLogo variant={collapsed ? 'sidebar-collapsed' : 'sidebar'} />
        </Link>
        <OrganizationSwitcher collapsed={collapsed} />
      </div>

      <nav className={cn('flex-1 space-y-0.5', collapsed ? 'p-1.5' : 'p-2 pt-2.5')}>
        {links.map((item) => {
          const active =
            item.to === '/'
              ? pathname === '/'
              : pathname === item.to || pathname.startsWith(`${item.to}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-[var(--radius-md)] text-[13px] transition-colors duration-[var(--motion-fast)]',
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2',
                active
                  ? 'bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]',
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
            'hidden items-center border-t border-[var(--color-border-soft)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)] lg:flex',
            collapsed ? 'justify-center px-0 py-3' : 'gap-2 px-3 py-3 text-xs',
          )}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
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
