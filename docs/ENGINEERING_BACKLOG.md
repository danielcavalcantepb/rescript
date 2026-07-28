---
Status: Active
Owner: Product Architecture and Engineering
Last-Reviewed: 2026-07-28
Version: 1.0.0
Type: Canonical
Scope: Executive engineering planning, delivery sequence and portfolio health
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Backlog Executivo de Engenharia

## Autoridade e convenções

Este backlog deriva exclusivamente do [Documento Mestre de Produto](./MASTER_PRODUCT_DOCUMENT.md). Ele organiza execução; não altera regras de negócio, ADRs ou o estado factual, que permanece no [Module Status](./MODULE_STATUS.md).

| Campo | Convenção |
|---|---|
| Prioridade | **Must**, **Should**, **Could**, **Won't** (MoSCoW). Won't está fora do horizonte atual. |
| Complexidade | XS, S, M, L, XL. |
| Estimativa | Pontos relativos: XS=1, S=2, M=3, L=5, XL=8; nunca horas. |
| Status | Atual, Planejado, Em descoberta, Bloqueado ou Fora do horizonte. |

### Definição de pronto

Uma feature só é concluída com frontend quando aplicável; backend/commands oficiais; banco, constraints e migration quando persistir fatos; policies/RLS; auditoria; testes unitários, integração, permissão e tenant; responsividade e acessibilidade; documentação; typecheck, lint e build aprovados. Logs, performance e observabilidade são obrigatórios conforme o risco do fluxo.

## Mapa de dependências

```text
Catálogo -> Pricing -> Sales -> Receivable -> Payments -> Cash Flow
    |                    |
    +-> Purchasing -> Receiving -> Inventory Ledger -> Indicadores
Customers e Suppliers sustentam vendas e compras.
Administração, RBAC, auditoria e tenancy sustentam todos os módulos.
Fiscal Source -> Tax Engine -> Fiscal Documents -> Emissão futura.
```

## Saúde do produto

| Módulo | Status | Cobertura | Maturidade | Pronto para produção |
|---|---|---|---|---|
| Organizações, sessão e memberships | Atual | Foundation | Foundation | Parcial |
| App Shell/Navegação | Parcial | Foundation | Foundation | Não |
| Central de Comando/Métricas | Parcial | Read-only base | Partial | Controlado |
| Catálogo e variantes | Parcial | Domínio/workspace | Partial enterprise | Não |
| Pricing | Atual | Domínio/workspace | Functional | Sim no escopo atual |
| Customers e Suppliers | Atual | Workspace base | Functional partial | Sim no escopo atual |
| Purchasing e Receiving | Atual | Fluxo e ledger | Functional | Sim no escopo atual |
| Inventory/Ledger | Atual | Fluxos críticos | Hardened | Sim no escopo atual |
| Sales | Parcial | Pedido/snapshots | Partial enterprise | Não |
| Accounts Payable | Atual | Títulos | Functional | Sim no escopo atual |
| Receivable, Payments e Cash | Planejado | — | Planned | Não |
| Fiscal, CRM avançado e Integrações | Planejado | — | Planned | Não |
| Permissões/Auditoria | Atual | Foundation | Foundation | Parcial |

## Backlog por módulo

### Administração, permissões e auditoria

**Objetivo:** governar empresa, membros, papéis e rastreabilidade.  
**Valor:** crescimento multiusuário com segurança e controle.  
**Dependências:** organizações, memberships, sessão, RBAC e auditoria centrais.

#### Épico ADM-01 — Administração operacional
**Descrição:** consolidar membros, convites e papéis. **Objetivo:** autonomia administrativa. **Impacto:** implantação segura em equipes.

**Feature ADM-01.1 — Workspace de membros e papéis** — Valor entregue: administrar equipe sem suporte.

Como **administrador da empresa**  
Quero **convidar, remover e atribuir papéis a membros**  
Para **manter a equipe autorizada com segurança**.

Aceite: RBAC server-side e RLS; convite/revogação auditados; validação tenant; loading/erro/sucesso; testes de permissão/cross-tenant; responsividade.  
Prioridade **Must** · Complexidade **L** · Estimativa **5** · Status **Planejado**.

#### Épico ADM-02 — Centro de auditoria
**Descrição:** consulta global sem substituir histories de aggregates. **Objetivo:** investigação verificável. **Impacto:** menor risco e suporte mais rápido.

**Feature ADM-02.1 — Audit Center filtrável** — Valor entregue: rastrear alteração por entidade, ator e período.

