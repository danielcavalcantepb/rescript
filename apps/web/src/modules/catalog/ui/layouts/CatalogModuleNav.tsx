import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '#/lib/utils'

const items: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/catalog', label: 'Visão geral', end: true },
  { to: '/catalog/products', label: 'Produtos' },
  { to: '/catalog/categories', label: 'Categorias' },
  { to: '/catalog/brands', label: 'Marcas' },
  { to: '/catalog/price-lists', label: 'Listas de preço' },
  { to: '/catalog/inventory', label: 'Estoque' },
  { to: '/catalog/attributes', label: 'Atributos' },
]

export function CatalogModuleNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav
      className="mb-5 flex gap-1 overflow-x-auto border-b border-[var(--color-border-soft)] pb-px"
      aria-label="Navegação do catálogo"
    >
      {items.map((item) => {
        const active = item.end
          ? pathname === item.to
          : pathname === item.to || pathname.startsWith(`${item.to}/`)
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-t-[var(--radius-md)] px-3 py-2 text-[13px]',
              'transition-colors duration-[var(--motion-fast)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
              active
                ? 'border-b-2 border-[var(--color-primary)] font-medium text-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-ink)]',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
