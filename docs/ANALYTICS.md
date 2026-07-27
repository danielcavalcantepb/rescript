---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Reference
Scope: Business Analytics Platform
Supersedes: None
Superseded-By: None
Related-Modules: Analytics, Command Center, Sales, Customers, Products, Inventory, Finance
---

# Business Analytics Platform

## Responsabilidade

Métricas é o Workspace corporativo de análise do Rescript. Ele responde “como está meu negócio?” e é deliberadamente separado do Centro de Comando, que responde “o que precisa da minha atenção agora?”.

O módulo é read-only. Ele não altera vendas, estoque, financeiro, clientes, produtos, projeções canônicas ou documentos operacionais.

## Arquitetura

O módulo segue a arquitetura modular padrão:

- `domain`: registry de métricas, filtros, comparadores, agregadores, formatadores e engine;
- `application`: service e ports com autorização por `analytics.view`;
- `infrastructure`: provider server-only para leitura tenant-scoped em projeções existentes;
- `ui`: server function, hook tenant-scoped e Workspace.

## Analytics Engine

O Analytics Engine recebe um `AnalyticsDataset`, aplica filtros, calcula período atual e período anterior, computa métricas e retorna um snapshot serializável para a UI.

O engine não conhece Supabase, React, permissões, sessão ou tabelas. Métricas com fonte insuficiente devem retornar estado explícito de dados insuficientes em vez de inventar precisão.

## Metric Registry

Toda métrica possui:

- nome;
- descrição;
- categoria;
- unidade;
- origem;
- fórmula;
- filtros suportados;
- comparação com período anterior.

O registry atual cobre receita, lucro, margem, ticket médio, pedidos, clientes, produtos vendidos, itens vendidos, descontos, valor médio, estoque, capital em estoque, a receber, a pagar e fluxo de caixa.

## Filtros

O contrato suporta filtros simultâneos por:

- período;
- empresa/organização;
- filial;
- loja;
- vendedor;
- cliente;
- produto;
- categoria;
- marca;
- fornecedor;
- canal;
- método de pagamento;
- origem;
- status.

Nem todas as projeções existentes possuem todas as dimensões preenchidas. Quando uma dimensão não existe na fonte atual, a métrica deve permanecer honesta sobre a lacuna.

## Comparativos

Cada consulta resolve:

- intervalo atual;
- intervalo anterior equivalente;
- valor atual;
- valor anterior;
- variação percentual;
- tendência.

## Providers

Providers traduzem read models existentes para `AnalyticsRecord`. Eles são server-only, recebem tenant validado e sempre filtram por `organization_id`.

Fontes iniciais:

- `sales_search`;
- `accounts_receivable_search`;
- `accounts_payable_search`;
- `inventory_item`;
- `customer_search`.

## Performance

O módulo nasce preparado para leitura por projeções e cache curto. Para milhões de registros, a evolução esperada é:

- projections analíticas por período;
- materialized views por tenant/período;
- agregações incrementais;
- índices compatíveis com filtros reais;
- réplicas de leitura quando houver evidência.

Não consultar aggregates completos para compor métricas corporativas.

## Segurança

O acesso exige:

- usuário autenticado;
- membership ativa na organização;
- permission key `analytics.view`;
- provider tenant-scoped;
- RLS e filtros por `organization_id`.

Cross-tenant deve falhar por autorização server-side e/ou RLS.

## Workspace

O Workspace contém:

- cabeçalho;
- filtros globais;
- KPIs principais;
- abas por área;
- detalhe/drill-down por métrica;
- gráficos simples apenas quando úteis;
- estados de loading, error, empty, forbidden e dados parciais.

Exportação e IA ficam apenas preparadas conceitualmente; não estão implementadas nesta fundação.
