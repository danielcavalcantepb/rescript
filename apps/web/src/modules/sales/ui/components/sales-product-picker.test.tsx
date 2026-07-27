import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SalesProductPicker } from './sales-product-picker'

vi.mock('#/modules/catalog/ui/hooks/use-catalog-variants', () => ({
  useCatalogVariantSearch: () => ({
    data: [
      {
        variantId: 'variant-1',
        productId: 'product-1',
        productName: 'Camiseta',
        variantSku: 'CAM-P',
        brandId: null,
        categoryId: null,
        status: 'active',
      },
    ],
    isLoading: false,
    isError: false,
  }),
}))

describe('SalesProductPicker', () => {
  it('selects a catalog variant through the shared keyboard-ready picker', () => {
    const onSelect = vi.fn()
    render(
      <SalesProductPicker
        organizationId="org-1"
        value={null}
        onSelect={onSelect}
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'CAM' } })
    fireEvent.click(screen.getByRole('option', { name: /Camiseta/ }))

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: 'variant-1',
        variantSku: 'CAM-P',
      }),
    )
  })
})
