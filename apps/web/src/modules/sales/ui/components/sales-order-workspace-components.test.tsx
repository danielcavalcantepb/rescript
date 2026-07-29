import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DeliverySection, NotesSection, OrderHeader, PaymentSection, SalesTotals } from './sales-order-workspace-components'

describe('Sales Order Workspace components', () => {
  it('presents exact commercial totals and configuration-aware payment fields', () => {
    render(<><SalesTotals itemCount={2} subtotalCents={2050} discountCents={100} currency="BRL" /><PaymentSection /><DeliverySection /></>)
    expect(screen.getByText('R$ 19,50')).toBeInTheDocument()
    expect(screen.getByDisplayValue(/Selecione uma condição no cabeçalho/i)).toBeInTheDocument()
    expect(screen.getByText(/transportadora, frete, volumes e endereço não serão simulados/i)).toBeInTheDocument()
  })

  it('keeps the notes field accessible', () => {
    render(<NotesSection value="" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Observação interna')).toBeInTheDocument()
  })

  it('shows confirmation only when the lifecycle permission is available', () => {
    const { rerender } = render(<OrderHeader isEdit={false} date="27 de julho" submitting={false} canSubmit canConfirm={false} onCancel={vi.fn()} onSave={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Concluir pedido' })).toBeNull()
    rerender(<OrderHeader isEdit={false} date="27 de julho" submitting={false} canSubmit canConfirm onCancel={vi.fn()} onSave={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Concluir pedido' })).toBeInTheDocument()
  })
})
