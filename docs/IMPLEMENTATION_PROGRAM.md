---
Status: Active
Owner: Engineering and Product Architecture
Last-Reviewed: 2026-07-28
Version: 1.0.0
Type: Canonical
Scope: Executable delivery sequencing, implementation surfaces, verification and rollback
Supersedes: None
Superseded-By: None
Related-Modules: All
---

## Catalog product creation progress

The transaction and immutable valuation contracts are implemented. The upcoming Product Creation Wizard should consume `create_product_with_initial_setup` through the Catalog server API and present derived margin read-only.

# Programa Oficial de Implementação

## Autoridade e regra de execução

Este plano executa, mas não redefine, o [Documento Mestre](./MASTER_PRODUCT_DOCUMENT.md), o [Backlog](./ENGINEERING_BACKLOG.md), a [Auditoria de Domínio](./DOMAIN_AUDIT.md) e a [Core Domain Specification](./CORE_DOMAIN_SPECIFICATION.md). Cada item deve confirmar que sua entidade, evento e invariant já estão especificados antes de começar código.

## Ordem de implementação

| Ordem | Domínio | Justificativa técnica e valor |
|---|---|---|
| 1 | Sales confirmation contract | Define o fato comercial que alimenta receita, pedido e efeitos permitidos; sem ele, métricas seriam especulativas. |
| 2 | Finance transactional core | Receivable, Payments e Cash Ledger fecham títulos, settlement e caixa; habilitam indicadores financeiros reais. |
| 3 | Inventory valuation | Custo de produto/médio sobre ledger habilita valor de estoque, lucro e margem sem saldo paralelo. |
| 4 | Seller and Branch contracts | Define dimensões de vendedor e filial sem confundir usuário com vendedor ou organização com unidade. |
| 5 | Analytical projections | Materializa fatos já reconciliados e torna filtros/drill-down escaláveis. |
| 6 | Dashboard Executivo | Consome somente projeções e fatos aprovados, expondo lacunas de dados. |
| 7 | Customer Workspace/CRM | Usa Sales e Finance para contexto comercial e financeiro verdadeiro. |
| 8 | Fiscal Foundation | Depende de Variant e fontes operacionais estáveis; não inclui emissão. |
| 9 | Integrações | Vem por último para não propagar contratos instáveis; exige outbox e observabilidade. |

## Superfícies padrão por implementação

| Superfície | Regra |
|---|---|
| Tabelas/migrations | Apenas quando a especificação definir persistência; constraints, índices e rollback de migration compatíveis. |
| Services/repositories | Commands, services e ports do módulo; nenhuma regra em UI ou repositório. |
| Policies | RLS, tenancy, permissões PostgreSQL e validação server-side. |
| Hooks/componentes/páginas | React Query com query keys/invalidação, estados loading/empty/error/forbidden e responsividade. |
| Testes | Domínio, RPC/integration, RLS, cross-tenant, concorrência/idempotência e UI conforme risco. |
| Documentação | Core Specification, Module Status, documento do módulo, ADR quando necessário e changelog conforme workflow. |

## Plano por domínio

### 1. Sales confirmation contract

**Progresso:** Implementado em 2026-07-28. A confirmação exige Branch e PaymentTerm, registra histórico/auditoria, cria Receivable idempotente e só reserva estoque quando a InventoryPolicy permitir.

**Objetivo:** tornar confirmação de Sales Order um fato comercial formal, sem antecipar estoque, financeiro ou fiscal.  
**Pré-requisitos/dependências:** Sales snapshots, Pricing, Customer, Variant, Core Specification; decisão explícita dos efeitos de confirmação.  
**Entregas:** lifecycle final, evento `SalesOrderConfirmed`, projection comercial e contratos de consumer.  
**Critérios de aceite/DoD:** transição validada no servidor/PostgreSQL; tenant/RLS/RBAC; history/audit; idempotência; testes de concorrência; UI/rotas e documentação atualizadas.  
**Riscos:** confirmação duplicada, efeitos implícitos, retorno/cancelamento incoerente.  
**Testes/rollback:** integração transacional e cross-tenant; migration aditiva; feature flag/cutover somente após reconciliação.  
**Impacto:** desbloqueia receita, pedidos e ticket; não altera Inventory/Finance sem consumer aprovado.

