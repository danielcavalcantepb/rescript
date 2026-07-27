import { Link } from '@tanstack/react-router'
import { RequirePermission } from '#/platform/permissions'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'

const sections = [
  {
    to: '/catalog/inventory/locations',
    title: 'Locais',
    description: 'Stock Locations — padrão, prioridade, ativação e arquivo.',
  },
  {
    to: '/catalog/inventory/items',
    title: 'Itens',
    description: 'Inventory Items por variante × local (identidade; saldo via ledger).',
  },
  {
    to: '/catalog/inventory/movements',
    title: 'Movimentações',
    description: 'Ledger — entradas, saídas, ajustes, transferências e estornos.',
  },
  {
    to: '/catalog/inventory/reservations',
    title: 'Reservas',
    description: 'Compromissos de saldo por pedido de venda; não baixam estoque.',
  },
  {
    to: '/catalog/inventory/pickings',
    title: 'Separações',
    description: 'Picking físico dos itens reservados; não baixa estoque.',
  },
  {
    to: '/catalog/inventory/packings',
    title: 'Embalagens',
    description: 'Packing dos itens separados; não baixa estoque nem gera expedição.',
  },
  {
    to: '/catalog/inventory/shipments',
    title: 'Expedições',
    description: 'Shipment dos itens embalados; baixa estoque apenas no despacho.',
  },
] as const

export function InventoryHomePage() {
  return (
    <RequirePermission
      permission="inventory.read"
      forbiddenDescription="Você não tem permissão para ver estoque."
    >
      <CatalogShell
        title="Estoque"
        description="Inventory Foundation — locais, itens, ledger, reservas, separações, embalagens e expedições."
        breadcrumb={[
          { label: 'Central', href: '/' },
          { label: 'Catálogo', href: '/catalog' },
          { label: 'Estoque' },
        ]}
      >
        <CatalogToolbar
          title="Fundação"
          description="Saldo projetado pelo ledger, reservas separadas de movimentos físicos, picking, packing e dispatch controlado por Shipment."
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {sections.map((section) => (
            <li key={section.to}>
              <Link
                to={section.to}
                className="block rounded-[var(--radius-md)] border border-[var(--color-border-soft)] px-4 py-3 transition-colors duration-[var(--motion-fast)] hover:bg-[var(--color-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
              >
                <span className="block text-[14px] font-medium text-[var(--color-ink)]">
                  {section.title}
                </span>
                <span className="mt-0.5 block text-[13px] text-[var(--color-text-secondary)]">
                  {section.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CatalogShell>
    </RequirePermission>
  )
}