Como **administrador autorizado**  
Quero **consultar eventos auditáveis por entidade, usuário e período**  
Para **investigar alterações sem acessar o banco**.

Aceite: paginação/filtros server-side; dados seguros antes/depois; links de origem; RBAC/RLS; logs; testes de performance.  
Prioridade **Should** · Complexidade **L** · Estimativa **5** · Status **Planejado**.

### Catálogo, produtos e variantes

**Objetivo:** manter identidade comercial pesquisável de produtos e variantes.  
**Valor:** reduz item incorreto em compra, venda e estoque.  
**Dependências:** admin, busca/projeção, Inventory e Pricing como domínios distintos.

#### Épico CAT-01 — Cutover canônico do catálogo
**Descrição:** consolidar rotas e Workspaces oficiais. **Objetivo:** uma única jornada de produto. **Impacto:** elimina ambiguidade legado/canônico.

**Feature CAT-01.1 — Produto e variante em rotas canônicas** — Valor entregue: cadastro e consulta consistentes.

Como **operador de catálogo**  
Quero **criar, localizar e abrir produtos e variantes pela navegação canônica**  
Para **não escolher entre telas com comportamentos diferentes**.

Aceite: links compatíveis; busca paginada; permissões/auditoria; estados UX; testes de rota; documentação de cutover.  
Prioridade **Must** · Complexidade **L** · Estimativa **5** · Status **Planejado**.

#### Épico CAT-02 — Descoberta estruturada
**Descrição:** filtros por categoria, marca, atributo, SKU e status. **Objetivo:** responder perguntas operacionais. **Impacto:** produtividade no catálogo grande.

**Feature CAT-02.1 — Filtros avançados combináveis** — Valor entregue: localizar variantes relevantes sem planilha.

Como **gestor de estoque**  
Quero **filtrar variantes por categoria, marca e atributos combinados**  
Para **encontrar rapidamente o conjunto que preciso analisar**.

Aceite: projeção oficial; filtros/paginação/ordenação server-side; sem carga total no browser; tenant/RLS; empty state; testes combinatórios e performance.  
Prioridade **Must** · Complexidade **L** · Estimativa **5** · Status **Planejado**.

### Pricing

**Objetivo:** ser a única autoridade de preço de venda vigente.  
**Valor:** preço explicável e margem protegida.  
**Dependências:** Catálogo/Variant, RBAC e auditoria.

#### Épico PRC-01 — Operação escalável de tabelas
**Descrição:** evoluir manutenção sem duplicar preço. **Objetivo:** mudanças controladas. **Impacto:** menos erro comercial.

**Feature PRC-01.1 — Atualização em massa validada** — Valor entregue: manutenção de listas em escala.

Como **gestor comercial autorizado**  
Quero **atualizar itens selecionados de uma tabela com validação de vigência**  
Para **manter preços consistentes sem editar item a item**.

Aceite: conflitos impedidos; autorização; auditoria por item; idempotência/rollback; testes de concorrência e tenant.  
Prioridade **Should** · Complexidade **M** · Estimativa **3** · Status **Planejado**.

### Vendas, clientes e CRM

**Objetivo:** conduzir venda do cliente ao pedido com snapshots.  
**Valor:** acelera emissão, preserva contexto e reduz abandono.  
**Dependências:** Customers, Catalog, Pricing, Permissions, Audit e contratos de estoque/financeiro.

#### Épico SAL-01 — Sales Order Workspace completo
**Descrição:** fechar a jornada comercial sem campos fictícios. **Objetivo:** pedido como Workspace. **Impacto:** menos cliques e erros.

**Feature SAL-01.1 — Cliente contextual no pedido** — Valor entregue: venda não é interrompida por cadastro auxiliar.

Como **vendedor**  
Quero **criar um cliente no drawer do pedido e selecioná-lo automaticamente**  
Para **continuar a venda sem perder itens, descontos ou observações**.

Aceite: domínio oficial; duplicidade; cache/invalidação; foco acessível; RBAC/RLS; preservação de estado testada; auditoria e responsividade.  
Prioridade **Must** · Complexidade **L** · Estimativa **5** · Status **Planejado**.

**Feature SAL-01.2 — Contratos comerciais pendentes** — Valor entregue: campos só aparecem após existir domínio.

Como **gestor de vendas**  
Quero **definir contratos de vendedor, canal, entrega e condição de pagamento**  
Para **não persistir dados decorativos ou integrações implícitas**.

Aceite: descoberta documentada; owner/invariantes; ADR quando necessário; sem UI ou persistência falsa.  
Prioridade **Must** · Complexidade **M** · Estimativa **3** · Status **Em descoberta**.