| Tabelas/migrations | Services/repos | Policies | Hooks/componentes/páginas | Testes/documentação |
|---|---|---|---|---|
| Sales projection/event outbox somente se especificado | Sales command, lifecycle policy, read projection repo | Sales permissions/RLS | Workspace action/status/history | domain, RPC, idempotência; Core, Sales, Module Status |

### 2. Finance transactional core

**Objetivo:** implementar Receivable, Payment Allocation/Reversal, CashAccount e CashLedger append-only, com Branch obrigatória e transferência como par atômico debit/credit.  
**Pré-requisitos/dependências:** Sales confirmation, AP, Money, Organization, Finance contracts.  
**Entregas:** títulos/parcelas, settlement parcial/integral, crédito/débito/reversal, transferência, timeline, fluxo realizado/previsto/projetado e consultas paginadas.  
**Aceite/DoD:** saldo nunca negativo; parcelas preservam valor original; ledger não editável; posting idempotente e bloqueado concorrencialmente; RLS/audit/permissões completos.  
**Riscos:** dupla baixa, caixa divergente, reversão destrutiva.  
**Testes/rollback:** Supabase transacional, rollback total, RLS e concorrência; migrations aditivas e write path atrás de cutover.  
**Impacto:** habilita receber, pagar, fluxo, saldo e inadimplência; alimenta Analytics. Conciliação permanece fora do incremento.

| Tabelas/migrations | Services/repos | Policies | Hooks/componentes/páginas | Testes/documentação |
|---|---|---|---|---|
| receivables, installments, payments, allocations, cash_accounts, cash_ledger, histories/search | Receivable/Payment/Cash services e repos | finance/cash RLS e permissions | Finance Workspace, títulos, pagamentos, caixa/timeline | transaction, reversal, allocation, tenant; Finance, Core, Module Status |

### 3. Inventory valuation

**Objetivo:** definir e implementar custo do produto e custo médio derivado do ledger.  
**Pré-requisitos/dependências:** decisão de valuation na Core Specification/ADR, inbound Receiving e movimentos Inventory.  
**Entregas:** política de custo, projection de valuation e consultas autorizadas.  
**Aceite/DoD:** custo nunca é coluna livre de Product; eventos de entrada/saída produzem valuation reproduzível; acesso a custo separado; reconciliação com ledger.  
**Riscos:** custo incorreto, retroatividade e performance em alto volume.  
**Testes/rollback:** cenários de custo zero/estoque negativo/concorrência; projeção reconstruível; nenhum overwrite de ledger.  
**Impacto:** habilita valor em estoque, lucro e margem.

| Tabelas/migrations | Services/repos | Policies | Hooks/componentes/páginas | Testes/documentação |
|---|---|---|---|---|
| valuation projection e índices, somente após ADR | valuation service/read repo | custo/margem permission-aware | Inventory summary e Analytics source, sem tela falsa | reconciliation/rebuild; Inventory, Core, ADR, Module Status |

### 4. Seller and Branch contracts

**Objetivo:** introduzir dimensões comerciais sem criar campos decorativos.  
**Pré-requisitos/dependências:** decisão de entidade Seller e Branch, Organization/Membership, Sales.  
**Entregas:** contracts, ownership, lifecycle, assignments e filtros autorizados.  
**Aceite/DoD:** usuário não é vendedor por inferência; filial não altera tenant; IDs são validados no servidor; audit e RLS completos.  
**Riscos:** duplicar User/Organization, escopo de estoque indevido.  
**Testes/rollback:** cross-tenant, remoção de membro, mudança de papel; migrations aditivas.  
**Impacto:** desbloqueia Sales, filtros e rankings por vendedor/filial.

| Tabelas/migrations | Services/repos | Policies | Hooks/componentes/páginas | Testes/documentação |
|---|---|---|---|---|
| sellers/branches/assignments somente após especificação | Seller/Branch services e repos | escopo org/unidade e Sales RBAC | seletores em Sales e filtros | lifecycle/tenant; Core, Sales, Organizations, Module Status |

