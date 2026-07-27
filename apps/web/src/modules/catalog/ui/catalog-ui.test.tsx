import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { CatalogProductListItemResponse } from '#/modules/catalog/application'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogFilters } from '#/modules/catalog/ui/components/CatalogFilters'
import { CatalogPagination } from '#/modules/catalog/ui/components/CatalogPagination'
import { CatalogSearchInput } from '#/modules/catalog/ui/components/CatalogSearchInput'
import { CatalogStatusBadge } from '#/modules/catalog/ui/components/CatalogStatusBadge'
import { CatalogTable } from '#/modules/catalog/ui/components/CatalogTable'
import { CatalogEmptyState } from '#/modules/catalog/ui/empty-states/CatalogEmptyState'
import {
  defaultCatalogProductFilters,
  toListCatalogProductsQuery,
} from '#/modules/catalog/ui/filters/catalog-filter-state'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'

const routerState = vi.hoisted(() => ({
  pathname: '/catalog/products',
}))

vi.mock('#/platform/permissions/permission-context', () => ({
  usePermission: () => ({
    grants: ['products.read', 'products.create', 'products.edit'],
    isLoading: false,
    status: 'ready',
    error: null,
    can: (key: string) =>
      ['products.read', 'products.create', 'products.edit'].includes(key),
    cannot: () => false,
    canAny: () => true,
    canAll: () => true,
  }),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )
  return {
    ...actual,
    useRouterState: (
      opts?: { select?: (s: { location: { pathname: string } }) => unknown },
    ) => {
      const state = { location: { pathname: routerState.pathname } }
      return opts?.select ? opts.select(state) : state
    },
    Link: ({
      to,
      children,
      params,
      ...rest
    }: {
      to: string
      children: React.ReactNode
      params?: { productId?: string }
      [key: string]: unknown
    }) => {
      const href =
        params?.productId && to.includes('$productId')
          ? to.replace('$productId', params.productId)
          : to
      return (
        <a href={href} {...rest}>
          {children}
        </a>
      )
    },
  }
})

import { CatalogModuleNav } from '#/modules/catalog/ui/layouts/CatalogModuleNav'

const sampleProduct: CatalogProductListItemResponse = {
  id: 'p1',
  name: 'Camiseta Azul',
  sku: 'SKU-1',
  brandId: 'b1',
  brandName: 'Marca A',
  categoryId: 'c1',
  categoryName: 'Roupas',
  status: 'active',
  basePrice: '49.90',
  basePriceCurrency: 'BRL',
  variantCount: 2,
  updatedAt: null,
}

describe('Catalog UI foundation', () => {
  beforeEach(() => {
    routerState.pathname = '/catalog/products'
  })

  it('renders product table columns and view/edit actions', () => {
    render(<CatalogTable items={[sampleProduct]} />)
    expect(screen.getByText('Camiseta Azul')).toBeTruthy()
    expect(screen.getByText('SKU-1')).toBeTruthy()
    expect(screen.getByText('Marca A')).toBeTruthy()
    expect(screen.getByText('Roupas')).toBeTruthy()
    expect(screen.getByText('Ativo')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /Visualizar Camiseta Azul/i }),
    ).toBeTruthy()
  })

  it('exposes accessible status badge labels', () => {
    render(<CatalogStatusBadge status="draft" />)
    expect(screen.getByText('Rascunho')).toBeTruthy()
  })

  it('announces loading state to assistive tech', () => {
    render(<CatalogLoadingState label="Carregando catálogo…" />)
    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-busy')).toBe('true')
    expect(within(status).getByText('Carregando catálogo…')).toBeTruthy()
  })

  it('renders empty state copy', () => {
    render(<CatalogEmptyState />)
    expect(screen.getByText('Nenhum produto encontrado')).toBeTruthy()
  })

  it('renders error state with retry action', () => {
    const onRetry = vi.fn()
    render(<CatalogErrorState onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('supports search interaction', () => {
    const onChange = vi.fn()
    render(<CatalogSearchInput value="" onChange={onChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'camiseta' } })
    expect(onChange).toHaveBeenCalledWith('camiseta')
  })

  it('supports filter chips, brand and category selects', () => {
    const onChange = vi.fn()
    const filters = defaultCatalogProductFilters()
    render(
      <CatalogFilters
        filters={filters}
        brands={[
          {
            id: 'b1',
            organizationId: 'org1',
            name: 'Marca A',
            status: 'active',
          },
        ]}
        categories={[
          {
            id: 'c1',
            organizationId: 'org1',
            name: 'Roupas',
            status: 'active',
            parentId: null,
            depth: 0,
          },
        ]}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ativos' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', page: 1 }),
    )

    fireEvent.change(screen.getByLabelText('Marca'), {
      target: { value: 'b1' },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ brandId: 'b1', page: 1 }),
    )

    fireEvent.change(screen.getByLabelText('Categoria'), {
      target: { value: 'c1' },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'c1', page: 1 }),
    )
  })

  it('paginates with accessible controls', () => {
    const onPageChange = vi.fn()
    render(
      <CatalogPagination
        page={1}
        totalPages={3}
        total={45}
        onPageChange={onPageChange}
      />,
    )
    expect(screen.getByLabelText('Paginação do catálogo')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('renders module navigation links for all catalog routes', () => {
    render(<CatalogModuleNav />)
    const nav = screen.getByLabelText('Navegação do catálogo')
    const links = within(nav).getAllByRole('link')
    const hrefs = links.map((el) => el.getAttribute('href'))
    expect(hrefs).toEqual([
      '/catalog',
      '/catalog/products',
      '/catalog/categories',
      '/catalog/brands',
      '/catalog/price-lists',
      '/catalog/inventory',
      '/catalog/attributes',
    ])
    expect(
      within(nav).getByRole('link', { name: 'Produtos' }).getAttribute('aria-current'),
    ).toBe('page')
  })

  it('maps filter state to application list query', () => {
    const query = toListCatalogProductsQuery({
      text: '  sku  ',
      brandId: 'b1',
      categoryId: null,
      status: 'active',
      sort: 'name_desc',
      page: 2,
      pageSize: 20,
    })
    expect(query).toEqual({
      text: 'sku',
      brandId: 'b1',
      categoryId: undefined,
      status: 'active',
      sort: 'name_desc',
      page: 2,
      pageSize: 20,
    })
  })
})