#### Épico CRM-01 — Customer Workspace
**Descrição:** tornar cliente contexto de relacionamento. **Objetivo:** reunir histórico e pendências. **Impacto:** atendimento mais rápido.

**Feature CRM-01.1 — Timeline e relacionamentos** — Valor entregue: contexto do cliente em um local.

Como **atendente comercial**  
Quero **ver pedidos, títulos e contatos do cliente em um Workspace**  
Para **responder sem navegar por vários módulos**.

Aceite: dados autorizados; timeline append-only; links para origem; paginação; sem N+1; testes tenant.  
Prioridade **Should** · Complexidade **L** · Estimativa **5** · Status **Planejado**.

### Compras, fornecedores e recebimentos

**Objetivo:** cobrir pedido de compra e entrada física rastreável.  
**Valor:** reduz ruptura e torna entrada verificável.  
**Dependências:** Supplier, Catalog, Pricing, Inventory Ledger, Audit e Permissions.

#### Épico PUR-01 — Workbench de compra e recebimento
**Descrição:** consolidar pedido e recebimento de alta densidade. **Objetivo:** registrar entrada parcial corretamente. **Impacto:** fluxo de suprimentos completo.

**Feature PUR-01.1 — Picker de catálogo no pedido de compra** — Valor entregue: variante correta sem sair do contexto.

Como **comprador**  
Quero **buscar variantes e revisar snapshots no pedido de compra**  
Para **montar a compra com segurança**.

Aceite: busca incremental/paginada; lifecycle; snapshots; preço pelo contrato; autorização/auditoria; rollback e tenant testados.  
Prioridade **Must** · Complexidade **M** · Estimativa **3** · Status **Planejado**.

**Feature PUR-01.2 — Recebimento parcial operacional** — Valor entregue: conferência até o ledger.

Como **recebedor**  
Quero **registrar quantidades por item e visualizar pendências**  
Para **concluir somente a mercadoria recebida fisicamente**.

Aceite: não excede pendente; lock transacional; ledger inbound idempotente; fechamento quando completo; history/audit; testes de concorrência.  
Prioridade **Must** · Complexidade **L** · Estimativa **5** · Status **Planejado**.

### Inventory

**Objetivo:** disponibilidade por variante/local derivada do ledger.  
**Valor:** evita decisão sobre saldo incorreto.  
**Dependências:** Variant, Ledger, Receiving e contratos de movimento.

#### Épico INV-01 — Cutover de leitura de estoque
**Descrição:** consolidar Inventory canônico. **Objetivo:** uma fonte visível de saldo. **Impacto:** reduz divergência de tela e saldo.

**Feature INV-01.1 — Workspace de disponibilidade e movimentos** — Valor entregue: consulta explicável pelo documento origem.

Como **gestor de estoque**  
Quero **consultar disponibilidade e movimentos no Workspace canônico**  
Para **decidir a partir do ledger e não de saldo paralelo**.

Aceite: saldo derivado; filtros server-side; RLS; drill-down; inconsistência explícita; reconciliação/performance testadas.  
Prioridade **Must** · Complexidade **L** · Estimativa **5** · Status **Planejado**.

### Financeiro

**Objetivo:** fechar obrigações, liquidações e caixa sem saldo financeiro paralelo.  
**Valor:** vencimentos e caixa explicáveis.  
**Dependências:** AP, Sales/Customers, Payments, Cash Ledger, Audit, Permissions e RLS.

#### Épico FIN-01 — Contas a receber
**Descrição:** títulos, parcelas e settlement. **Objetivo:** receita prevista/recebida rastreável. **Impacto:** visão financeira do cliente.

**Feature FIN-01.1 — Accounts Receivable canônico** — Valor entregue: acompanhar títulos por vencimento/status.

Como **analista financeiro**  
Quero **criar e acompanhar títulos a receber com parcelas e lifecycle**  
Para **saber o que vence, foi pago ou está em aberto**.

Aceite: aggregate/parcelas; snapshots; lifecycle; projeção/busca; permissões/auditoria/RLS; testes de valores, tenant e transições.  
Prioridade **Must** · Complexidade **XL** · Estimativa **8** · Status **Em implementação**.

#### Épico FIN-02 — Payments e Cash Ledger
**Descrição:** liquidação e caixa por fatos idempotentes. **Objetivo:** rastrear origem de saldo. **Impacto:** reduz duplicidade financeira.

**Feature FIN-02.1 — Allocation e timeline financeira** — Valor entregue: crédito, débito e reversão explicáveis.

