---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 01_PROJECT_ARCHITECTURE
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Arquitetura do Projeto

## Responsabilidade deste documento

Este documento registra a arquitetura geral, os limites dos módulos, a comunicação entre domínios e a organização do projeto. Detalhes de implementação pertencem ao guia de engenharia e aos documentos especializados.

## Visão geral

O projeto é um monorepo organizado como monólito modular multi-tenant. Há uma única aplicação implantável, com fronteiras internas fortes por domínio. Serviços separados só são considerados quando uma necessidade operacional mensurável justificar a divisão física.

A arquitetura combina DDD pragmático, Ports and Adapters e dependências orientadas para dentro:

`Interface → Aplicação → Domínio`

Infrastructure implementa contratos definidos pela aplicação ou pelo domínio. Domínio e aplicação são independentes de React, TanStack, Supabase e PostgreSQL.

## Princípios arquiteturais

- multi-tenancy desde o primeiro registro operacional;
- ownership único para cada entidade canônica;
- comunicação cross-domain apenas por ports, contratos e eventos;
- regras de negócio no domínio, não na UI ou nos repositories;
- banco como última garantia de integridade;
- operações críticas atômicas e idempotentes;
- fatos históricos imutáveis e correções por compensação;
- projeções reconstruíveis, nunca fontes canônicas;
- segurança e autorização em profundidade;
- monólito modular primeiro;
- abstrações criadas por necessidade real;
- evolução incremental e compatível com a arquitetura existente.

## Organização do repositório

| Área | Responsabilidade |
|---|---|
| `apps/web` | Aplicação web, composição, rotas, plataforma e módulos de negócio. |
| `packages/auth` | Tipos e funções puras de identidade. |
| `packages/permissions` | Chaves de permissão, presets de papéis e avaliação de grants. |
| `packages/database` | Tipos gerados do banco e aliases tipados. |
| `packages/domain` | Shared kernel pequeno e deliberado. |
| `supabase/migrations` | Fonte versionada do schema, constraints, RLS, grants, triggers e funções. |
| `docs` | Fonte oficial de produto, arquitetura, engenharia, domínio e design. |

## Camadas de um módulo

### Domain

Contém linguagem de negócio, aggregates, entities, value objects, policies, factories, validações, lifecycles e eventos. Não conhece persistência ou interface.

### Application

Orquestra casos de uso. Recebe contexto de tenant, ator, permissões e ports. Autoriza, carrega aggregates, valida comandos, aplica regras, persiste, audita e emite eventos.

### Infrastructure

Implementa repositories, mappers, acesso Supabase/PostgreSQL, transações, tenant guards e integração com serviços externos. Concrete adapters são server-only.

### UI

Contém contracts serializáveis, server functions, hooks, pages, Workspaces, componentes e estados de interface. A UI nunca acessa tabelas ou repositories diretamente.

## Módulos e ownership

| Contexto | Ownership principal |
|---|---|
| Organizations | Organization, Membership e organização ativa. |
| Catalog | Product, Variant, Brand, Category, Attributes, UOM, Price List e Price Entry. |
| Inventory | Stock Location, Inventory Item, saldo, movimentos, reservas e custo. |
| Customers | Customer, contatos, endereços e histórico cadastral. |
| Procurement | Supplier, Purchase Order e Goods Receipt, divididos em aggregates próprios. |
| Finance | Accounts Payable, futuros Receivables, Payments, Allocations e caixa. |
| Sales | Futuro Sale Aggregate, itens, lifecycle e snapshots comerciais. |
| Workspace | Composição e apresentação; não possui dados canônicos de negócio. |
| Search | Projeções derivadas; não possui a verdade cadastral ou transacional. |
| Audit | Visão transversal de fatos auditáveis; não substitui ledgers ou histories locais. |

Módulos legados de Products e estoque product-scoped coexistem temporariamente. Código novo deve seguir Catalog e Inventory variant-scoped, sem dual-write.

