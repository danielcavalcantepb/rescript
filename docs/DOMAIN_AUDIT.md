---
Status: Active
Owner: Architecture and Product Architecture
Last-Reviewed: 2026-07-28
Version: 1.0.0
Type: Canonical
Scope: Evidence-based domain audit and prerequisites for reconciled indicators
Supersedes: None
Superseded-By: None
Related-Modules: Catalog, Customers, Suppliers, Purchasing, Sales, Inventory, Finance, Fiscal, Organizations, Permissions
---

## Product creation dependency resolved

The Catalog creation flow now has a canonical transaction boundary and an immutable initial-cost fact. Pricing and Inventory retain ownership; the remaining work is the dedicated Wizard UX, not a missing domain contract.

# Auditoria de Domínio

## Autoridade e método

Esta auditoria reconcilia o [Documento Mestre](./MASTER_PRODUCT_DOCUMENT.md), [Module Status](./MODULE_STATUS.md), migrations e módulos executáveis. Ela não cria comportamento novo: campos, eventos e contratos marcados **ausentes** são requisitos para decisão/implementação posterior, não autorização para preencher dados fictícios.

## Matriz por módulo

| Módulo | Estado atual e entidades/relacionamentos | Regras, RLS e auditoria existentes | Lacunas: campos, regras, eventos, queries e índices | Dependências |
|---|---|---|---|---|
| Produtos | Produto simples/variável, Variant, categoria, marca, atributo/valor e assignment; Variant é unidade identificável. | Tenant, `catalog.*`, lifecycle/history e projeção estruturada. | Preço, saldo e custo não pertencem ao Product; faltam filtro avançado consolidado, imagem, contexto fiscal e cutover. Índices compostos para tenant+status+categoria/marca/atributo devem ser validados no plano de query. | Pricing, Inventory, Sales, Purchasing, Fiscal. |
| Categorias | Category com parent, slug, status e ordenação. | Tenant, permissões, auditoria e prevenção de ciclos no contrato vigente. | Confirmar limite de profundidade e índice tenant+parent+status; evento de reordenação somente se ordenação virar fato operacional. | Produtos e busca. |
| Marcas | Brand ligada ao Product. | Tenant, permissões e auditoria canônicos. | Falta agregação comercial/estoque; índice tenant+slug e tenant+status para consulta. | Produtos, Analytics. |
| Clientes | Customer formalizado com Organization, Company e Branch obrigatórias; dados principais, pessoa/documentos, address principal, acquisition source e Child/Dependent. | Lifecycle `draft/active/inactive/archived`, RLS/RBAC/auditoria e eventos estão definidos no Core; a implementação permanece pendente. | Falta implementar o Customer Workspace, projeções comerciais/financeiras, catálogo persistente de origem, dependentes e índices de busca normalizada por organização/documento/email/telefone. Cliente ativo, recorrência, última compra, ticket e saldo aberto agora possuem contrato de leitura derivada. | Sales, Finance/Receivable, Analytics, CRM. |
| Fornecedores | Supplier, contatos, endereços, history e search. | RLS, permissões e auditoria via domínio. | Falta contexto de compras/financeiro, custos e devoluções. Índices normalizados equivalentes a Customer. | Purchasing, Receiving, Payable. |
| Compras | Purchase Order, itens, snapshots, número, lifecycle e busca. | Lifecycle, `purchasing.orders.*`, RLS e history append-only. | Falta picker canônico, contrato de custo, aprovação/cotação e consulta de pendência agregada. Índices tenant+status+data e itens por variant devem sustentar listas. | Supplier, Catalog, Pricing, Receiving. |
| Vendas | Quotation/Sales Order, itens e snapshots de cliente/produto/preço, history e search. | Lifecycle, Sales permissions, audit e validação monetária no servidor. | Faltam contratos de vendedor, canal, filial, entrega, condição/pagamento e efeito confirmado em estoque/financeiro. Eventos de SaleConfirmed/Cancelled devem ser definidos junto aos efeitos. Índices tenant+status+data/customer e item+variant. | Customer, Pricing, Inventory, Receivable. |
| Estoque | Ledger append-only, balance/projeção, local, movimentos, transferências e fluxos de reserva/picking/packing/shipment conforme maturidade. | Atomicidade, idempotência, locks, RLS e auditoria nos fluxos críticos. | Falta valuation/custo médio aprovado, cutover de rotas e contrato de baixo estoque/sem giro. Índices ledger por tenant+variant+timestamp e balance por tenant+location+variant são críticos. | Variant, Receiving, Sales, Purchasing. |
| Financeiro | Receivable/Payable, parcelas, Payment, PaymentAllocation, CashAccount e CashLedger compõem o Finance operacional. | Commands, RLS, permissões, history/audit e ledger append-only são obrigatórios; branch é obrigatória em fatos financeiros. | Conciliação bancária, bancos, encargos financeiros, centro de custo, valuation e integrações externas permanecem futuros. Índices tenant/company/branch+status+due_date, conta+ocorrido e origem sustentam consultas. | Sales, Customers, Suppliers, Payments, Cash. |
| Fiscal | Boundary e contratos de fonte documentados; sem módulo operacional aprovado. | Exige tenant, RBAC, audit e snapshots quando existir. | Faltam TaxProfile, classificação, operação, regra, resolver, documento, projection e queries. Não há eventos fiscais operacionais. | Catalog, Sales, Purchasing, Inventory. |
| Usuários | Auth/Supabase session, membership e role presets. | Sessão, escopo organizacional e permissões base. | Faltam papéis customizados, escopos, SoD, convite/administração e definição de vendedor como papel/entidade distinta. Índices membership tenant+user e auditoria administrativa. | Organizations, Permissions, Sales. |
| Empresas | Organization e membership existentes; contexto de organização é transversal. | Tenant/RLS é contrato central; criação possui RPC. | Faltam contrato de filial/unidade, suspensão, suporte e governança administrativa completa. Índices para contexto ativo e memberships. | Todos os módulos. |