Como **tesoureiro autorizado**  
Quero **alocar pagamentos e consultar lançamentos por documento de origem**  
Para **liquidar saldos sem alterar o caixa diretamente**.

Aceite: transação, idempotência e locks; reversal append-only; Cash Ledger derivado; navegação cruzada; auditoria/RLS; testes de rollback e concorrência.  
Prioridade **Must** · Complexidade **XL** · Estimativa **8** · Status **Em implementação**.

### Indicadores, relatórios e busca

**Objetivo:** converter fatos reconciliados em decisões acionáveis.  
**Valor:** gestão sem planilhas ou métricas fictícias.  
**Dependências:** projeções Sales, Inventory, Finance, Catalog e Customers.

#### Épico INS-01 — Dashboard com drill-down
**Descrição:** consolidar dados e origem de cada card. **Objetivo:** fato antes de gráfico. **Impacto:** uso diário pela gestão.

**Feature INS-01.1 — Dashboard Executivo confiável** — Valor entregue: leitura de operação e exceções.

**Status:** Implementado em 2026-07-28 sobre a Analytics API; KPIs, série temporal, ranking e feed operacional são read-only e tenant-aware.

Como **gestor**  
Quero **filtrar indicadores por período e abrir sua origem**  
Para **agir sobre números explicáveis**.

Aceite: fatos confirmados; ausência de base explícita; agregação server-side; drill-down; RLS; testes de fonte/performance.  
Prioridade **Should** · Complexidade **L** · Estimativa **5** · Status **Planejado**.

#### Épico INS-02 — Busca operacional
**Descrição:** Command Palette sobre projeções oficiais. **Objetivo:** achar entidades em poucos passos. **Impacto:** reduz navegação.

**Feature INS-02.1 — Search autorizado** — Valor entregue: descoberta sem exposição cross-tenant.

Como **usuário autorizado**  
Quero **buscar documentos e entidades pelo comando global**  
Para **chegar ao Workspace correto rapidamente**.

Aceite: debounce, paginação e teclado; tenant/permissão por resultado; empty/error; testes de isolamento e grande volume.  
Prioridade **Should** · Complexidade **M** · Estimativa **3** · Status **Planejado**.

### Fiscal e integrações

**Objetivo:** preparar regra/documento fiscal e extensibilidade sem prometer emissão ou conectores inexistentes.  
**Valor:** evolução segura para obrigações e integrações futuras.  
**Dependências:** contratos de fonte, Catalog, Sales/Purchasing, observabilidade e outbox.

#### Épico FIS-01 — Tax Engine e documento interno
**Descrição:** resolver classificação e congelar snapshots. **Objetivo:** preparar emissão futura. **Impacto:** reduz acoplamento fiscal.

**Feature FIS-01.1 — Simulador e Fiscal Document Builder** — Valor entregue: regra verificável antes de emissão.

Como **analista fiscal autorizado**  
Quero **simular regra e preparar documento fiscal interno a partir de fonte contratada**  
Para **congelar a classificação sem XML ou SEFAZ**.

Aceite: FiscalContext; erro explícito sem regra; Draft/Ready/Cancelled; snapshots; RLS/auditoria; testes de múltiplas regras e tenant.  
Prioridade **Should** · Complexidade **XL** · Estimativa **8** · Status **Planejado**.

#### Épico INT-01 — Integrações governadas
**Descrição:** API/webhooks somente com contratos e outbox. **Objetivo:** impedir fatos duplicados. **Impacto:** expansão segura.

**Feature INT-01.1 — Publicação idempotente de eventos** — Valor entregue: conectividade observável.

Como **integrador autorizado**  
Quero **consumir eventos publicados com idempotência e rastreabilidade**  
Para **conectar sistemas sem duplicar fatos do ERP**.

Aceite: autenticação decidida; outbox, retries/DLQ e logs; rate limits; tenant isolation; testes de falha e duplicidade.  
Prioridade **Could** · Complexidade **XL** · Estimativa **8** · Status **Em descoberta**.

## Roadmap de sprints orientadas a valor

### Fase 0 — Consolidação do Domínio e Core congelado

Esta fase precede o Dashboard Executivo e resolve os bloqueios comprovados pela [Auditoria de Domínio](./DOMAIN_AUDIT.md). Não entrega widgets, telas ou métricas fictícias.

O Core Domain está congelado na [Core Domain Specification](./CORE_DOMAIN_SPECIFICATION.md). Alterar entidade, evento, estado, relacionamento, ownership ou invariant exige atualização formal da especificação antes de qualquer implementação.

