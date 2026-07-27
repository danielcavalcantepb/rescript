import { Link } from '@tanstack/react-router'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'

const sections = [
  {
    to: '/catalog/products',
    title: 'Produtos',
    description: 'Lista read-only do catálogo comercial.',
  },
  {
    to: '/catalog/categories',
    title: 'Categorias',
    description: 'Estrutura de categorias (próximas sprints).',
  },
  {
    to: '/catalog/brands',
    title: 'Marcas',
    description: 'Marcas do catálogo (próximas sprints).',
  },
  {
    to: '/catalog/price-lists',
    title: 'Listas de preço',
    description: 'Listas e preços base (próximas sprints).',
  },
  {
    to: '/catalog/inventory',
    title: 'Estoque',
    description: 'Locais e itens de estoque por variante.',
  },
  {
    to: '/catalog/attributes',
    title: 'Atributos',
    description: 'Atributos e opções (próximas sprints).',
  },
] as const

export function CatalogHomePage() {
  return (
    <CatalogShell
      title="Catálogo"
      description="Fundação do módulo Catalog — navegação e leitura."
      breadcrumb={[{ label: 'Central', href: '/' }, { label: 'Catálogo' }]}
    >
      <CatalogToolbar
        title="Visão geral"
        description="Escolha uma área do catálogo. Nesta sprint apenas a lista de produtos é funcional (somente leitura)."
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
  )
}
