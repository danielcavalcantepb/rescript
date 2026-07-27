---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 07_ROADMAP
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Roadmap do ERP

## Responsabilidade deste documento

Este documento organiza a evolução do produto por fases e prioridade. O roadmap fecha ciclos operacionais antes de expandir horizontalmente. Datas e capacidade de equipe são planejadas separadamente.

## Critérios de priorização

1. confiança e integridade dos dados;
2. fechamento de ciclo end-to-end;
3. produtividade e redução de cliques;
4. dependências entre módulos;
5. diferenciação do produto;
6. necessidade do público-alvo;
7. escalabilidade e operação SaaS;
8. risco regulatório ou financeiro.

## Estado atual resumido

Existem fundações reais de Organizations/Memberships, Catalog, Products/Variants, Pricing, Inventory, Customers, Suppliers, Purchase, Goods Receipt e Accounts Payable. Sales permanece mock/planejado. Finance ainda não fecha receber/pagar/pagamentos/caixa. Central e Search possuem fundação de UI, mas ainda não operam integralmente com dados cross-domain reais.

## Fase 0 — Coerência e cutover

**Prioridade imediata.**

- definir navegação e URLs canônicas;
- usar labels operacionais: Compras e Clientes;
- eliminar duplicidade visual Produtos/Catálogo;
- concluir transição do estoque product-scoped para variant-scoped;
- corrigir quick actions que abrem listas genéricas;
- identificar mocks/placeholders;
- padronizar Workspace, cadeia documental e timeline;
- automatizar dependency rules e bundle boundaries.

**Resultado:** uma superfície coerente para receber novos módulos sem consolidar legado.

## Fase 1 — Sales

**Prioridade crítica.**

- Sale Aggregate único;
- rascunho, orçamento, pedido, confirmação e terminais;
- itens por Variant e snapshots;
- price resolution;
- reserva no pedido;
- confirmação atômica com Inventory e Receivable;
- cancelamento/reversal;
- discount policy e approval;
- Sales Workspace e busca/lista em escala.

**Justificativa:** fecha o principal ciclo de valor e habilita Customer 360, contas a receber e indicadores comerciais.

## Fase 2 — Finance transacional

**Prioridade crítica.**

- Accounts Receivable e installments;
- Payments, Allocations e Reversals;
- pagamento de Accounts Payable;
- baixa parcial e idempotência;
- agenda de vencimentos e aging;
- contas bancárias/caixas mínimos;
- fluxo previsto versus realizado;
- Finance Workspace.

**Justificativa:** transforma operações em verdade financeira rastreável.

## Fase 3 — Central de Decisão

**Prioridade alta, após fatos suficientes.**

- read models de Hoje;
- prioridades e filas por papel;
- rascunhos e recentes reais;
- baixo estoque, vencidos, pedidos atrasados e divergências;
- origem/confiança e CTA deep-linked;
- dismiss, deduplicação e freshness;
- estados de dados insuficientes.

**Justificativa:** materializa o diferencial do produto sem fabricar inteligência antes da base transacional.

## Fase 4 — Procurement profissional

**Prioridade alta.**

- Procurement Workspace;
- datas prometidas, lead time e atrasos;
- PO → Receipts → Ledger → Payable visível;
- divergências e tolerâncias;
- devolução/reversal de recebimento;
- approval por alçada;
- requisição/sugestão de compra quando validada;
- anexos e referências externas.

**Justificativa:** aprofunda um ciclo já existente e aumenta valor rapidamente.

## Fase 5 — Inventory Control

**Prioridade alta.**

- reservas completas;
- contagem física;
- mínimo, máximo, reposição e cobertura;
- transferências em trânsito;
- custo médio e valuation;
- reconciliação ledger × projection;
- lote, série e validade conforme ICP;
- Inventory Control Center.

**Justificativa:** estoque é fundamento de vendas, compras, margem e confiança.

## Fase 6 — Master data em escala

**Prioridade média-alta.**

- Product Workspace completo;
- Variant Workbench;
- Pricing em massa, vigência e simulação;
- Brands, Categories e Attributes completos;
- import/export assíncrono;
- qualidade e merge de duplicados;
- universal search;
- bulk actions e virtualização.

**Justificativa:** grandes catálogos exigem eficiência operacional depois dos ciclos centrais estarem fechados.

## Fase 7 — Administração enterprise

**Prioridade média-alta.**

- custom roles e scopes;
- alçadas e segregação de funções;
- Audit Center;
- support access temporário;
- billing e entitlements;
- políticas organizacionais;
- retenção, exports e jobs;
- SLOs, observabilidade e operação SaaS.

**Justificativa:** necessário para centenas de empresas e equipes maiores.

## Fase 8 — Fiscal e integrações

**Prioridade dependente do mercado.**

- boundary fiscal por adapters;
- documentos e status assíncronos;
- integrações bancárias e contábeis;
- marketplaces, logística e canais;
- webhooks idempotentes;
- outbox durável;
- API pública versionada quando houver consumidores.

**Justificativa:** alta relevância competitiva no Brasil, sem contaminar o núcleo com providers.

## Fase 9 — Reporting e dimensões analíticas

**Prioridade posterior à qualidade dos fatos.**

- relatórios operacionais rastreáveis;
- margem, giro, aging, compras e fluxo de caixa;
- exports agendados;
- centros de custo/dimensões conforme necessidade;
- read replicas/materialized models para leitura pesada.

**Justificativa:** reporting confiável depende de fatos e cadeia documental completos.

## Trilhos transversais permanentes

Toda fase inclui:

- segurança multi-tenant;
- permissions e audit;
- acessibilidade;
- performance e volume;
- migrations e RLS tests;
- observabilidade;
- documentação e ADRs;
- Product Design review;
- remoção controlada de legado;
- E2E dos fluxos críticos.

## Condições para avançar de fase

- dependências anteriores concluídas;
- quality gates verdes;
- ciclo principal demonstrável;
- nenhuma operação crítica parcial;
- métricas e riscos conhecidos;
- Workspace produtivo;
- documentação atualizada;
- decisão de Go/No-Go registrada quando houver cutover.

## Itens deliberadamente não priorizados

- microserviços sem necessidade mensurável;
- dashboard builder;
- customização irrestrita de telas/processos;
- contabilidade completa antes do financeiro operacional;
- branches de domínio por segmento;
- marketplace de extensões antes de API/contracts maduros;
- IA generativa sem dados rastreáveis e guardrails.