## Comunicação entre módulos

### Ports

Um módulo consumidor solicita uma capacidade pública do módulo proprietário. O contrato expõe somente os dados necessários e não revela repositories, tabelas ou aggregates internos.

### Snapshots

Documentos históricos copiam os dados necessários no momento da operação. Alterar o cadastro depois não reescreve uma compra, venda, recebimento ou obrigação financeira passada.

### Eventos

Eventos de domínio expressam fatos ocorridos e permitem efeitos posteriores sem dependência circular. Quando entrega durável for necessária, devem usar outbox transacional; collectors em memória não garantem entrega.

### Projeções

Listagens, busca, dashboards e indicadores usam read models derivados. Projeções são reconstruíveis e não recebem writes de negócio.

## Fluxo de uma operação web

1. A rota protegida valida sessão e acesso organizacional.
2. A Page ou Workspace aplica o gate de leitura e compõe a interface.
3. Um hook tenant-scoped chama uma server function.
4. O servidor recupera o usuário real, valida membership ativa e deriva grants.
5. O application service aplica autorização e regras de negócio.
6. O adapter confirma o tenant e acessa a persistência.
7. Operações críticas são executadas em uma transação PostgreSQL/RPC.
8. O resultado serializável retorna à UI e o cache correto é invalidado.

## Multi-tenancy

`organization` é a raiz do tenant. O usuário é global e acessa organizações por memberships ativas. O `organizationId` enviado pelo cliente é apenas uma alegação de seleção e nunca fonte confiável isolada.

O isolamento usa defesa em profundidade:

- gate de autenticação e membership;
- revalidação no servidor;
- services e ports tenant-scoped;
- factories de adapters vinculadas a tenant e ator;
- filtros explícitos de `organization_id`;
- RLS e helpers de membership;
- constraints, FKs e uniques por organização;
- cache e query keys tenant-scoped;
- testes cross-tenant contra banco real.

## Autorização

Papéis persistidos são presets. Código e UI verificam permissões `resource.action`, nunca nomes de roles. A UI oculta ou explica ações, mas a autorização efetiva ocorre novamente no servidor. Acesso é negado por padrão.

## Persistência e integridade

- PostgreSQL mantém constraints, unicidade, checks e FKs;
- tabelas operacionais carregam `organization_id`;
- histories e ledgers são append-only;
- cadastros são arquivados, não apagados;
- transações são canceladas ou compensadas;
- saldo é projeção do ledger;
- dinheiro e quantidade usam representação decimal exata;
- operações repetíveis usam idempotency keys tenant-scoped;
- funções críticas fixam `search_path`, validam membership e usam locks adequados.

## Arquitetura da aplicação

O App Shell é proprietário de sessão, organização ativa, permissões, tema, command palette, dialogs, toasts, loading, errors, observabilidade e serviços compartilhados. Módulos não duplicam essas responsabilidades.

Rotas file-based permanecem finas e delegam a Pages/Workspaces dos módulos. TanStack Query mantém caches hierárquicos por domínio e tenant. Server-only dependencies entram por composição no servidor e nunca no bundle cliente.

## Escalabilidade

A arquitetura prepara o crescimento, mas capacidade deve ser comprovada por métricas. As evoluções físicas esperadas, quando justificadas, incluem particionamento de ledgers/histories, read models, processamento assíncrono, outbox, réplicas de leitura, índices especializados e retenção por classe de dado. Essas mudanças preservam os mesmos módulos e contratos.

## Autoridade documental

Em conflito, aplicar a seguinte ordem:

1. ADR aceito mais recente e que trate diretamente do tema;
2. estes documentos oficiais numerados;
3. contratos e regras especializadas de arquitetura;
4. documentação histórica e de discovery;
5. preferências individuais.

Conflito não resolvido deve gerar análise e decisão registrada, nunca improvisação durante implementação.
