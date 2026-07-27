import { Link } from '@tanstack/react-router'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { useBrands } from '#/modules/catalog/ui/hooks/use-catalog-brands'
import { useCategories } from '#/modules/catalog/ui/hooks/use-catalog-categories'
import { useCatalogProducts } from '#/modules/catalog/ui/hooks/use-catalog-products'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'

const sections = [
  { to: '/catalog/products', title: 'Produtos', description: 'Produtos, variantes, preços e lifecycle.' },
  { to: '/catalog/categories', title: 'Categorias', description: 'Categorias e subcategorias hierárquicas.' },
  { to: '/catalog/brands', title: 'Marcas', description: 'Marcas reutilizáveis no cadastro e nos filtros.' },
  { to: '/catalog/price-lists', title: 'Listas de preço', description: 'Preços vigentes por variante.' },
  { to: '/catalog/inventory', title: 'Estoque', description: 'Locais, disponibilidade e ledger por variante.' },
  { to: '/catalog/attributes', title: 'Atributos', description: 'Eixos e opções das variantes.' },
] as const

export function CatalogHomePage() {
  const { currentOrganization, isLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const enabled = currentOrganization?.status === 'active'
  const allProducts = useCatalogProducts(organizationId, { page: 1, pageSize: 1, status: 'all' }, enabled)
  const activeProducts = useCatalogProducts(organizationId, { page: 1, pageSize: 1, status: 'active' }, enabled)
  const brands = useBrands(organizationId, enabled)
  const categories = useCategories(organizationId, enabled)

  if (isLoading || !organizationId) return <PageLoading label="Carregando catálogo…" />

  const metrics = [
    { label: 'Produtos', value: allProducts.data?.total ?? 0 },
    { label: 'Produtos ativos', value: activeProducts.data?.total ?? 0 },
    { label: 'Marcas', value: brands.data?.length ?? 0 },
    { label: 'Categorias', value: categories.data?.length ?? 0 },
  ]

  return (
    <CatalogShell
      title="Catálogo"
      description="Produtos, classificação, preços e disponibilidade em um único contexto."
      breadcrumb={[{ label: 'Central', href: '/' }, { label: 'Catálogo' }]}
    >
      <CatalogToolbar
        title="Visão geral"
        description="Acompanhe a estrutura atual do catálogo e acesse diretamente cada área."
      />
      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores do catálogo">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
            <p className="text-[12px] text-[var(--color-text-secondary)]">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--color-ink)]">{metric.value}</p>
          </article>
        ))}
      </section>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <li key={section.to}>
            <Link
              to={section.to}
              className="block h-full rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-4 transition-colors duration-[var(--motion-fast)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            >
              <span className="block text-[14px] font-medium text-[var(--color-ink)]">{section.title}</span>
              <span className="mt-1 block text-[13px] text-[var(--color-text-secondary)]">{section.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </CatalogShell>
  )
}
