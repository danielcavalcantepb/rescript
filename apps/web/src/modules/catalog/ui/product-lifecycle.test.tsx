import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductLifecycleActions } from '#/modules/catalog/ui/components/ProductLifecycleActions'
import { toCatalogRpcError } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import { CatalogPermissionError } from '#/modules/catalog/application/errors'
import { defaultCatalogProductFilters } from '#/modules/catalog/ui/filters/catalog-filter-state'
import { can } from '@rescript/permissions'

const dialogsMock = vi.hoisted(() => ({
  confirm: vi.fn(async () => ({ confirmed: true })),
}))

vi.mock('#/platform/dialogs', () => ({
  dialogs: dialogsMock,
}))

vi.mock('#/platform/services', () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const publishMutate = vi.hoisted(() => vi.fn(async () => ({ id: 'p1' })))
const archiveMutate = vi.hoisted(() => vi.fn(async () => ({ id: 'p1' })))
const restoreMutate = vi.hoisted(() => vi.fn(async () => ({ id: 'p1' })))
const deactivateMutate = vi.hoisted(() => vi.fn(async () => ({ id: 'p1' })))

vi.mock('#/modules/catalog/ui/hooks/use-catalog-lifecycle', () => ({
  usePublishProduct: () => ({ mutateAsync: publishMutate, isPending: false }),
  useArchiveProduct: () => ({ mutateAsync: archiveMutate, isPending: false }),
  useRestoreProduct: () => ({ mutateAsync: restoreMutate, isPending: false }),
  useDeactivateProduct: () => ({
    mutateAsync: deactivateMutate,
    isPending: false,
  }),
  useLifecycle: () => ({ data: null, isLoading: false }),
}))

function renderActions(
  actions: Array<'publish' | 'archive' | 'restore' | 'deactivate'>,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ProductLifecycleActions
        organizationId="org1"
        productId="p1"
        availableActions={actions}
      />
    </QueryClientProvider>,
  )
}

describe('product lifecycle UI', () => {
  it('defaults list filter to active (excludes archived)', () => {
    expect(defaultCatalogProductFilters().status).toBe('active')
  })

  it('renders only available actions', () => {
    renderActions(['publish', 'archive'])
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Arquivar' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Restaurar' })).toBeNull()
  })

  it('confirms before archive', async () => {
    renderActions(['archive'])
    fireEvent.click(screen.getByRole('button', { name: 'Arquivar' }))
    await waitFor(() => expect(dialogsMock.confirm).toHaveBeenCalled())
    await waitFor(() => expect(archiveMutate).toHaveBeenCalled())
  })

  it('maps restore-required publish error safely', () => {
    const rpc = toCatalogRpcError(
      new CatalogPermissionError('restore_required_before_publish'),
    )
    expect(rpc.code).toBe('conflict')
    expect(rpc.message).toMatch(/Restaure/i)
  })

  it('products.write implies lifecycle permissions', () => {
    expect(can(['products.write'], 'products.publish')).toBe(true)
    expect(can(['products.write'], 'products.archive')).toBe(true)
    expect(can(['products.write'], 'products.restore')).toBe(true)
    expect(can(['products.edit'], 'products.archive')).toBe(false)
  })
})