## Contratos necessários para indicadores

| Contrato | Definição mínima a ser aprovada | Fonte atual | Status e bloqueio |
|---|---|---|---|
| Receita | Soma de totais de vendas **confirmadas** no intervalo, moeda e tenant; origem navegável. | Sales possui pedido/snapshots, mas efeito confirmado depende do lifecycle oficial. | Parcial: requer definir fato comercial confirmado. |
| Ticket médio | Receita confirmada / número de pedidos confirmados no mesmo filtro. | Depende de Receita. | Bloqueado pela confirmação de venda. |
| Lucro | Receita confirmada menos custo reconhecido dos itens vendidos. | Inventory não possui valuation/custo médio aprovado. | Não pronto. |
| Margem | Lucro / Receita, com comportamento explícito para receita zero. | Depende de Lucro. | Não pronto. |
| Custo do produto | Custo por Variant com origem, vigência e política de reconhecimento. | Não existe autoridade canônica. | Não pronto; não usar preço de compra como substituto. |
| Custo médio | Política de valuation por variant/local e eventos de entrada/saída. | Ledger existe; valuation não. | Não pronto. |
| Fluxo de caixa | Entradas e saídas **postadas** por conta e data, incluindo reversão append-only. | Cash Ledger ausente. | Não pronto. |
| Saldo de caixa | Soma de Cash Ledger por CashAccount. | CashAccount/Ledger ausentes. | Não pronto. |
| Receita/Despesa financeira | Crédito/débito postado, origem e documento. | AP parcial; Payments/Cash incompletos. | Não pronto. |
| Recebimento | Settlement de Receivable, conta, valor, data, alocação e reversão. | AR/Payments não operacionais. | Não pronto. |
| Pagamento | Settlement de Payable, conta, valor, data, alocação e reversão. | AP existe; Payments não. | Não pronto. |
| Conta bancária | CashAccount: organização, código, nome, tipo, status e moeda. | Ausente. | Não pronto. |
| Centro de custo | Entidade/assignment por documento financeiro, hierarquia e rateio aprovados. | Ausente. | Não pronto. |
| Movimentação financeira | CashEntry imutável: tipo, valor, conta, data, origem, documento e actor. | Ausente. | Não pronto. |
| Inadimplência | Parcela aberta com vencimento anterior à data de referência, política de grace period. | AP tem parcelas; AR não. | Não pronto para clientes. |
| Comissão | Regra de elegibilidade, vendedor, base, percentual/valor, estado e reversal. | Ausente. | Fora do horizonte atual. |
| Meta | Escopo, período, dimensão, valor-alvo e estado. | Ausente. | Fora do horizonte atual. |
| Vendedor | Entidade ou papel comercial, vínculo organizacional, status e ownership de venda. | Não definido; usuário não equivale automaticamente a vendedor. | Bloqueado por decisão de domínio. |
| Filial | Unidade organizacional, endereço, status, escopo de estoque/documentos. | Não existe contrato aprovado. | Bloqueado por decisão de domínio. |

## Matriz de indicadores do Documento Mestre

