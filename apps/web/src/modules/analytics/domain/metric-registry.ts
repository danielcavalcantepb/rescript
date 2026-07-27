import type { AnalyticsTab, MetricDefinition } from './types'

export const metricRegistry: MetricDefinition[] = [
  { id: 'revenue', name: 'Receita', description: 'Valor vendido no período filtrado.', category: 'overview', unit: 'money', origin: ['sales_search'], formula: 'sum(sales.confirmed.grand_total)', filters: ['customer', 'seller', 'channel', 'status', 'origin'] },
  { id: 'profit', name: 'Lucro', description: 'Lucro bruto quando custo estiver disponível.', category: 'overview', unit: 'money', origin: ['sales', 'inventory_cost'], formula: 'revenue - cost', filters: ['product', 'category', 'brand'] },
  { id: 'margin', name: 'Margem', description: 'Margem bruta percentual quando custo estiver disponível.', category: 'overview', unit: 'percent', origin: ['sales', 'inventory_cost'], formula: '(profit / revenue) * 100', filters: ['product', 'category', 'brand'] },
  { id: 'average_ticket', name: 'Ticket médio', description: 'Receita dividida pela quantidade de pedidos.', category: 'commercial', unit: 'money', origin: ['sales_search'], formula: 'revenue / orders', filters: ['customer', 'seller', 'channel'] },
  { id: 'orders', name: 'Pedidos', description: 'Quantidade de pedidos de venda confirmados.', category: 'commercial', unit: 'number', origin: ['sales_search'], formula: 'count(sales_order.confirmed)', filters: ['customer', 'seller', 'status'] },
  { id: 'customers', name: 'Clientes', description: 'Clientes distintos com fato comercial no período.', category: 'customers', unit: 'number', origin: ['sales_search', 'customer_search'], formula: 'distinct(customer)', filters: ['customer', 'origin'] },
  { id: 'products_sold', name: 'Produtos vendidos', description: 'Produtos distintos vendidos.', category: 'products', unit: 'number', origin: ['sales_items'], formula: 'distinct(product)', filters: ['product', 'category', 'brand'] },
  { id: 'items_sold', name: 'Itens vendidos', description: 'Quantidade de itens vendidos.', category: 'products', unit: 'quantity', origin: ['sales_items'], formula: 'sum(quantity)', filters: ['product', 'category', 'brand'] },
  { id: 'discount', name: 'Descontos', description: 'Valor de descontos comerciais no período.', category: 'commercial', unit: 'money', origin: ['sales_search'], formula: 'sum(discount)', filters: ['seller', 'customer', 'channel'] },
  { id: 'average_value', name: 'Valor médio', description: 'Valor médio por fato comercial.', category: 'comparatives', unit: 'money', origin: ['sales_search'], formula: 'sum(amount) / count(records)', filters: ['status', 'origin'] },
  { id: 'stock', name: 'Estoque', description: 'Quantidade total disponível fisicamente em projeção de estoque.', category: 'inventory', unit: 'quantity', origin: ['inventory_item'], formula: 'sum(qty_on_hand)', filters: ['product', 'category', 'brand'] },
  { id: 'stock_capital', name: 'Capital em estoque', description: 'Valor financeiro estimado do estoque quando custo estiver disponível.', category: 'inventory', unit: 'money', origin: ['inventory_item', 'cost_projection'], formula: 'sum(qty_on_hand * unit_cost)', filters: ['product', 'category', 'brand'] },
  { id: 'receivable', name: 'A receber', description: 'Saldo em aberto de contas a receber.', category: 'finance', unit: 'money', origin: ['accounts_receivable_search'], formula: 'sum(open_amount)', filters: ['customer', 'status'] },
  { id: 'payable', name: 'A pagar', description: 'Saldo em aberto de contas a pagar.', category: 'finance', unit: 'money', origin: ['accounts_payable_search'], formula: 'sum(open_balance)', filters: ['supplier', 'status'] },
  { id: 'cash_flow', name: 'Fluxo de caixa', description: 'Entradas esperadas menos saídas esperadas.', category: 'finance', unit: 'money', origin: ['accounts_receivable_search', 'accounts_payable_search'], formula: 'receivable - payable', filters: ['status', 'paymentMethod'] },
]

export const analyticsTabs: AnalyticsTab[] = [
  { id: 'overview', label: 'Visão Geral', description: 'Leitura executiva do negócio.', metricIds: ['revenue', 'profit', 'margin', 'orders', 'average_ticket'] },
  { id: 'commercial', label: 'Comercial', description: 'Vendas, ticket, descontos e evolução comercial.', metricIds: ['revenue', 'orders', 'average_ticket', 'discount'] },
  { id: 'sellers', label: 'Vendedores', description: 'Base preparada para produtividade por vendedor.', metricIds: ['revenue', 'orders', 'average_ticket'] },
  { id: 'products', label: 'Produtos', description: 'Performance de produtos e itens vendidos.', metricIds: ['products_sold', 'items_sold', 'stock', 'stock_capital'] },
  { id: 'customers', label: 'Clientes', description: 'Relacionamento, recorrência e carteira.', metricIds: ['customers', 'revenue', 'average_ticket'] },
  { id: 'inventory', label: 'Estoque', description: 'Saldo, disponibilidade e capital imobilizado.', metricIds: ['stock', 'stock_capital'] },
  { id: 'finance', label: 'Financeiro', description: 'Receber, pagar e fluxo operacional.', metricIds: ['receivable', 'payable', 'cash_flow'] },
  { id: 'comparatives', label: 'Comparativos', description: 'Comparações entre períodos e dimensões.', metricIds: ['revenue', 'average_value', 'orders'] },
]

export function findMetricDefinition(id: string): MetricDefinition | undefined {
  return metricRegistry.find((metric) => metric.id === id)
}
