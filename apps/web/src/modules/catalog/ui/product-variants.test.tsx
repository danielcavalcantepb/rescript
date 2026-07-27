import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductVariantsSection } from '#/modules/catalog/ui/components/variants/ProductVariantsSection'
import { VariantCombinationPreview } from '#/modules/catalog/ui/components/variants/VariantCombinationPreview'
import { VariantAxisEditor } from '#/modules/catalog/ui/components/variants/VariantAxisEditor'
import { can } from '@rescript/permissions'
import type { VariantCombinationsPreviewResponse } from '#/modules/catalog/application'

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

vi.mock('#/platform/permissions', async () => {
  const actual = await vi.importActual<typeof import('#/platform/permissions')>(
    '#/platform/permissions',
  )
  return {
    ...actual,
    usePermission: () => ({
      can: (key: string) =>
        can(
          [
            'products.write',
            'products.variants.read',
            'products.variants.configure',
            'products.variants.edit',
            'products.variants.archive',
            'products.variants.restore',
          ],
          key as never,
        ),
      permissions: [],
      isLoading: false,
    }),
    FeatureGate: ({ children }: { children: React.ReactNode }) => children,
  }
})

const applyMutate = vi.hoisted(() =>
  vi.fn(async () => ({
    product: { id: 'p1', topology: 'variable', variants: [] },
    createdVariantIds: ['v1', 'v2'],
    preservedVariantIds: [],
    axes: [],
  })),
)

vi.mock('#/modules/catalog/ui/hooks/use-catalog-variants', () => ({
  useProductVariants: () => ({
    data: {
      productId: 'p1',
      topology: 'simple',
      productStatus: 'draft',
      axes: [],
      items: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePreviewVariantCombinations: () => ({
    data: {
      productId: 'p1',
      totalCombinations: 4,
      existingCount: 0,
      newCount: 4,
      archivedCount: 0,
      obsoleteCount: 0,
      requiresConfirmation: false,
      softConfirmAbove: 24,
      maxCombinations: 10_000,
      maxAxes: 3,
      axes: [],
      items: [
        {
          combinationHash: 'h1',
          selectionKey: 'cor=preto|tamanho=p',
          label: 'Preto / P',
          attributeValues: [],
          state: 'new' as const,
          variantId: null,
          sku: null,
          status: null,
        },
        {
          combinationHash: 'h2',
          selectionKey: 'cor=branco|tamanho=p',
          label: 'Branco / P',
          attributeValues: [],
          state: 'new' as const,
          variantId: null,
          sku: null,
          status: null,
        },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useApplyVariantCombinations: () => ({
    mutateAsync: applyMutate,
    isPending: false,
  }),
  useUpdateVariant: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveVariant: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRestoreVariant: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

function renderSection() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ProductVariantsSection
        organizationId="org1"
        productId="p1"
        productStatus="draft"
      />
    </QueryClientProvider>,
  )
}

describe('product variants UI', () => {
  it('shows empty state and opens axis editor', async () => {
    renderSection()
    expect(screen.getByText('Nenhuma variante')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Configurar variantes' }))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Configurar variantes' }),
      ).toBeTruthy(),
    )
    expect(screen.getByLabelText('Nome do eixo')).toBeTruthy()
  })

  it('axis editor adds options without hardcoded clothing enums', () => {
    const onChange = vi.fn()
    render(
      <VariantAxisEditor
        axes={[{ name: 'Volume', options: ['30 ml'] }]}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar opção' }))
    expect(onChange).toHaveBeenCalled()
    expect(screen.getByDisplayValue('Volume')).toBeTruthy()
    expect(screen.queryByText('PP')).toBeNull()
  })

  it('preview toggles selection keys', () => {
    const preview: VariantCombinationsPreviewResponse = {
      productId: 'p1',
      totalCombinations: 2,
      existingCount: 0,
      newCount: 2,
      archivedCount: 0,
      obsoleteCount: 0,
      requiresConfirmation: false,
      softConfirmAbove: 24,
      maxCombinations: 10_000,
      maxAxes: 3,
      axes: [],
      items: [
        {
          combinationHash: 'a',
          selectionKey: 'k1',
          label: 'A',
          attributeValues: [],
          state: 'new',
          variantId: null,
          sku: null,
          status: null,
        },
        {
          combinationHash: 'b',
          selectionKey: 'k2',
          label: 'B',
          attributeValues: [],
          state: 'new',
          variantId: null,
          sku: null,
          status: null,
        },
      ],
    }
    const onToggle = vi.fn()
    render(
      <VariantCombinationPreview
        preview={preview}
        selectedKeys={new Set(['k1'])}
        onToggle={onToggle}
        onSelectAllNew={vi.fn()}
        onClearNew={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByLabelText('Criar B'))
    expect(onToggle).toHaveBeenCalledWith('k2')
  })

  it('products.write implies variant configure permission', () => {
    expect(can(['products.write'], 'products.variants.configure')).toBe(true)
    expect(can(['products.edit'], 'products.variants.configure')).toBe(false)
  })
})
