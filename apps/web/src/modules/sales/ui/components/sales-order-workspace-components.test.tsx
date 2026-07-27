import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  DeliverySection,
  NotesSection,
  PaymentSection,
  SalesTotals,
} from './sales-order-workspace-components'

describe('Sales Order Workspace components', () => {
  it('presents exact commercial totals and the current integration boundaries', () => {
    render(
      <>
        <SalesTotals itemCount={2} subtotalCents={2050} discountCents={100} currency="BRL" />
        <PaymentSection />
        <DeliverySection />
      </>,
    )

    expect(screen.getByText('R$ 19,50')).toBeInTheDocument()
    expect(screen.getByText(/nenhuma parcela ou obrigação financeira/i)).toBeInTheDocument()
    expect(screen.getByText(/transportadora, frete, volumes e endereço não serão simulados/i)).toBeInTheDocument()
  })

  it('keeps the notes field accessible', () => {
    render(<NotesSection value="" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Observação interna')).toBeInTheDocument()
  })
})