| Prioridade | Lacuna crítica | Resultado de engenharia | Dependências |
|---|---|---|---|
| Must | Fato de venda confirmada | Contrato de lifecycle, eventos e projeção comercial reconciliada | Sales, Inventory, Finance decisions |
| Must | Financeiro transacional | Receivable, Payments/Allocation, CashAccount e CashLedger canônicos | AP, Sales, Customers |
| Must | Custo/valuation | Política aprovada de custo do produto e custo médio por ledger | Inventory, Purchasing, Catalog |
| Must | Vendedor e filial | Decisão explícita de domínio, ownership e escopo | Organizations, Users, Sales |
| Should | Indicadores críticos | Contrato de mínimo/ruptura e projeção de leitura | Inventory, Catalog |
| Should | Projeções analíticas | Agregações tenant-aware com qualidade de dado e drill-down | Fatos reconciliados |

| Sprint | Valor de negócio completo | Épicos | Dependências |
|---|---|---|---|
| 1 | Empresa cadastra e encontra o item correto para operar | CAT-01, CAT-02 | Administração, projeção Catalog |
| 2 | Vendedor cria cliente e monta pedido sem perder contexto | SAL-01, CRM-01 base | Customers, Catalog, Pricing |
| 3 | Comprador pede e recebedor registra entrada no ledger | PUR-01, INV-01 | Supplier, Pricing, Inventory Ledger |
| 4 | Financeiro acompanha recebíveis, liquida e explica caixa | FIN-01, FIN-02 | Sales, AP, permissions |
| 5 | Gestor abre indicadores e suas origens | INS-01, INS-02 | Sales, Inventory, Finance projections |
| 6 | Fiscal prepara classificação/documento interno seguro | FIS-01 | Source contract, Catalog, Sales/Purchasing |
| 7 | Plataforma expande conexões com governança | INT-01, devoluções sob contrato | Observabilidade, outbox, decisões aprovadas |

## Matriz de risco

| Módulo | Técnico | Negócio | UX | Performance |
|---|---|---|---|---|
| Administração | RBAC/escope inconsistente | acesso indevido | tela excessivamente técnica | audit/membros extensos |
| Catálogo | coexistência legado/canônico | item errado | filtros densos | atributos combinados |
| Pricing | vigência concorrente | preço/margem incorretos | origem pouco clara | alterações em massa |
| Sales/CRM | estado duplicado | pedido inválido | perda de contexto | pickers/totais |
| Compras/Recebimento | concorrência de quantidade | entrada acima do pedido | parcial confuso | listas grandes |
| Inventory | saldo versus ledger | disponibilidade incorreta | origem opaca | projeções volumosas |
| Financeiro | settlement duplicado | caixa divergente | status ambíguo | timelines/agregações |
| Indicadores | fonte incompleta | decisão enganosa | zero versus sem base | agregações multi-domínio |
| Fiscal/Integrações | contratos incompletos | classificação/sync incorreta | promessa indevida | fila, retry, webhook |

## Fora do horizonte atual

Emissão fiscal/XML/SEFAZ; bancos, OFX e conciliação; juros, multas, descontos financeiros, abatimentos, abertura/fechamento de caixa, promoções, cupons e comissões; CRM de automação; marketplace/e-commerce; lotes, séries, valuation e depósitos avançados sem contrato aprovado.

## Manutenção

Atualize este backlog quando o Documento Mestre mudar prioridade, uma dependência for resolvida ou o Module Status mudar. Ele não declara implementação concluída: essa declaração pertence ao Module Status e à documentação canônica do módulo.

## Fundação concluída — contratos estruturais

| Feature | Prioridade | Status | Valor entregue | Dependência removida |
|---|---|---|---|---|
| Branch | Must | Concluída | Unidade operacional com filial padrão, RLS, RBAC e auditoria. | Escopo futuro por filial. |
| Payment Terms | Must | Concluída | Condições de pagamento e parcelas previsíveis sem movimentar caixa. | Geração futura de AR em Sales. |
| Inventory Policy | Must | Concluída | Política organizacional centralizada para saldo e reserva. | Confirmação de venda com política explícita. |
| Sales Order execution | Must | Concluída | Confirmação transacional com Branch, PaymentTerm, Receivable, histórico, auditoria e reserva condicionada por política. | Financeiro de liquidação e projeções executivas. |
| Analytics read models | Must | Implementado | Projeções de leitura e APIs server-side de KPIs, rankings e séries temporais. | Dashboard Executivo. |
