import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BarcodeScannerInput } from './barcode-scanner-input'

const searchState = vi.hoisted(() => ({
  data: [
    {
      variantId: 'variant-1',
      productId: 'product-1',
      productName: 'Calça Comfort',
      variantSku: 'CAL-PP-PRETO',
      brandId: null,
      categoryId: null,
      status: 'active',
    },
  ],
  isFetching: false,
  isError: false,
  isSuccess: true,
}))

vi.mock('#/modules/catalog/ui/hooks/use-catalog-variants', () => ({
  useCatalogVariantSearch: () => searchState,
}))

describe('BarcodeScannerInput', () => {
  it('adds the resolved variant after an Enter from a scanner or keyboard', async () => {
    const onVariantFound = vi.fn()
    render(<BarcodeScannerInput organizationId="org-1" onVariantFound={onVariantFound} />)

    const input = screen.getByLabelText('Código de barras')
    fireEvent.change(input, { target: { value: '7891234567890' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(onVariantFound).toHaveBeenCalledTimes(1))
    expect(onVariantFound).toHaveBeenCalledWith(
      expect.objectContaining({ variantId: 'variant-1' }),
    )
    expect((input as HTMLInputElement).value).toBe('')
  })

  it('accepts consecutive readings of the same SKU', async () => {
    const onVariantFound = vi.fn()
    render(<BarcodeScannerInput organizationId="org-1" onVariantFound={onVariantFound} />)
    const input = screen.getByLabelText('Código de barras')

    fireEvent.change(input, { target: { value: 'CAL-PP-PRETO' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(onVariantFound).toHaveBeenCalledTimes(1))

    fireEvent.change(input, { target: { value: 'CAL-PP-PRETO' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(onVariantFound).toHaveBeenCalledTimes(2))
  })

  it('keeps the scanner ready and reports an unknown code', async () => {
    searchState.data = []
    const onVariantFound = vi.fn()
    render(<BarcodeScannerInput organizationId="org-1" onVariantFound={onVariantFound} />)
    const input = screen.getByLabelText('Código de barras')

    fireEvent.change(input, { target: { value: 'INEXISTENTE' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        'Nenhum produto encontrado',
      ),
    )
    expect(onVariantFound).not.toHaveBeenCalled()
    searchState.data = [
      {
        variantId: 'variant-1', productId: 'product-1', productName: 'Calça Comfort', variantSku: 'CAL-PP-PRETO', brandId: null, categoryId: null, status: 'active',
      },
    ]
  })
})
