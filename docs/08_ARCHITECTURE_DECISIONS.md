---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 08_ARCHITECTURE_DECISIONS
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Decisões de Arquitetura e Produto

## Responsabilidade deste documento

Este documento resume decisões permanentes e suas razões. ADRs detalhados continuam sendo o registro formal de contexto, alternativas e supersessões.

## D-01 — Monólito modular primeiro

**Decisão:** uma aplicação implantável com bounded contexts fortes.

**Razão:** reduz complexidade operacional e preserva possibilidade de extração futura por contrato. Microserviços só entram por necessidade mensurável.

## D-02 — Multi-tenancy desde o início

**Decisão:** todo dado operacional pertence a uma Organization e toda operação carrega tenant confiável.

**Razão:** adicionar tenancy depois exigiria reescrita e criaria risco de vazamento. Isolamento é requisito de produto e segurança.

## D-03 — Ownership único por entidade

**Decisão:** cada verdade canônica tem um bounded context proprietário.

**Razão:** elimina dual-write, conflitos de regra e dependências circulares.

## D-04 — Ports para comunicação cross-domain

**Decisão:** módulos consomem capacidades públicas, snapshots e eventos; não repositories/tabelas alheias.

**Razão:** mantém baixo acoplamento, contratos testáveis e possibilidade de evolução independente.

## D-05 — Workspaces em vez de CRUDs

**Decisão:** entidades importantes possuem Workspace com contexto, relacionamentos, indicadores, histórico e ações.

**Razão:** produtividade exige compreender e agir sem navegar entre telas desconectadas. CRUD é estrutura de dados, não experiência enterprise.

## D-06 — Operações complexas não usam modal

**Decisão:** criação/edição complexa usa página ou workbench; modal é reservado a ações rápidas e confirmações.

**Razão:** modal reduz espaço, contexto, navegação e acessibilidade, além de falhar com múltiplas linhas e lifecycle.

## D-07 — Contexto antes de edição

**Decisão:** status, relacionamentos, alterações e indicadores aparecem antes ou junto da edição.

**Razão:** editar sem compreender impacto aumenta erro e cliques investigativos.

## D-08 — Snapshots para fatos históricos

**Decisão:** documentos persistem os dados relevantes vigentes no momento da operação.

**Razão:** mudanças posteriores em Customer, Supplier, Product ou Price não podem reescrever o passado.

## D-09 — Ledger para verdades de movimento

**Decisão:** estoque e fatos financeiros apropriados usam registros append-only e compensação.

**Razão:** ledger permite auditoria, reconstrução, reconciliação e evita alterações silenciosas de história.

## D-10 — Projections para leitura

**Decisão:** listas, saldos, busca, dashboards e indicadores usam read models reconstruíveis.

**Razão:** modelos de escrita não devem ser deformados por necessidades de leitura, e leitura em escala não deve reconstituir aggregates desnecessariamente.

## D-11 — Banco como última garantia

**Decisão:** constraints, FKs, checks, RLS, imutabilidade e transações vivem também no PostgreSQL.

**Razão:** validação somente na aplicação não protege contra concorrência, bugs, múltiplos clientes ou caminhos privilegiados.

## D-12 — Operações críticas atômicas e idempotentes

**Decisão:** tudo ou nada, com key/replay seguro quando retry é possível.

**Razão:** double-click, timeout e concorrência não podem duplicar ou deixar estoque/financeiro parciais.

## D-13 — Permission keys, não role checks

**Decisão:** UI e services verificam `resource.action`; roles são presets.

**Razão:** separa identidade, papel e capacidade, permitindo evolução para custom roles/scopes sem espalhar condicionais.

## D-14 — Defesa multi-tenant em profundidade

**Decisão:** membership, services, tenant-bound adapters, filtros, RLS, constraints e cache protegem em conjunto.

**Razão:** nenhuma camada isolada é suficiente para segurança enterprise.

## D-15 — Product family e Variant operacional

**Decisão:** Product representa família; Variant é identidade vendável/estocável. Produto simples possui variante default.

**Razão:** evita dois modelos incompatíveis e suporta catálogo simples e variável com a mesma estrutura.

## D-16 — Price List é fonte de preço

**Decisão:** preço não reside em Product/Variant.

**Razão:** vigência, prioridade, múltiplas listas e histórico exigem ownership próprio e resolução explícita.

## D-17 — Supplier pertence a Procurement

**Decisão:** Supplier não é parte do Catalog.

**Razão:** fornecedor participa de compras e relacionamento de suprimento, não da identidade canônica do produto.

## D-18 — Search não é fonte da verdade

**Decisão:** índices de busca são derivados e reconstruíveis.

**Razão:** search pode ser otimizado ou substituído sem alterar cadastros, preços, estoque ou documentos.

## D-19 — Central de Decisão não é BI

**Decisão:** Home apresenta poucas prioridades explicáveis e acionáveis.

**Razão:** o objetivo é orientar trabalho, não maximizar indicadores ou oferecer dashboard builder.

## D-20 — UX por linguagem operacional

**Decisão:** menus e labels usam o vocabulário do usuário, não nomes técnicos dos contexts.

**Razão:** o usuário não deve conhecer a arquitetura para operar. “Compras” e “Clientes” são mais claros que “Procurement” e “CRM” no escopo atual.

## D-21 — Simplicidade progressiva

**Decisão:** caminho comum curto; complexidade aparece sob demanda.

**Razão:** mantém onboarding e operação rápidos sem limitar profundidade enterprise.

## D-22 — Escala comprovada por métricas

**Decisão:** arquitetura prepara evolução, mas particionamento, serviços separados e novos índices entram com evidência.

**Razão:** evita infraestrutura prematura e mantém decisões proporcionais ao estágio.

## Processo para nova decisão

Uma nova decisão relevante deve registrar:

- contexto e problema;
- constraints e invariantes;
- opções consideradas;
- decisão;
- consequências e trade-offs;
- impactos em ownership/contracts/data/UX;
- plano de migração/cutover;
- critérios de revisão ou supersessão.

Se contradizer decisão aceita, deve explicitamente supersedi-la. Preferência individual não é razão suficiente.
