export const marketingSite = {
  name: 'Rescript',
  domain: 'https://rescript.com.br',
  positioning: 'Vendas, estoque, financeiro e indicadores em uma leitura clara.',
  description:
    'Controle vendas, produtos, estoque, compras e financeiro enquanto acompanha os indicadores que movem sua empresa.',
}

export const marketingNav = [
  { label: 'Recursos', href: '/features' },
  { label: 'Módulos', href: '/modules' },
  { label: 'Planos', href: '/pricing' },
  { label: 'Clientes', href: '/customers' },
  { label: 'FAQ', href: '/faq' },
] as const

export const relationshipCards = [
  {
    title: 'Cliente com história',
    text: 'A próxima ação nasce do que a pessoa comprou, pediu, recebeu e ainda precisa resolver.',
  },
  {
    title: 'Venda com margem',
    text: 'Preço, desconto, estoque, custo e recebimento ficam conectados antes da promessa virar prejuízo.',
  },
  {
    title: 'Gestão com leitura',
    text: 'O dono enxerga o que vende, o que falta, o que encalha e onde o dinheiro realmente está.',
  },
] as const

export const scaleCards = [
  {
    title: 'Relacionamento que volta',
    text: 'A operação entende quem compra, quando retorna, o que prefere e qual oportunidade merece atenção.',
    detail: 'Cliente → histórico → preferência → recorrência',
  },
  {
    title: 'Venda que preserva lucro',
    text: 'O pedido carrega margem, promessa, estoque e recebimento como partes do mesmo movimento.',
    detail: 'Pedido → item → margem → caixa',
  },
  {
    title: 'Controle que antecipa risco',
    text: 'Sinais mostram ruptura, atraso, dinheiro parado e queda de margem antes de virarem urgência.',
    detail: 'Estoque → entrega → financeiro → decisão',
  },
] as const

export const pains = [
  {
    title: 'Clientes viram contatos soltos',
    text: 'A relação começa no atendimento, passa pela venda e desaparece quando cada área usa uma ferramenta.',
  },
  {
    title: 'Pedidos perdem contexto',
    text: 'O que foi vendido, prometido, separado, entregue e recebido não deveria depender de conferência manual.',
  },
  {
    title: 'Margem aparece tarde',
    text: 'A empresa vende, concede desconto e só depois descobre se a operação realmente gerou lucro.',
  },
  {
    title: 'Estoque e caixa falam línguas diferentes',
    text: 'Produto parado, ruptura e dinheiro em aberto ficam separados justamente onde a decisão precisa ser rápida.',
  },
  {
    title: 'Métricas não explicam a origem',
    text: 'Gráficos mostram números, mas não contam qual cliente, pedido, item ou etapa gerou o sinal.',
  },
  {
    title: 'O sistema vira cadastro',
    text: 'CRUD registra dados. Uma plataforma operacional mostra consequência e próximo passo.',
  },
] as const

export const modules = [
  {
    slug: 'relationship',
    name: 'Relacionar',
    description: 'Clientes, fornecedores, histórico e contexto comercial em uma visão viva.',
    benefit: 'Clientes deixam de existir em sistemas diferentes.',
  },
  {
    slug: 'sales',
    name: 'Vender',
    description: 'Orçamentos, pedidos, snapshots, reservas e evolução comercial rastreável.',
    benefit: 'Cada pedido carrega preço, promessa e margem.',
  },
  {
    slug: 'operations',
    name: 'Operar',
    description: 'Compras, recebimento, estoque, picking, packing e expedição conectados.',
    benefit: 'O físico e o administrativo caminham no mesmo fluxo.',
  },
  {
    slug: 'finance',
    name: 'Controlar',
    description: 'Contas, pagamentos, recebíveis e impacto de caixa ligados à origem operacional.',
    benefit: 'Dinheiro aparece como consequência da operação.',
  },
  {
    slug: 'production',
    name: 'Produzir',
    description: 'Base preparada para conectar demanda, materiais, execução e capacidade.',
    benefit: 'Produção nasce da realidade comercial e de estoque.',
  },
  {
    slug: 'intelligence',
    name: 'Decidir',
    description: 'Indicadores, exceções, auditoria e decisões explicáveis no ritmo do negócio.',
    benefit: 'Métricas explicam origem, impacto e próxima ação.',
  },
] as const

export const features = [
  {
    title: 'Uma verdade operacional',
    text: 'Cada documento, pessoa, item e decisão mantém ligação com sua origem e seu próximo passo.',
  },
  {
    title: 'Workspaces vivos',
    text: 'As entidades importantes mostram resumo, histórico, relações, indicadores e ações sem virar cadastro frio.',
  },
  {
    title: 'Contexto antes da ação',
    text: 'Antes de editar, aprovar ou avançar, o usuário enxerga status, impacto e relacionamento.',
  },
  {
    title: 'Governança silenciosa',
    text: 'Permissões, auditoria e trilhas append-only protegem a operação sem travar o fluxo diário.',
  },
  {
    title: 'Escala multiempresa',
    text: 'Arquitetura multi-tenant, projeções de busca e cache por organização sustentam crescimento real.',
  },
  {
    title: 'Decisão acionável',
    text: 'Dashboards apontam exceções, origem e CTA — não apenas gráficos bonitos sem consequência.',
  },
] as const

export const plans = [
  {
    code: 'rescript',
    name: 'Rescript',
    audience: 'Uma plataforma única para centralizar a gestão da sua empresa.',
    highlights: ['Vendas, estoque e financeiro', 'Indicadores operacionais', 'Gestão integrada'],
  },
] as const

export const faqs = [
  {
    question: 'A Rescript é apenas um ERP?',
    answer:
      'Não. A Rescript usa fundamentos de ERP, mas o produto é desenhado como uma plataforma de operação comercial: conecta relacionamento, execução, financeiro, indicadores e decisões no mesmo fluxo.',
  },
  {
    question: 'A plataforma é indicada para pequenas empresas?',
    answer:
      'Sim. A experiência foi pensada para começar simples e ganhar profundidade sem trocar de plataforma quando a operação crescer.',
  },
  {
    question: 'Existe checkout disponível?',
    answer:
      'Sim. O checkout cria a empresa, o proprietário, a assinatura inicial e o onboarding. A cobrança real e gateways de pagamento entram em sprint própria.',
  },
  {
    question: 'A Rescript trabalha com multiempresa?',
    answer:
      'A arquitetura é multi-tenant. A comunicação pública mantém o foco em benefícios e não expõe complexidade técnica ao usuário final.',
  },
  {
    question: 'Como posso acompanhar disponibilidade da plataforma?',
    answer:
      'A página de status foi estruturada para receber informações operacionais no futuro. Por enquanto, ela é institucional.',
  },
] as const

export const productFlows = [
  ['Cliente', 'Pedido', 'Estoque', 'Separação', 'Entrega', 'Caixa', 'Lucro'],
  ['Fornecedor', 'Compra', 'Recebimento', 'Estoque', 'Produção', 'Resultado'],
] as const

export const ecosystemNodes = [
  'Relacionar',
  'Vender',
  'Operar',
  'Produzir',
  'Controlar',
  'Decidir',
] as const

export const outcomes = [
  {
    metric: '1 verdade',
    label: 'para cliente, pedido, estoque, caixa e resultado',
  },
  {
    metric: 'margem',
    label: 'visível antes da decisão virar perda',
  },
  {
    metric: 'métricas',
    label: 'que explicam origem, impacto e próximo passo',
  },
] as const
