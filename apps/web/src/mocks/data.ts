export type MockOrg = {
  id: string
  name: string
  document: string
  currency: 'BRL'
  operationalStatus: 'active' | 'suspended'
  onboardingCompleted: boolean
}

export type MockUser = {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Admin' | 'Operador'
  permissions: string[]
}

export type MockCustomer = {
  id: string
  name: string
  tradeName?: string
  personType: 'PJ' | 'PF'
  document: string
  email: string
  phone: string
  city: string
  status: 'ativo' | 'arquivado'
  notes?: string
  lastPurchaseAt?: string
}

export type MockVariant = {
  id: string
  sku: string
  label: string
  price: number
  cost: number
  available: number
  reserved: number
  physical: number
  unit: string
}

export type MockProduct = {
  id: string
  name: string
  category: string
  tracksInventory: boolean
  status: 'ativo' | 'arquivado'
  variants: MockVariant[]
}

export type MockSaleItem = {
  variantId: string
  productName: string
  sku: string
  quantity: number
  unit: string
  unitPrice: number
  lineTotal: number
}

export type MockSale = {
  id: string
  number: string
  status:
    | 'Rascunho'
    | 'Orçamento'
    | 'Pedido'
    | 'Confirmada'
    | 'Cancelada'
    | 'PedidoCancelado'
  customerId: string | null
  customerName: string
  sellerName: string
  total: number
  subtotal: number
  discountTotal: number
  updatedAt: string
  confirmedAt?: string
  items: MockSaleItem[]
  timeline: Array<{ at: string; label: string; by: string }>
}

export type MockReceivable = {
  id: string
  saleId: string
  saleNumber: string
  customerName: string
  dueOn: string
  amount: number
  balance: number
  status: 'Em aberto' | 'Parcial' | 'Quitado' | 'Vencido'
}

export type InsightCategory =
  | 'Estoque'
  | 'Financeiro'
  | 'Clientes'
  | 'Vendas'
  | 'Operação'

export type MockInsight = {
  id: string
  block: 'attention' | 'upcoming' | 'opportunity' | 'gap'
  category: InsightCategory
  type: 'Fato' | 'Projeção' | 'Recomendação'
  severity: 'alta' | 'media' | 'baixa'
  priority: number
  status: 'aberto' | 'em_andamento' | 'novo'
  title: string
  summary: string
  explanation: string
  impact: string
  source: string
  confidence: 'Alta' | 'Média' | 'Baixa'
  ctaLabel: string
  ctaHref: string
}

export const org: MockOrg = {
  id: 'org_distribuidora_norte',
  name: 'Mr Wick',
  document: '12.345.678/0001-90',
  currency: 'BRL',
  operationalStatus: 'active',
  onboardingCompleted: true,
}

export const currentUser: MockUser = {
  id: 'user_ana',
  name: 'Ana Ribeiro',
  email: 'ana@distribuidoranorte.com.br',
  role: 'Owner',
  permissions: [
    'insights.view',
    'customers.read',
    'customers.create',
    'customers.edit',
    'products.read',
    'products.create',
    'products.edit',
    'sales.read',
    'sales.create',
    'sales.edit',
    'sales.confirm',
    'sales.cancel',
    'inventory.read',
    'inventory.move',
    'inventory.adjust',
    'payments.register',
    'org.settings',
    'members.invite',
  ],
}

export const customers: MockCustomer[] = [
  {
    id: 'cus_acme',
    name: 'ACME Comércio LTDA',
    tradeName: 'ACME',
    personType: 'PJ',
    document: '23.456.789/0001-10',
    email: 'compras@acme.example',
    phone: '(11) 98888-1001',
    city: 'São Paulo',
    status: 'ativo',
    lastPurchaseAt: '2026-07-22T14:20:00.000Z',
    notes: 'Cliente prioritário — pedido semanal.',
  },
  {
    id: 'cus_bompreco',
    name: 'Mercado Bom Preço',
    personType: 'PJ',
    document: '34.567.890/0001-22',
    email: 'pedido@bompreco.example',
    phone: '(19) 97777-2200',
    city: 'Campinas',
    status: 'ativo',
    lastPurchaseAt: '2026-07-18T11:00:00.000Z',
  },
  {
    id: 'cus_joao',
    name: 'João Ferreira',
    personType: 'PF',
    document: '123.456.789-00',
    email: 'joao.ferreira@email.com',
    phone: '(11) 96666-3333',
    city: 'Guarulhos',
    status: 'ativo',
    lastPurchaseAt: '2026-06-02T09:30:00.000Z',
  },
  {
    id: 'cus_antiga',
    name: 'Padaria Estrela',
    personType: 'PJ',
    document: '45.678.901/0001-33',
    email: 'contato@estrela.example',
    phone: '(11) 95555-4444',
    city: 'Osasco',
    status: 'arquivado',
  },
]