### 5. Analytical projections

**Progresso:** Implementado em 2026-07-28 com views analÃ­ticas live para fatos confirmados de Sales, Finance, Customers, Products e preparaÃ§Ã£o de Inventory; APIs server-side para KPIs, rankings e sÃ©ries temporais; hooks React Query sem novo Dashboard. Views materializadas permanecem fora do incremento: a carga ainda nÃ£o justifica job de refresh e a leitura precisa refletir fatos confirmados imediatamente.

**Objetivo:** produzir fatos agregados por período e dimensão, com qualidade de dado e drill-down.  
**Pré-requisitos/dependências:** fatos de Sales, Finance e Inventory reconciliados; dimensões aprovadas.  
**Entregas:** read models/materialized views conforme decisão, queries server-side e metadados de qualidade.  
**Aceite/DoD:** cada métrica declara fonte/filtro/período; nenhuma projeção escreve fato; índices baseados em query real; reconstrução segura.  
**Riscos:** N+1, métrica sem base e vazamento cross-tenant.  
**Testes/rollback:** reconciliação contra fonte; benchmarks e RLS; views/projeções reconstituíveis.  
**Impacto:** dependência direta do Dashboard e relatórios.

| Tabelas/migrations | Services/repos | Policies | Hooks/componentes/páginas | Testes/documentação |
|---|---|---|---|---|
| projections/views e índices de período/dimensão | analytics provider/read services | `analytics.view`, custo/margem condicionado | hooks query-only, sem dashboard novo ainda | source/rebuild/RLS/performance; Analytics, Core, Module Status |

### 6. Dashboard Executivo

**Progresso:** Implementado em 2026-07-28 como Centro de Comando responsivo. Consome exclusivamente a API Analytics para KPIs, série temporal, ranking de produtos e feed operacional; não consulta tabelas operacionais nem recalcula indicadores no cliente.

**Objetivo:** apresentar decisões e exceções com fatos reais e drill-down.  
**Pré-requisitos/dependências:** Analytical projections, Sales confirmation, Finance e valuation quando o widget exigir.  
**Entregas:** cards, gráficos, filtros, alertas e links para origem; lacunas visíveis.  
**Aceite/DoD:** nada mockado; filtros server-side; cada card declara fonte; responsivo; `insights.view`; ausência de dado não vira zero.  
**Riscos:** aparência de BI sem verdade operacional e consultas custosas.  
**Testes/rollback:** testes de fonte/drill-down/RLS; rollout progressivo e fallback read-only atual.  
**Impacto:** centraliza Sales, Inventory e Finance sem alterar fatos.

| Tabelas/migrations | Services/repos | Policies | Hooks/componentes/páginas | Testes/documentação |
|---|---|---|---|---|
| nenhuma além de projections | Command Center/Analytics read services | insights/analytics RLS | `/app`, gráficos, filtros, cards e drill-down | source/no-data/responsive; Master, Analytics, Module Status |

### 7. CRM / Customer Workspace

**Objetivo:** materializar o agregado Customer oficialmente expandido e reunir relacionamento, documentos e pendências em um único contexto.
**Pré-requisitos/dependências:** contrato Customer congelado, Organization/Company/Branch, Sales confirmado, Receivable/Finance, Analytics e Search.
**Entregas:** dados principais e cadastrais por tipo de pessoa, address principal, AcquisitionSource, dependentes, busca/filtros, Workspace, timeline, relacionamentos e links de origem.
**Aceite/DoD:** ownership obrigatório por Organization/Company/Branch; lifecycle draft/active/inactive/archived; duplicidade de telefone/documento tratada; dados financeiros somente autorizados; paginação; sem N+1; cliente contextual preserva estado de Sales.
**Riscos/testes/rollback:** exposição indevida, duplicidade e timeline incompleta; RLS/RBAC/cross-tenant/empty state; migrations somente aditivas e rollout por abas, sem excluir cadastro existente.
**Impacto:** produtividade comercial e suporte.

