import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProductForm } from '#/modules/catalog/ui/components/product-form/ProductForm'
import {
  detailToFormValues,
  formToCreateCommand,
  formToUpdateCommand,
} from '#/modules/catalog/ui/components/product-form/mappers'
import {
  createProductFormSchema,
  editProductFormSchema,
} from '#/modules/catalog/ui/validation/product-form-schema'
import { toCatalogRpcError } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import { CatalogValidationError } from '#/modules/catalog/application/errors'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

const dialogsMock = vi.hoisted(() => ({
  confirm: vi.fn(async () => ({ confirmed: true })),
}))

vi.mock('#/platform/dialogs', () => ({
  dialogs: dialogsMock,
}))

const brands = [
  { id: 'b1', organizationId: 'org1', name: 'Marca A', status: 'active' },
]
const categories = [
  {
    id: 'c1',
    organizationId: 'org1',
    name: 'Roupas',
    status: 'active',
    parentId: null,
    depth: 0,
  },
]
const units = [
  {
    id: 'uom-un',
    organizationId: null,
    code: 'un',
    name: 'Unidade',
    precision: 0,
    integerOnly: true,
  },
]

describe('product form schema and mappers', () => {
  it('validates required create fields', () => {
    const parsed = createProductFormSchema.safeParse({
      name: '',
      sku: '',
      unitOfMeasureId: '',
      tracksInventory: true,
    })
    expect(parsed.success).toBe(false)
  })

  it('maps form to create/update commands', () => {
    expect(
      formToCreateCommand({
        name: 'Camiseta',
        sku: 'SKU-1',
        barcode: 'BAR-001',
        unitOfMeasureId: 'uom-un',
        brandId: 'b1',
        primaryCategoryId: null,
        description: null,
        tracksInventory: true,
      }),
    ).toMatchObject({
      name: 'Camiseta',
      sku: 'SKU-1',
      barcode: { type: 'internal', value: 'BAR-001' },
      unitOfMeasureId: 'uom-un',
      brandId: 'b1',
    })
    expect(
      formToUpdateCommand('p1', {
        name: 'Camiseta 2',
        brandId: null,
        primaryCategoryId: 'c1',
        description: 'desc',
      }),
    ).toEqual({
      productId: 'p1',
      name: 'Camiseta 2',
      brandId: null,
      primaryCategoryId: 'c1',
      description: 'desc',
    })
  })

  it('maps detail response to form values', () => {
    const values = detailToFormValues({
      id: 'p1',
      organizationId: 'org1',
      name: 'Camiseta',
      description: 'Desc',
      brandId: 'b1',
      primaryCategoryId: 'c1',
      topology: 'simple',
      status: 'draft',
      variants: [
        {
          id: 'v1',
          productId: 'p1',
          sku: 'SKU-1',
          unitOfMeasureId: 'uom-un',
          combinationHash: 'h',
          isDefault: true,
          tracksInventory: true,
          status: 'draft',
          attributeValues: [],
          primaryBarcode: 'BAR-001',
        },
      ],
      brandName: 'Marca A',
      categoryName: 'Roupas',
      defaultSku: 'SKU-1',
      defaultUnitOfMeasureId: 'uom-un',
      defaultUnitOfMeasureCode: 'un',
      defaultUnitOfMeasureName: 'Unidade',
      variantCount: 1,
      primaryBarcode: 'BAR-001',
      createdAt: null,
      updatedAt: null,
    })
    expect(values.sku).toBe('SKU-1')
    expect(values.barcode).toBe('BAR-001')
    expect(values.unitOfMeasureId).toBe('uom-un')
  })

  it('maps validation errors to safe RPC contracts', () => {
    const rpc = toCatalogRpcError(
      new CatalogValidationError({ name: 'Informe o nome do produto.' }),
    )
    expect(rpc.code).toBe('validation')
    expect(rpc.fieldErrors?.name).toBeTruthy()
  })

  it('keeps product detail query keys org-scoped', () => {
    expect(catalogQueryKeys.productDetail('org1', 'p1')).toEqual([
      'rescript',
      'catalog',
      'org1',
      'products',
      'detail',
      'p1',
    ])
  })

  it('accepts valid edit schema', () => {
    const parsed = editProductFormSchema.safeParse({
      name: 'Ok',
      brandId: '',
      primaryCategoryId: '',
      description: '',
      sku: 'SKU',
      unitOfMeasureId: 'uom',
      tracksInventory: true,
    })
    expect(parsed.success).toBe(true)
  })
})

describe('ProductForm component', () => {
  beforeEach(() => {
    dialogsMock.confirm.mockClear()
  })

  it('renders create mode and blocks empty submit', async () => {
    const onSubmit = vi.fn()
    render(
      <ProductForm
        mode="create"
        brands={brands}
        categories={categories}
        units={units}
        onSubmit={onSubmit}
        onCancel={() => undefined}
      />,
    )
    expect(screen.getByLabelText(/Nome/i)).toBeTruthy()
    expect(screen.getByLabelText(/Código de barras/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
    })
    expect(await screen.findByText(/Informe o nome/i)).toBeTruthy()
  })

  it('submits valid create values once', async () => {
    const onSubmit = vi.fn(async () => undefined)
    render(
      <ProductForm
        mode="create"
        brands={brands}
        categories={categories}
        units={units}
        onSubmit={onSubmit}
      />,
    )
    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: 'Produto X' },
    })
    fireEvent.change(screen.getByLabelText(/SKU/i), {
      target: { value: 'SKU-X' },
    })
    fireEvent.change(screen.getByLabelText(/Unidade/i), {
      target: { value: 'uom-un' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
  })

  it('fills edit mode and keeps sku read-only', () => {
    render(
      <ProductForm
        mode="edit"
        initial={{
          name: 'Produto Y',
          sku: 'SKU-Y',
          unitOfMeasureId: 'uom-un',
          brandId: '',
          primaryCategoryId: '',
          description: '',
          tracksInventory: true,
        }}
        brands={brands}
        categories={categories}
        units={units}
        onSubmit={vi.fn()}
      />,
    )
    const sku = screen.getByLabelText(/SKU/i) as HTMLInputElement
    expect(sku.value).toBe('SKU-Y')
    expect(sku.readOnly).toBe(true)
  })

  it('asks confirmation when canceling dirty form', async () => {
    const onCancel = vi.fn()
    render(
      <ProductForm
        mode="create"
        brands={brands}
        categories={categories}
        units={units}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    )
    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: 'Dirty' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(dialogsMock.confirm).toHaveBeenCalled())
    await waitFor(() => expect(onCancel).toHaveBeenCalled())
  })

  it('disables submit while pending (double submit guard)', () => {
    render(
      <ProductForm
        mode="create"
        brands={brands}
        categories={categories}
        units={units}
        submitting
        onSubmit={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('button', { name: /Salvando/i }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