export const products: MockProduct[] = [
  {
    id: 'prd_cafe',
    name: 'Café torrado 500g',
    category: 'Bebidas',
    tracksInventory: true,
    status: 'ativo',
    variants: [
      {
        id: 'var_cafe_500',
        sku: 'CAF-500',
        label: 'Padrão',
        price: 28.9,
        cost: 15.0,
        available: 42,
        reserved: 8,
        physical: 50,
        unit: 'un',
      },
    ],
  },
  {
    id: 'prd_camisa',
    name: 'Camisa polo',
    category: 'Vestuário',
    tracksInventory: true,
    status: 'ativo',
    variants: [
      {
        id: 'var_cam_azul_p',
        sku: 'CAM-AZUL-P',
        label: 'Azul / P',
        price: 79.9,
        cost: 35.0,
        available: 12,
        reserved: 3,
        physical: 15,
        unit: 'un',
      },
      {
        id: 'var_cam_azul_m',
        sku: 'CAM-AZUL-M',
        label: 'Azul / M',
        price: 79.9,
        cost: 35.0,
        available: 5,
        reserved: 0,
        physical: 5,
        unit: 'un',
      },
      {
        id: 'var_cam_branca_p',
        sku: 'CAM-BRAN-P',
        label: 'Branca / P',
        price: 74.9,
        cost: 32.0,
        available: 20,
        reserved: 0,
        physical: 20,
        unit: 'un',
      },
    ],
  },
  {
    id: 'prd_arroz',
    name: 'Arroz tipo 1',
    category: 'Mercearia',
    tracksInventory: true,
    status: 'ativo',
    variants: [
      {
        id: 'var_arroz_kg',
        sku: 'ARZ-KG',
        label: 'Granel',
        price: 5.49,
        cost: 3.2,
        available: 180.5,
        reserved: 20,
        physical: 200.5,
        unit: 'kg',
      },
    ],
  },
]

export const sales: MockSale[] = [
  {
    id: 'sale_10042',
    number: '2026-00042',
    status: 'Confirmada',
    customerId: 'cus_acme',
    customerName: 'ACME Comércio LTDA',
    sellerName: 'Ana Ribeiro',
    subtotal: 1156.0,
    discountTotal: 0,
    total: 1156.0,
    updatedAt: '2026-07-22T14:20:00.000Z',
    confirmedAt: '2026-07-22T14:20:00.000Z',
    items: [
      {
        variantId: 'var_cafe_500',
        productName: 'Café torrado 500g',
        sku: 'CAF-500',
        quantity: 40,
        unit: 'un',
        unitPrice: 28.9,
        lineTotal: 1156.0,
      },
    ],
    timeline: [
      { at: '2026-07-22T13:50:00.000Z', label: 'Rascunho criado', by: 'Ana Ribeiro' },
      { at: '2026-07-22T14:05:00.000Z', label: 'Convertida em Pedido', by: 'Ana Ribeiro' },
      {
        at: '2026-07-22T14:20:00.000Z',
        label: 'Venda confirmada',
        by: 'Ana Ribeiro',
      },
    ],
  },
  {
    id: 'sale_10043',
    number: '2026-00043',
    status: 'Pedido',
    customerId: 'cus_bompreco',
    customerName: 'Mercado Bom Preço',
    sellerName: 'Ana Ribeiro',
    subtotal: 399.5,
    discountTotal: 20,
    total: 379.5,
    updatedAt: '2026-07-23T16:10:00.000Z',
    items: [
      {
        variantId: 'var_cam_azul_p',
        productName: 'Camisa polo',
        sku: 'CAM-AZUL-P',
        quantity: 3,
        unit: 'un',
        unitPrice: 79.9,
        lineTotal: 239.7,
      },
      {
        variantId: 'var_cam_azul_m',
        productName: 'Camisa polo',
        sku: 'CAM-AZUL-M',
        quantity: 2,
        unit: 'un',
        unitPrice: 79.9,
        lineTotal: 159.8,
      },
    ],
    timeline: [
      { at: '2026-07-23T15:40:00.000Z', label: 'Rascunho criado', by: 'Ana Ribeiro' },
      {
        at: '2026-07-23T16:10:00.000Z',
        label: 'Pedido com reserva',
        by: 'Ana Ribeiro',
      },
    ],
  },
  {
    id: 'sale_10044',
    number: '2026-00044',
    status: 'Orçamento',
    customerId: 'cus_joao',
    customerName: 'João Ferreira',
    sellerName: 'Ana Ribeiro',
    subtotal: 109.8,
    discountTotal: 0,
    total: 109.8,
    updatedAt: '2026-07-24T10:00:00.000Z',
    items: [
      {
        variantId: 'var_arroz_kg',
        productName: 'Arroz tipo 1',
        sku: 'ARZ-KG',
        quantity: 20,
        unit: 'kg',
        unitPrice: 5.49,
        lineTotal: 109.8,
      },
    ],
    timeline: [
      { at: '2026-07-24T10:00:00.000Z', label: 'Orçamento emitido', by: 'Ana Ribeiro' },
    ],
  },
  {
    id: 'sale_10040',
    number: '2026-00040',
    status: 'Rascunho',
    customerId: 'cus_acme',
    customerName: 'ACME Comércio LTDA',
    sellerName: 'Ana Ribeiro',
    subtotal: 0,
    discountTotal: 0,
    total: 0,
    updatedAt: '2026-07-21T09:00:00.000Z',
    items: [],
    timeline: [
      { at: '2026-07-21T09:00:00.000Z', label: 'Rascunho criado', by: 'Ana Ribeiro' },
    ],
  },
]

