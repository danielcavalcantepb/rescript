import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Customer } from '#/modules/customers/domain/types'
import { CustomerEntityPicker } from './customer-entity-picker'

const permissionState = vi.hoisted(() => ({
  canCreate: true,
}))

const createdCustomer: Customer = {
  id: 'customer-new',
  organizationId: 'org-1',
  personType: 'PF',
  legalName: 'Ana Clara',
  tradeName: null,
  document: null,
  email: 'ana@example.com',
  phone: null,
  city: null,
  notes: null,
  status: 'draft',
  archivedAt: null,
  createdAt: '2026-07-27T00:00:00.000Z',
  updatedAt: '2026-07-27T00:00:00.000Z',
}

vi.mock('#/platform/permissions', () => ({
  usePermission: () => ({
    can: (permission: string) =>
      permission === 'customers.create' && permissionState.canCreate,
  }),
}))

vi.mock('#/modules/customers/ui/use-customer-queries', () => ({
  useCustomers: () => ({
    data: { pages: [{ items: [] }] },
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}))

vi.mock('./customer-quick-create-form', () => ({
  CustomerQuickCreateForm: ({
    initialName,
    onCreated,
  }: {
    initialName: string
    onCreated: (customer: Customer) => void
  }) => (
    <button type="button" onClick={() => onCreated(createdCustomer)}>
      Salvar {initialName}
    </button>
  ),
}))

describe('CustomerEntityPicker', () => {
  beforeEach(() => {
    permissionState.canCreate = true
  })

  it('creates in the drawer and automatically selects the customer', () => {
    const onChange = vi.fn()
    render(
      <CustomerEntityPicker value={null} onChange={onChange} />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Ana Clara' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar cliente' }))

    expect(screen.getByRole('dialog', { name: 'Novo cliente' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Ana Clara' }))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'customer-new',
        legalName: 'Ana Clara',
      }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('does not expose inline creation without permission', () => {
    permissionState.canCreate = false
    render(<CustomerEntityPicker value={null} onChange={vi.fn()} />)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Ana Clara' } })

    expect(
      screen.queryByRole('button', { name: 'Criar cliente' }),
    ).toBeNull()
  })
})
