import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CommandCenterSnapshot } from '#/modules/command-center/domain/types'
import { CommandCenterWorkspace } from './command-center-page'

const snapshot: CommandCenterSnapshot = {
  generatedAt: '2026-07-26T12:00:00.000Z',
  health: [
    {
      id: 'financial',
      label: 'Saúde financeira',
      score: 61,
      status: 'attention',
      description: 'R$ 900,00 exigem acompanhamento financeiro.',
      trend: 'saídas do dia acima das entradas',
    },
  ],
  priorities: [
    {
      id: 'overdue-payables',
      level: 'critical',
      impact: 'R$ 900,00',
      title: 'Pagamentos vencidos precisam de decisão',
      description: '2 obrigações a pagar já passaram do vencimento.',
      suggestedAction: 'Revisar contas a pagar e priorizar quitação.',
      href: '/finance/accounts-payable',
      source: 'Accounts Payable',
    },
  ],
  kpis: [
    {
      id: 'revenue-today',
      label: 'Receita hoje',
      value: 'R$ 1.200,00',
      comparison: '2 pedido(s)',
      variation: 'movimento no dia',
      period: 'Hoje',
    },
  ],
  operation: [
    {
      id: 'sales',
      label: 'Vendas',
      quantity: 2,
      value: 'R$ 1.200,00',
      status: 'good',
      pending: 'sem fila crítica',
      href: '/sales/orders',
    },
  ],
  financial: {
    expectedInToday: 'R$ 0,00',
    expectedOutToday: 'R$ 300,00',
    expectedBalanceToday: '-R$ 300,00',
    overdueReceivables: 'R$ 0,00',
    overduePayables: 'R$ 900,00',
    monthRevenue: 'R$ 1.200,00',
    monthExpenses: 'R$ 0,00',
    cashFlow: 'Saídas previstas superam entradas de hoje.',
  },
  inventory: {
    totalValue: 'Aguardando custo',
    criticalProducts: 0,
    noMovementProducts: 0,
    coverage: 'adequada',
    replenishmentNeeded: 0,
    negativeItems: 0,
    abcCurve: 'Aguardando histórico de vendas',
    turnover: 'em formação',
  },
  commercial: {
    revenue: 'R$ 1.200,00',
    orders: 2,
    ticket: 'R$ 600,00',
    conversion: 'sem funil suficiente',
    newCustomers: 1,
    recurringCustomers: 0,
    topCustomers: ['Aguardando ranking por vendas'],
    topProducts: ['Aguardando ranking por itens vendidos'],
    topCategories: ['Aguardando categorias consolidadas'],
  },
  insights: [
    {
      id: 'today-cash-gap',
      nature: 'projection',
      level: 'attention',
      title: 'O caixa previsto de hoje está pressionado',
      description: 'As saídas previstas superam entradas previstas.',
      evidence: 'Receivables e Payables com vencimento hoje.',
      confidence: 'Alta',
      href: '/finance/accounts-payable',
    },
  ],
  alerts: [
    {
      id: 'alert-overdue-payables',
      category: 'critical',
      title: 'Pagamentos vencidos precisam de decisão',
      description: '2 obrigações a pagar já passaram do vencimento.',
      origin: 'Accounts Payable',
      date: '2026-07-26T12:00:00.000Z',
      priority: 'Crítico',
      href: '/finance/accounts-payable',
    },
  ],
  dataGaps: [],
}

describe('CommandCenterWorkspace', () => {
  it('renders executive context, priorities, KPIs and traceable insights', () => {
    render(<CommandCenterWorkspace data={snapshot} />)

    expect(screen.getByRole('heading', { name: 'Centro de Comando' })).toBeInTheDocument()
    expect(screen.getAllByText('Pagamentos vencidos precisam de decisão')).toHaveLength(2)
    expect(screen.getByText('Receita hoje')).toBeInTheDocument()
    expect(screen.getByText('O caixa previsto de hoje está pressionado')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Abrir' })[0]).toHaveAttribute(
      'href',
      '/finance/accounts-payable',
    )
  })
})
