---
Status: Active
Owner: Domain Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: domain / Queries
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Queries (Consultas)

> Uma **query** é a intenção de **ler** sem efeito colateral. Consultas alimentam telas, a Central de Decisão e os insights. Nunca mudam estado.
> Status: Modelagem conceitual (DDD). Escrita em `Commands.md`.

---

## 1. Princípios

- **Sem efeito colateral:** ler nunca altera o domínio.
- **Respeitam tenant e permissão:** toda query é filtrada por organização e pelo que o papel pode ver.
- **Podem usar dados derivados/materializados** (saldos, projeções) — que são reconstruíveis da fonte (G3).
- **Separação conceitual leitura/escrita:** o domínio distingue comandos (mudam) de queries (leem); isso **não** implica CQRS técnico agora — é clareza de modelo.

---

## 2. Catálogo de Queries por Contexto

### Catalog & Customers
| Query | Retorna | Quem vê |
|---|---|---|
| `SearchCustomers` | Clientes por nome/documento | quem tem `customers.view` |
| `GetCustomerHistory` | Vendas/recebíveis do cliente | `customers.view` + financeiro p/ valores |
| `SearchProducts` | Produtos/variantes por nome/SKU/barcode | `products.view` |
| `GetProductDetails` | Produto + variantes + preço/custo | `products.view` (custo só com permissão) |

### Inventory
| Query | Retorna | Observação |
|---|---|---|
| `GetStockBalance` | Físico/reservado/disponível de uma variante | Derivado do ledger |
| `ListStockMovements` | Histórico do ledger de um item | Rastreável |
| `ListLowStock` | Itens no/abaixo do mínimo | Alimenta insight/decisão |

### Sales
| Query | Retorna |
|---|---|
| `GetSale` | Sale + itens + estado (fase) |
| `ListSales` | Por período/cliente/vendedor/estado |
| `GetSalesSummary` | Totais do dia/período (**confirmadas**) |
| `ListOpenQuotes` | Orçamentos ativos |
| `ListOpenSaleOrders` | Pedidos (fase Pedido) em aberto |

### Finance
| Query | Retorna |
|---|---|
| `GetReceivable` | Recebível + parcelas + situação derivada |
| `ListReceivables` | A receber por período/cliente/situação |
| `ListOverdue` | Parcelas vencidas (inadimplência) |
| `GetCashProjection` | Caixa projetado (projeção rastreável) |
| `ListPayments` | Recebimentos por período/forma |

### Intelligence / Decision Center
| Query | Retorna |
|---|---|
| `GetDecisionCenter` | Blocos priorizados da Home (respeita papel dono/operador) |
| `ListActiveInsights` | Insights ativos ordenados por relevância |
| `GetInsightTrace` | Regra + registros + período + natureza de um insight (drill-down) |

### Access / Audit / Billing
| Query | Retorna |
|---|---|
| `ListMembers` | Membros e papéis da organização |
| `ListMyOrganizations` | Organizações em que o usuário tem membership |
| `ListAuditEntries` | Trilha de ações sensíveis (permissão restrita) |
| `GetSubscriptionStatus` | Plano, estado, limites/uso |

---

## 3. Queries que alimentam a inteligência

A Central de Decisão (`architecture/DecisionCenterArchitecture.md`) responde 5 perguntas via queries agregadas:

| Pergunta | Query base |
|---|---|
| Como está a empresa? | `GetSalesSummary`, `GetCashProjection`, `GetStockBalance` (agregados) |
| O que mudou? | comparação de `GetSalesSummary` entre períodos |
| O que exige atenção? | `ListActiveInsights` (severidade atenção/crítico), `ListOverdue`, `ListLowStock` |
| O que pode acontecer? | `GetCashProjection`, projeções de ruptura |
| Qual ação tomar? | `suggested_action` via `ListActiveInsights` |

> Toda query de insight permite **drill-down** (`GetInsightTrace`) — a rastreabilidade é requisito (N1).

---

## 4. Regras gerais de Queries

1. **Nunca mudam estado.**
2. **Sempre filtram por tenant e permissão** (dono vê financeiro; operador pode não ver).
3. Podem ler **materializações** (cache/projeção), sempre reconstruíveis da fonte.
4. Diferença **dono × operador** é aplicada na composição (`DecisionCenterArchitecture.md`).
5. Estados **derivados** (vencida, disponível) são calculados na leitura, não persistidos como verdade.

---

## 5. Nota sobre CQRS

Separar comandos de queries aqui é **conceitual** (clareza de intenção). **Não** decidimos, nesta fase, aplicar CQRS físico (bancos/read models separados) — isso seria decisão de escala (`architecture/Scalability.md`), tomada só se e quando houver necessidade mensurável. O domínio apenas deixa a fronteira leitura/escrita explícita para facilitar essa evolução, se vier.