export const receivables: MockReceivable[] = [
  {
    id: 'rec_1',
    saleId: 'sale_10042',
    saleNumber: '2026-00042',
    customerName: 'ACME Comércio LTDA',
    dueOn: '2026-07-22',
    amount: 1156.0,
    balance: 0,
    status: 'Quitado',
  },
  {
    id: 'rec_2',
    saleId: 'sale_10043',
    saleNumber: '2026-00043',
    customerName: 'Mercado Bom Preço',
    dueOn: '2026-07-30',
    amount: 379.5,
    balance: 379.5,
    status: 'Em aberto',
  },
  {
    id: 'rec_old',
    saleId: 'sale_legacy',
    saleNumber: '2026-00031',
    customerName: 'João Ferreira',
    dueOn: '2026-07-10',
    amount: 420.0,
    balance: 420.0,
    status: 'Vencido',
  },
]

export const insights: MockInsight[] = [
  {
    id: 'ins_cafe',
    block: 'attention',
    category: 'Estoque',
    type: 'Projeção',
    severity: 'alta',
    priority: 1,
    status: 'novo',
    title: 'Pode faltar Café 500g em 6 dias',
    summary: 'Ritmo das últimas 2 semanas.',
    explanation: 'No ritmo de venda das últimas 2 semanas.',
    impact: 'Top 5 de vendas',
    source: 'Baseado em 34 vendas e no saldo disponível atual',
    confidence: 'Alta',
    ctaLabel: 'Ver produto',
    ctaHref: '/produtos/prd_cafe',
  },
  {
    id: 'ins_vencidos',
    block: 'attention',
    category: 'Financeiro',
    type: 'Fato',
    severity: 'alta',
    priority: 2,
    status: 'aberto',
    title: '1 recebível vencido · R$ 420',
    summary: 'João Ferreira — 10/07.',
    explanation: 'João Ferreira — vencido em 10/07.',
    impact: 'Caixa da semana',
    source: 'Parcelas em aberto com vencimento passado',
    confidence: 'Alta',
    ctaLabel: 'Ver vendas',
    ctaHref: '/vendas',
  },
  {
    id: 'ins_pedido',
    block: 'attention',
    category: 'Vendas',
    type: 'Fato',
    severity: 'media',
    priority: 3,
    status: 'em_andamento',
    title: 'Pedido 2026-00043 parado há 1 dia',
    summary: 'Reserva ativa, aguarda confirmação.',
    explanation: 'Reserva ativa — aguardando confirmação.',
    impact: 'Estoque em camisas',
    source: 'Vendas em status Pedido',
    confidence: 'Alta',
    ctaLabel: 'Abrir pedido',
    ctaHref: '/vendas/sale_10043',
  },
  {
    id: 'ins_camisa',
    block: 'attention',
    category: 'Estoque',
    type: 'Fato',
    severity: 'media',
    priority: 4,
    status: 'aberto',
    title: 'Camisa polo Azul/M com 5 un disponíveis',
    summary: 'Saldo baixo no SKU mais pedido.',
    explanation: 'Disponível abaixo do limiar sugerido para o SKU.',
    impact: 'Risco em pedidos da semana',
    source: 'Saldo disponível vs média de demanda',
    confidence: 'Média',
    ctaLabel: 'Ver produto',
    ctaHref: '/produtos/prd_camisa',
  },
  {
    id: 'ins_receber',
    block: 'upcoming',
    category: 'Financeiro',
    type: 'Projeção',
    severity: 'media',
    priority: 5,
    status: 'aberto',
    title: 'Receber R$ 379,50 até 30/07',
    summary: 'Mercado Bom Preço.',
    explanation: 'Parcela do Mercado Bom Preço.',
    impact: 'Entrada em 7 dias',
    source: 'Recebíveis com vencimento em 7 dias',
    confidence: 'Alta',
    ctaLabel: 'Ver venda',
    ctaHref: '/vendas/sale_10043',
  },
  {
    id: 'ins_reserva',
    block: 'upcoming',
    category: 'Operação',
    type: 'Fato',
    severity: 'baixa',
    priority: 6,
    status: 'aberto',
    title: 'Reserva do pedido 00043 expira em 48h',
    summary: 'TTL padrão da organização.',
    explanation: 'TTL padrão da organização.',
    impact: 'Libera disponível se não confirmar',
    source: 'Reservas ativas',
    confidence: 'Alta',
    ctaLabel: 'Abrir pedido',
    ctaHref: '/vendas/sale_10043',
  },
  {
    id: 'ins_cliente',
    block: 'opportunity',
    category: 'Clientes',
    type: 'Recomendação',
    severity: 'baixa',
    priority: 7,
    status: 'novo',
    title: 'João Ferreira sem compra há 45+ dias',
    summary: 'Histórico irregular.',
    explanation: 'Histórico de compras irregulares.',
    impact: 'Reativação possível',
    source: 'Última compra confirmada',
    confidence: 'Média',
    ctaLabel: 'Ver cliente',
    ctaHref: '/clientes/cus_joao',
  },
  {
    id: 'ins_acme',
    block: 'opportunity',
    category: 'Clientes',
    type: 'Recomendação',
    severity: 'baixa',
    priority: 8,
    status: 'aberto',
    title: 'ACME com ticket acima da média',
    summary: 'Última compra R$ 1.156.',
    explanation: 'Cliente prioritário com ritmo semanal.',
    impact: 'Manter atenção comercial',
    source: 'Ticket vs média da org',
    confidence: 'Média',
    ctaLabel: 'Ver cliente',
    ctaHref: '/clientes/cus_acme',
  },
  {
    id: 'ins_arroz',
    block: 'opportunity',
    category: 'Vendas',
    type: 'Projeção',
    severity: 'baixa',
    priority: 9,
    status: 'aberto',
    title: 'Arroz tipo 1 com estoque folgado',
    summary: '180 kg disponíveis.',
    explanation: 'Saldo alto relativo à demanda recente.',
    impact: 'Espaço para promoção pontual',
    source: 'Disponível vs saída recente',
    confidence: 'Baixa',
    ctaLabel: 'Ver produto',
    ctaHref: '/produtos/prd_arroz',
  },
  {
    id: 'ins_gap',
    block: 'gap',
    category: 'Operação',
    type: 'Fato',
    severity: 'baixa',
    priority: 10,
    status: 'aberto',
    title: 'Poucos produtos com custo cadastrado',
    summary: 'Margem fica frágil.',
    explanation: 'Margem fica frágil sem custo médio.',
    impact: 'Insights de margem limitados',
    source: 'Catálogo sem custo em parte dos itens',
    confidence: 'Alta',
    ctaLabel: 'Ver produtos',
    ctaHref: '/produtos',
  },
  {
    id: 'ins_gap_hist',
    block: 'gap',
    category: 'Vendas',
    type: 'Fato',
    severity: 'baixa',
    priority: 11,
    status: 'aberto',
    title: 'Histórico curto para projeção de ruptura',
    summary: 'Menos de 30 dias de série.',
    explanation: 'Ainda há poucas vendas confirmadas na série.',
    impact: 'Projeções com confiança menor',
    source: 'Contagem de vendas confirmadas',
    confidence: 'Alta',
    ctaLabel: 'Ver vendas',
    ctaHref: '/vendas',
  },
]

export const todayPulse = {
  salesAmount: 1156.0,
  salesCount: 1,
  openOrders: 1,
  alertCount: 3,
  deltaPercent: 8,
  deltaLabel: '+8% vs ontem',
  receivedToday: 1156.0,
  overdueAmount: 420.0,
  monthSales: 18420.0,
  avgTicket: 612.0,
  estimatedMargin: 0.38,
}

export function getCustomer(id: string) {
  return customers.find((c) => c.id === id)
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id)
}

export function getSale(id: string) {
  return sales.find((s) => s.id === id)
}

export function salesForCustomer(customerId: string) {
  return sales.filter((s) => s.customerId === customerId)
}