| Tabelas/migrations | Services/repos | Policies | Hooks/componentes/páginas | Testes/documentação |
|---|---|---|---|---|
| extensão incremental de Customer, endereço principal, acquisition source, dependentes e projeções de relação quando necessárias | Customer command/read services e normalização de busca | customers + Finance/Sales visibility | lista, cadastro, detalhe, criação contextual, Workspace/timeline | tenant/RBAC/duplicidade/perf/UI; Customers, Sales, Finance, Analytics |

### 8. Fiscal Foundation

**Objetivo:** perfis, operações, regras, Tax Engine e documento interno; sem emissão.  
**Pré-requisitos/dependências:** FiscalSource contracts estáveis, Variant, Sales/Purchasing/Inventory.  
**Entregas:** regras/read preview/document builder e busca.  
**Aceite/DoD:** snapshot fiscal, lifecycle, RLS/audit, erro explícito sem regra; sem XML/SEFAZ/cálculo monetário.  
**Riscos/testes/rollback:** classificação errada; testes de contexto, tenant e múltiplas regras; migrations aditivas.  
**Impacto:** prepara emissão futura sem acoplar domínios.

| Tabelas/migrations | Services/repos | Policies | Hooks/componentes/páginas | Testes/documentação |
|---|---|---|---|---|
| fiscal profiles/rules/documents/projections | Tax Engine, resolver, builder/repos | fiscal RLS/permissions | Fiscal Workspace/preview/documents | rule/builder/RLS; Fiscal, Core, ADR |

### 9. Integrações

**Objetivo:** publicar/consumir conexões externas sem fonte paralela de verdade.  
**Pré-requisitos/dependências:** contratos estáveis, outbox, observabilidade, segurança e retenção.  
**Entregas:** eventos idempotentes, retries, DLQ e administração de credenciais.  
**Aceite/DoD:** autenticação/rate-limit, correlation, retry, deduplicação, monitoramento e tenant isolation.  
**Riscos/testes/rollback:** duplicidade, vazamento de segredo e falha de provider; testes de retry/DLQ; desligamento por feature flag.  
**Impacto:** habilita API, webhooks e futuros conectores.

| Tabelas/migrations | Services/repos | Policies | Hooks/componentes/páginas | Testes/documentação |
|---|---|---|---|---|
| outbox, deliveries, credentials metadata | integration services/workers/repos | secret access and tenant policies | admin/status somente após contrato | duplicate/failure/security; Integration, Observability, Module Status |

## Real Data Readiness

**Progresso:** código concluído em 2026-07-28. O runtime não importa mais o dataset legado de demonstração. Leituras analíticas incompletas são descartadas ou exibidas como indisponíveis, sem datas, pontos ou KPIs inventados. As migrations foram aplicadas com sucesso em banco Supabase local reconstruído. Achados de lint em funções SQL legadas devem ser tratados em sprint própria antes da operação comercial.

## CAP — Refactor 001 concluído em código

Antes de Billing, Provisioning, Lifecycle, Analytics e Business Identity, a raiz do CAP é `onboarding_session`. A migration é baseada em `ALTER ... RENAME`, preservando sessões e filhos existentes; rollback é o rename inverso apenas enquanto nenhum consumidor novo depender do contrato. A interface mantém as RPCs públicas `cap_*`; a certificação em PostgreSQL real continua obrigatória.

## Gates e rollback comuns

- Antes do merge: `typecheck`, `lint`, testes relevantes e completos, build client/SSR e migrations em banco limpo quando houver schema.
- Antes do cutover: reconciliação de projeções, teste de RLS em PostgreSQL real, plano de observabilidade e reversão.
- Rollback nunca apaga ledger/history; desabilita write path/feature flag, reverte somente migration reversível e reconstrói projeções a partir de fatos canônicos.
- Uma sprint só encerra quando Module Status, documentação do módulo e este plano refletirem o comportamento efetivamente entregue.

## Marco concluído: fundação estrutural

Branch, PaymentTerm e InventoryPolicy são pré-requisitos satisfeitos para a confirmação de Sales Order. O próximo incremento deve consumir esses contratos sem recriá-los: usar filial padrão/selecionada, resolver parcelas pelo PaymentTerm e consultar InventoryPolicy no comando transacional de confirmação.
