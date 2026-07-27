Status: Active
Owner: Product Architecture / Engineering
Última revisão: 2026-07-26
Versão: 1.0
Tipo: Reference
Escopo: Command Center, métricas operacionais, inteligência determinística
Substitui: docs/screens/CentralDecision.md como guia de implementação atual
Substituído por: —
Módulos relacionados: Sales, Customers, Products, Inventory, Accounts Receivable, Accounts Payable, Payments

# Command Center

O Command Center é a área de leitura executiva da Rescript. Ele consolida sinais operacionais existentes e responde, de forma objetiva, o que está acontecendo na empresa, o que exige atenção e qual ação deve ser tomada primeiro.

Ele não é um dashboard tradicional, não é BI e não executa ações de negócio. A primeira fundação é estritamente read-only.

## Arquitetura

- Localização de UI: `apps/web/src/modules/command-center`.
- Rota principal: `/app`.
- Permissão obrigatória: `insights.view`.
- Fonte de dados: tabelas e projeções existentes dos módulos operacionais.
- Regra central: somente leitura, sem audit log, sem migrations e sem efeitos colaterais.
- Cálculo: regras determinísticas no domínio do módulo, sem IA, OpenAI, prompts, agentes ou serviços externos.

## Fontes

O snapshot operacional pode ler:

- `sales_search`
- `accounts_receivable_search`
- `accounts_payable_search`
- `payment_search`
- `inventory_item`
- `product`
- `product_variant`
- `customer_search`

Falhas parciais de leitura devem ser expostas como lacunas de dados. A Central nunca deve inventar precisão quando uma fonte estiver indisponível ou incompleta.

## Business Health

A saúde do negócio é composta por sinais:

- saúde financeira;
- saúde comercial;
- saúde do estoque;
- saúde operacional.

Cada sinal possui score, status, descrição e tendência. O status deve ser explicável e rastreável às fontes operacionais.

## KPIs

KPIs mínimos da fundação:

- receita hoje;
- receita do mês;
- lucro;
- margem;
- ticket médio;
- pedidos;
- clientes ativos;
- produtos vendidos;
- itens em estoque;
- valor do estoque;
- contas a receber;
- contas a pagar;
- fluxo previsto.

Quando custo, margem, ranking ou histórico ainda não estiverem consolidados, o KPI deve declarar dados insuficientes.

## Prioridades

Prioridades devem ser poucas, acionáveis e ordenadas por impacto:

- financeiro vencido;
- recebíveis vencidos;
- estoque crítico;
- pedidos aguardando avanço;
- lacunas de ativação.

Cada prioridade deve possuir origem, impacto, descrição, ação sugerida e link para o workspace responsável.

## Insights e alertas

Insights são textos determinísticos derivados de fatos:

- fatos;
- projeções simples;
- recomendações operacionais.

Alertas são derivados das prioridades relevantes. Não devem ser criados registros persistentes nesta fundação.

## UX

O Command Center deve seguir a linguagem de workspace enterprise:

- cabeçalho claro;
- leitura executiva;
- cards de saúde;
- prioridades em primeiro plano;
- KPIs com contexto;
- fluxo operacional;
- insights rastreáveis;
- lacunas declaradas.

Não utilizar modais, hubs intermediários ou gráficos decorativos sem decisão operacional.

## Evolução futura

As próximas evoluções podem incluir projeções materializadas, ranking de clientes/produtos, custo/margem real, drill-downs e integração com insights persistentes. Essas evoluções devem preservar o caráter determinístico e auditável do módulo.