| Indicador | Fórmula/fonte | Entidades | Status | Pronto? | Motivo quando não |
|---|---|---|---|---|---|
| Faturamento hoje/período | Receita confirmada no intervalo | Sales Order, itens | Parcial | Não | confirmação comercial e projeção reconciliada pendentes |
| Vendas/Pedidos | Contagem de pedidos confirmados | Sales Order | Parcial | Não | lifecycle de confirmação/efeitos ainda não aprovado |
| Ticket médio | Receita / pedidos confirmados | Sales Order | Bloqueado | Não | depende de Receita confirmada |
| Clientes | Contagem por tenant, company, branch e status | Customer | Contrato definido | Sim, para total e ativos após implementação | cliente ativo é status `active`; projeção/read query ainda precisa ser implementada |
| Clientes recorrentes | Clientes com duas ou mais vendas confirmadas no período | Customer, Sales Order | Contrato definido | Não | depende da projeção de Sales confirmada por cliente |
| Última compra / ticket por cliente | Última venda confirmada; receita confirmada / pedidos confirmados do cliente | Customer, Sales Order | Contrato definido | Não | depende de Analytics comercial por cliente |
| Saldo aberto por cliente | Soma de recebíveis abertos autorizados | Customer, Receivable | Contrato definido | Não | depende da projeção Finance/Receivable por cliente |
| Produtos/variantes | Contagem por tenant/status | Product, Variant | Atual | Sim | filtros avançados não impedem total |
| Contas a receber | Soma de parcelas abertas por vencimento | Receivable, Installment | Planejado | Não | aggregate não operacional |
| Contas a pagar | Soma de parcelas abertas por vencimento | Payable, Installment | Atual | Sim, no escopo AP | settlement ainda ausente |
| Valor/quantidade em estoque | Balance derivado do ledger; valor requer valuation | Ledger, Balance, Variant | Parcial | Quantidade: Sim; Valor: Não | valuation/custo médio ausentes |
| Itens críticos/ruptura | disponibilidade versus regra de mínimo | Balance, Variant | Parcial | Não | mínimo/criticidade canônica ausentes |
| Tendência de faturamento | série temporal de Receita | Sales Order | Bloqueado | Não | receita confirmada/projeção ausentes |
| Ranking produto/marca/categoria | agregação de venda confirmada | Sales, Product, Brand, Category | Bloqueado | Não | mesmo bloqueio comercial |
| Ranking vendedor | agregação por vendedor | Sales, Seller | Bloqueado | Não | Seller inexistente |
| Entrada/saída/ajuste estoque | movimentos do ledger no período | Inventory Ledger | Atual | Sim | condicionado a permissão e projection de leitura |
| Financeiro por origem | Cash credits/debits postados | Cash Ledger | Planejado | Não | Cash Ledger ausente |
| Vencido/vence 7/30 dias | parcelas abertas por due date | Payable/Receivable | Parcial | AP: Sim; AR: Não | Receivable ausente |

## Dependências críticas e sequência

1. Definir fato de venda confirmada e seus efeitos aprovados.
2. Aprovar vendedor e filial como contratos separados de usuário/empresa.
3. Implementar Receivable, Payments/Allocation e CashAccount/CashLedger; só então caixa, fluxo, inadimplência e financeiro completo.
4. Aprovar política de valuation/custo médio antes de lucro, margem e valor de estoque.
5. Criar projeções analíticas materializadas ou equivalentes somente sobre fatos reconciliados.
6. Implementar Dashboard Executivo após as fontes acima; cards sem base devem declarar lacuna, nunca zero fictício.

## Atualização — contratos fundamentais

Branch, PaymentTerm e InventoryPolicy foram implementados como aggregates organizacionais. Permanecem fora de escopo nesta fundação os efeitos consumidores: atribuição de filial a documentos legados, geração de receivable por Sales e alteração de disponibilidade por política. Esses efeitos pertencem à sprint de confirmação de Sales Order.

## Atualização — expansão oficial de Customer

O contrato de Customer foi expandido sem implementação técnica nesta fase. Ownership obrigatório por Organization, Company e Branch; lifecycle `draft/active/inactive/archived`; dados pessoais/jurídicos, address principal, dependentes e AcquisitionSource passam a ser requisitos canônicos. `draft` é cadastro iniciado, com informações ainda incompletas e sem elegibilidade operacional; somente `active` pode participar de novas operações. Customer não passa a ser autoridade de Sales ou Finance: vendas, títulos, caixa e suas projeções continuam pertencendo aos respectivos domínios. A próxima sprint deve materializar este contrato incrementalmente, com RLS, RBAC, auditoria, migrações aditivas e read models autorizados.

## CAP — Onboarding Session Refactor 001

O agregado de aquisição pública foi consolidado como `OnboardingSession`, separado do aggregate operacional Customer. A migração preserva IDs, consentimentos, perfil e retomada por renomeação de tabelas; RLS e as RPCs `cap_*` são mantidas. Business Identity será dependente apenas de `onboarding_id` quando implementado, sem duplicar fatos da sessão.

## Políticas transversais

Todas as leituras e mutações de domínio devem continuar tenant-aware, com RLS, validação server-side de actor/permissão/lifecycle, auditoria de mutação e projeções que nunca são fonte de verdade. Queries de indicador precisam ser server-side, paginadas quando retornarem linhas e indexadas conforme filtros efetivamente aprovados.
