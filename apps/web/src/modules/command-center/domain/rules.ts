import type {
  CommandAlert,
  CommandCenterRawSnapshot,
  CommandCenterSnapshot,
  CommandInsight,
  CommandKpi,
  CommandPriority,
  CommandCenterStatus,
  FinancialSummary,
  HealthSignal,
  InventorySummary,
  OperationStage,
  CommercialSummary,
  DataGap,
  PriorityLevel,
} from './types'

const numberFormat = new Intl.NumberFormat('pt-BR')
const moneyFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function money(value: number): string {
  return moneyFormat.format(value)
}

function percent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1).replace('.', ',')}%`
}

function scoreStatus(score: number | null): CommandCenterStatus {
  if (score == null) return 'unknown'
  if (score < 45) return 'critical'
  if (score < 70) return 'attention'
  return 'good'
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function variation(current: number, previous: number): string {
  if (previous <= 0 && current <= 0) return 'sem histórico'
  if (previous <= 0) return 'novo movimento'
  return percent(((current - previous) / previous) * 100)
}

function levelRank(level: PriorityLevel): number {
  if (level === 'critical') return 3
  if (level === 'attention') return 2
  return 1
}

function health(
  id: string,
  label: string,
  score: number | null,
  description: string,
  trend: string,
): HealthSignal {
  return {
    id,
    label,
    score,
    status: scoreStatus(score),
    description,
    trend,
  }
}

function priority(input: CommandPriority): CommandPriority {
  return input
}

function insight(input: CommandInsight): CommandInsight {
  return input
}

function alert(input: CommandAlert): CommandAlert {
  return input
}

function buildHealth(raw: CommandCenterRawSnapshot): HealthSignal[] {
  const financialPressure =
    raw.receivablesOverdueAmount + raw.payablesOverdueAmount
  const financialScore = clampScore(
    88 -
      raw.payablesOverdueCount * 12 -
      raw.receivablesOverdueCount * 7 -
      (raw.payablesDueTodayAmount > raw.receivablesDueTodayAmount ? 8 : 0),
  )
  const commercialScore =
    raw.customersActiveCount === 0 && raw.salesMonthCount === 0
      ? 42
      : clampScore(
          72 +
            Math.min(raw.salesMonthCount, 10) * 2 -
            raw.ordersPendingCount * 3,
        )
  const inventoryScore =
    raw.inventoryItemCount === 0
      ? 48
      : clampScore(
          88 -
            raw.inventoryCriticalCount * 9 -
            raw.inventoryNegativeCount * 20,
        )
  const operationalScore = clampScore(
    84 - raw.ordersPendingCount * 4 - raw.quotationsOpenCount * 2,
  )

  return [
    health(
      'financial',
      'Saúde financeira',
      financialScore,
      financialPressure > 0
        ? `${money(financialPressure)} exigem acompanhamento financeiro.`
        : 'Sem pressão financeira relevante neste momento.',
      raw.payablesDueTodayAmount > raw.receivablesDueTodayAmount
        ? 'saídas do dia acima das entradas'
        : 'fluxo do dia equilibrado',
    ),
    health(
      'commercial',
      'Saúde comercial',
      commercialScore,
      raw.salesMonthCount > 0
        ? `${raw.salesMonthCount} pedidos no mês com receita de ${money(raw.salesMonthValue)}.`
        : 'Ainda não há pedidos suficientes para medir tração comercial.',
      variation(raw.salesMonthValue, raw.salesPreviousMonthValue),
    ),
    health(
      'inventory',
      'Saúde do estoque',
      inventoryScore,
      raw.inventoryCriticalCount > 0
        ? `${raw.inventoryCriticalCount} itens precisam de atenção antes de vender mais.`
        : 'Disponibilidade sem ruptura detectada pelas regras atuais.',
      `${numberFormat.format(raw.inventoryOnHand - raw.inventoryReserved)} disponíveis`,
    ),
    health(
      'operation',
      'Saúde operacional',
      operationalScore,
      raw.ordersPendingCount > 0
        ? `${raw.ordersPendingCount} pedidos aguardam avanço operacional.`
        : 'Não há fila operacional crítica identificada.',
      raw.quotationsOpenCount > 0
        ? `${raw.quotationsOpenCount} orçamentos ainda em negociação`
        : 'rotina sem acúmulo comercial',
    ),
  ]
}

function buildPriorities(raw: CommandCenterRawSnapshot): CommandPriority[] {
  const items: CommandPriority[] = []

  if (raw.payablesOverdueCount > 0) {
    items.push(
      priority({
        id: 'overdue-payables',
        level: 'critical',
        impact: money(raw.payablesOverdueAmount),
        title: 'Pagamentos vencidos precisam de decisão',
        description: `${raw.payablesOverdueCount} obrigação(ões) a pagar já passaram do vencimento.`,
        suggestedAction: 'Revisar contas a pagar e priorizar quitação.',
        href: '/finance/accounts-payable',
        source: 'Accounts Payable',
      }),
    )
  }

  if (raw.receivablesOverdueCount > 0) {
    items.push(
      priority({
        id: 'overdue-receivables',
        level: 'attention',
        impact: money(raw.receivablesOverdueAmount),
        title: 'Recebimentos vencidos afetam o caixa',
        description: `${raw.receivablesOverdueCount} recebível(is) estão vencidos e continuam em aberto.`,
        suggestedAction: 'Abrir contas a receber e definir cobrança.',
        href: '/finance/receivables',
        source: 'Accounts Receivable',
      }),
    )
  }

  if (raw.inventoryCriticalCount > 0) {
    items.push(
      priority({
        id: 'critical-inventory',
        level: raw.inventoryCriticalCount > 3 ? 'critical' : 'attention',
        impact: `${raw.inventoryCriticalCount} item(ns)`,
        title: 'Estoque pode travar vendas',
        description:
          'Há itens com disponibilidade baixa ou totalmente reservada.',
        suggestedAction: 'Revisar estoque disponível antes de confirmar novos pedidos.',
        href: '/catalog/inventory/items',
        source: 'Inventory',
      }),
    )
  }

  if (raw.ordersPendingCount > 0) {
    items.push(
      priority({
        id: 'orders-waiting-flow',
        level: 'attention',
        impact: `${raw.ordersPendingCount} pedido(s)`,
        title: 'Pedidos aguardam próxima etapa',
        description:
          'Pedidos confirmados ainda exigem acompanhamento operacional.',
        suggestedAction: 'Abrir vendas e avançar a operação conforme o fluxo.',
        href: '/sales/orders',
        source: 'Sales',
      }),
    )
  }

  if (raw.productsCount === 0 || raw.customersActiveCount === 0) {
    items.push(
      priority({
        id: 'activation-gap',
        level: 'info',
        impact: 'base incompleta',
        title: 'A empresa ainda precisa de dados operacionais',
        description:
          'Sem clientes e produtos suficientes, a inteligência só consegue orientar parcialmente.',
        suggestedAction: 'Cadastrar cliente e produto para iniciar a operação real.',
        href: raw.customersActiveCount === 0 ? '/crm/customers/new' : '/catalog/products/new',
        source: 'Activation',
      }),
    )
  }

  return items
    .sort((a, b) => levelRank(b.level) - levelRank(a.level))
    .slice(0, 6)
}

function buildKpis(raw: CommandCenterRawSnapshot): CommandKpi[] {
  const averageTicket =
    raw.salesMonthCount > 0 ? raw.salesMonthValue / raw.salesMonthCount : 0
  const expectedFlow =
    raw.receivablesDueTodayAmount - raw.payablesDueTodayAmount

  return [
    {
      id: 'revenue-today',
      label: 'Receita hoje',
      value: money(raw.salesTodayValue),
      comparison: `${raw.salesTodayCount} pedido(s)`,
      variation: raw.salesTodayCount > 0 ? 'movimento no dia' : 'sem pedidos hoje',
      period: 'Hoje',
    },
    {
      id: 'revenue-month',
      label: 'Receita mês',
      value: money(raw.salesMonthValue),
      comparison: variation(raw.salesMonthValue, raw.salesPreviousMonthValue),
      variation: raw.salesMonthCount > 0 ? `${raw.salesMonthCount} pedido(s)` : 'sem pedidos no mês',
      period: 'Mês atual',
    },
    {
      id: 'profit',
      label: 'Lucro',
      value: 'Aguardando custo',
      comparison: 'custo/margem ainda não consolidados',
      variation: 'dados insuficientes',
      period: 'Mês atual',
    },
    {
      id: 'margin',
      label: 'Margem',
      value: 'Aguardando custo',
      comparison: 'sem custo médio completo',
      variation: 'dados insuficientes',
      period: 'Mês atual',
    },
    {
      id: 'average-ticket',
      label: 'Ticket médio',
      value: money(averageTicket),
      comparison: `${raw.salesMonthCount} pedido(s)`,
      variation: averageTicket > 0 ? 'calculado sobre vendas do mês' : 'sem base',
      period: 'Mês atual',
    },
    {
      id: 'orders',
      label: 'Pedidos',
      value: numberFormat.format(raw.salesMonthCount),
      comparison: `${raw.ordersPendingCount} aguardando avanço`,
      variation: raw.ordersPendingCount > 0 ? 'atenção operacional' : 'sem fila crítica',
      period: 'Mês atual',
    },
    {
      id: 'active-customers',
      label: 'Clientes ativos',
      value: numberFormat.format(raw.customersActiveCount),
      comparison: `${raw.customersNewMonthCount} novo(s) no mês`,
      variation: raw.customersActiveCount > 0 ? 'base operacional' : 'cadastre clientes',
      period: 'Agora',
    },
    {
      id: 'sold-products',
      label: 'Produtos vendidos',
      value: raw.salesMonthCount > 0 ? 'ver vendas' : 'sem vendas',
      comparison: 'derivado dos itens vendidos',
      variation: 'snapshot comercial',
      period: 'Mês atual',
    },
    {
      id: 'stock-items',
      label: 'Itens em estoque',
      value: numberFormat.format(raw.inventoryOnHand),
      comparison: `${numberFormat.format(raw.inventoryReserved)} reservado(s)`,
      variation: `${numberFormat.format(raw.inventoryOnHand - raw.inventoryReserved)} disponível(is)`,
      period: 'Agora',
    },
    {
      id: 'stock-value',
      label: 'Valor do estoque',
      value: raw.inventoryEstimatedValue > 0 ? money(raw.inventoryEstimatedValue) : 'Aguardando custo',
      comparison: 'valuation depende de custo consolidado',
      variation: raw.inventoryEstimatedValue > 0 ? 'estimado' : 'dados insuficientes',
      period: 'Agora',
    },
    {
      id: 'receivables',
      label: 'Contas a receber',
      value: money(raw.receivablesOpenAmount),
      comparison: `${money(raw.receivablesOverdueAmount)} vencido(s)`,
      variation: raw.receivablesOverdueCount > 0 ? 'exige cobrança' : 'sem vencidos',
      period: 'Aberto',
    },
    {
      id: 'payables',
      label: 'Contas a pagar',
      value: money(raw.payablesOpenAmount),
      comparison: `${money(raw.payablesOverdueAmount)} vencido(s)`,
      variation: raw.payablesOverdueCount > 0 ? 'exige decisão' : 'sem vencidos',
      period: 'Aberto',
    },
    {
      id: 'forecast-flow',
      label: 'Fluxo previsto',
      value: money(expectedFlow),
      comparison: `${money(raw.receivablesDueTodayAmount)} entra · ${money(raw.payablesDueTodayAmount)} sai`,
      variation: expectedFlow >= 0 ? 'positivo hoje' : 'negativo hoje',
      period: 'Hoje',
    },
  ]
}

function buildOperation(raw: CommandCenterRawSnapshot): OperationStage[] {
  return [
    {
      id: 'sales',
      label: 'Vendas',
      quantity: raw.salesMonthCount,
      value: money(raw.salesMonthValue),
      status: raw.ordersPendingCount > 0 ? 'attention' : 'good',
      pending:
        raw.ordersPendingCount > 0
          ? `${raw.ordersPendingCount} pedido(s) aguardando avanço`
          : 'sem fila crítica',
      href: '/sales/orders',
    },
    {
      id: 'inventory',
      label: 'Estoque',
      quantity: raw.inventoryItemCount,
      value: `${numberFormat.format(raw.inventoryOnHand - raw.inventoryReserved)} disponível(is)`,
      status: raw.inventoryCriticalCount > 0 ? 'attention' : 'good',
      pending:
        raw.inventoryCriticalCount > 0
          ? `${raw.inventoryCriticalCount} item(ns) críticos`
          : 'sem ruptura detectada',
      href: '/catalog/inventory/items',
    },
    {
      id: 'finance',
      label: 'Financeiro',
      quantity: raw.receivablesOverdueCount + raw.payablesOverdueCount,
      value: money(raw.receivablesOpenAmount - raw.payablesOpenAmount),
      status:
        raw.payablesOverdueCount > 0 || raw.receivablesOverdueCount > 0
          ? 'attention'
          : 'good',
      pending: 'saldo operacional previsto',
      href: '/finance/accounts-payable',
    },
    {
      id: 'receipts',
      label: 'Recebimentos',
      quantity: raw.receivablesOverdueCount,
      value: money(raw.receivablesDueTodayAmount),
      status: raw.receivablesOverdueCount > 0 ? 'attention' : 'good',
      pending:
        raw.receivablesOverdueCount > 0
          ? 'cobrança em atraso'
          : 'sem cobrança vencida',
      href: '/finance/receivables',
    },
  ]
}

function buildFinancial(raw: CommandCenterRawSnapshot): FinancialSummary {
  const balance = raw.receivablesDueTodayAmount - raw.payablesDueTodayAmount
  return {
    expectedInToday: money(raw.receivablesDueTodayAmount),
    expectedOutToday: money(raw.payablesDueTodayAmount),
    expectedBalanceToday: money(balance),
    overdueReceivables: money(raw.receivablesOverdueAmount),
    overduePayables: money(raw.payablesOverdueAmount),
    monthRevenue: money(raw.salesMonthValue),
    monthExpenses: money(raw.paymentsMonthAmount),
    cashFlow:
      balance >= 0
        ? 'Entradas previstas cobrem as saídas de hoje.'
        : 'Saídas previstas superam entradas de hoje.',
  }
}

function buildInventory(raw: CommandCenterRawSnapshot): InventorySummary {
  return {
    totalValue:
      raw.inventoryEstimatedValue > 0
        ? money(raw.inventoryEstimatedValue)
        : 'Aguardando custo',
    criticalProducts: raw.inventoryCriticalCount,
    noMovementProducts: 0,
    coverage:
      raw.inventoryItemCount === 0
        ? 'sem dados'
        : raw.inventoryCriticalCount > 0
          ? 'atenção'
          : 'adequada',
    replenishmentNeeded: raw.inventoryCriticalCount,
    negativeItems: raw.inventoryNegativeCount,
    abcCurve: 'Aguardando histórico de vendas',
    turnover: raw.salesMonthCount > 0 ? 'em formação' : 'sem giro no período',
  }
}

function buildCommercial(raw: CommandCenterRawSnapshot): CommercialSummary {
  const ticket =
    raw.salesMonthCount > 0 ? raw.salesMonthValue / raw.salesMonthCount : 0
  return {
    revenue: money(raw.salesMonthValue),
    orders: raw.salesMonthCount,
    ticket: money(ticket),
    conversion:
      raw.quotationsOpenCount > 0
        ? 'acompanhar orçamentos abertos'
        : 'sem funil suficiente',
    newCustomers: raw.customersNewMonthCount,
    recurringCustomers: Math.max(0, raw.customersActiveCount - raw.customersNewMonthCount),
    topCustomers: ['Aguardando ranking por vendas'],
    topProducts: ['Aguardando ranking por itens vendidos'],
    topCategories: ['Aguardando categorias consolidadas'],
  }
}

function buildInsights(raw: CommandCenterRawSnapshot): CommandInsight[] {
  const items: CommandInsight[] = []

  if (raw.payablesDueTodayAmount > raw.receivablesDueTodayAmount) {
    items.push(
      insight({
        id: 'today-cash-gap',
        nature: 'projection',
        level: 'attention',
        title: 'O caixa previsto de hoje está pressionado',
        description: `As saídas previstas (${money(raw.payablesDueTodayAmount)}) superam entradas previstas (${money(raw.receivablesDueTodayAmount)}).`,
        evidence: 'Receivables e Payables com vencimento hoje.',
        confidence: 'Alta',
        href: '/finance/accounts-payable',
      }),
    )
  }

  if (raw.inventoryCriticalCount > 0) {
    items.push(
      insight({
        id: 'stock-critical',
        nature: 'fact',
        level: 'attention',
        title: 'Existem itens com disponibilidade baixa',
        description:
          'Alguns itens têm saldo disponível igual ou inferior ao reservado, o que pode impedir novas vendas.',
        evidence: 'Inventory Item: qty_on_hand e qty_reserved.',
        confidence: 'Alta',
        href: '/catalog/inventory/items',
      }),
    )
  }

  if (raw.salesMonthValue < raw.salesPreviousMonthValue && raw.salesPreviousMonthValue > 0) {
    items.push(
      insight({
        id: 'revenue-drop',
        nature: 'fact',
        level: 'attention',
        title: 'A receita caiu em relação ao mês anterior',
        description: `A variação atual é ${variation(raw.salesMonthValue, raw.salesPreviousMonthValue)}.`,
        evidence: 'Pedidos de venda do mês atual e mês anterior.',
        confidence: 'Média',
        href: '/sales/orders',
      }),
    )
  }

  if (items.length === 0) {
    items.push(
      insight({
        id: 'all-clear',
        nature: 'recommendation',
        level: 'info',
        title: 'Nenhum risco crítico foi encontrado agora',
        description:
          'Continue acompanhando vendas, estoque e financeiro conforme novos fatos forem registrados.',
        evidence: 'Regras determinísticas da Central de Comando.',
        confidence: 'Média',
        href: '/app',
      }),
    )
  }

  return items
}

function buildAlerts(raw: CommandCenterRawSnapshot, priorities: CommandPriority[]): CommandAlert[] {
  const now = raw.generatedAt
  return priorities
    .filter((item) => item.level !== 'info')
    .slice(0, 5)
    .map((item) =>
      alert({
        id: `alert-${item.id}`,
        category: item.level,
        title: item.title,
        description: item.description,
        origin: item.source,
        date: now,
        priority: item.level === 'critical' ? 'Crítico' : 'Atenção',
        href: item.href,
      }),
    )
}

function buildDataGaps(raw: CommandCenterRawSnapshot): DataGap[] {
  const gaps: DataGap[] = []
  if (raw.customersActiveCount === 0) {
    gaps.push({
      id: 'customers',
      title: 'Sem clientes ativos',
      description: 'Cadastre clientes para medir relacionamento, venda recorrente e inadimplência.',
      href: '/crm/customers/new',
    })
  }
  if (raw.productsCount === 0 && raw.variantsCount === 0) {
    gaps.push({
      id: 'products',
      title: 'Sem produtos operacionais',
      description: 'Cadastre produtos e variantes para conectar venda, estoque e margem.',
      href: '/catalog/products/new',
    })
  }
  if (raw.salesMonthCount === 0) {
    gaps.push({
      id: 'sales-history',
      title: 'Sem histórico comercial no mês',
      description: 'A Central evita inventar tendência sem pedidos reais.',
      href: '/sales/orders/new',
    })
  }
  for (const issue of raw.sourceIssues) {
    gaps.push({
      id: `source-${issue}`,
      title: 'Fonte parcialmente indisponível',
      description: issue,
      href: '/app',
    })
  }
  return gaps
}

export function buildCommandCenterSnapshot(
  raw: CommandCenterRawSnapshot,
): CommandCenterSnapshot {
  const priorities = buildPriorities(raw)
  return {
    generatedAt: raw.generatedAt,
    health: buildHealth(raw),
    priorities,
    kpis: buildKpis(raw),
    operation: buildOperation(raw),
    financial: buildFinancial(raw),
    inventory: buildInventory(raw),
    commercial: buildCommercial(raw),
    insights: buildInsights(raw),
    alerts: buildAlerts(raw, priorities),
    dataGaps: buildDataGaps(raw),
  }
}
