---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 05_MODULE_STANDARDS
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Padrões de Módulos

## Responsabilidade deste documento

Este documento define como criar ou evoluir um módulo de negócio respeitando as fronteiras, padrões e experiência do ERP.

## Antes de criar um módulo

Confirmar:

- qual bounded context é proprietário da capacidade;
- qual entidade é o aggregate root;
- quais invariantes precisam ser protegidas;
- quais operações são críticas, atômicas ou idempotentes;
- quais módulos consomem ou fornecem informações;
- quais ports e snapshots formam os contratos públicos;
- qual Workspace e quais tarefas o usuário precisa executar;
- se a capacidade já existe na plataforma ou em outro módulo;
- se o volume exige projections, cursor, bulk jobs ou processamento assíncrono.

Se ownership ou contrato estiver ambíguo, interromper a implementação e registrar uma decisão.

## Estrutura padrão

```text
modules/<module>/
  domain/
  application/
  infrastructure/
  ui/
  index.ts
  APPLICATION.md (quando necessário)
```

Pastas internas são criadas conforme a complexidade:

```text
domain/
  types
  validation
  lifecycle
  events
  value-objects/
  policies/
  factories/

application/
  service ou use-cases/
  deps
  ports ou ports/
  dto
  errors
  memory adapters/test harness

infrastructure/
  server-only guard
  client options
  tenant context
  mappers
  error mapping
  concrete repositories
  composition factory
  index.server

ui/
  api contracts
  server functions
  error mapping
  hooks
  Workspaces/pages
  components
  validation
```

Não criar estrutura cerimonial vazia. Módulos simples podem consolidar arquivos; módulos ricos separam responsabilidades.

## Domain

O domínio contém linguagem e regras próprias. Deve incluir:

- tipos do aggregate e entities;
- commands/inputs independentes da persistência;
- lifecycle explícito;
- validações e invariantes;
- value objects para conceitos com regras próprias;
- policies quando a decisão combina múltiplos fatores;
- factories para criação válida;
- eventos discriminados;
- snapshots publicados quando necessário.

O domínio não importa UI, framework, Supabase, SQL ou concrete services.

## Application

O application service é a porta de entrada dos casos de uso. Dependencies incluem tenant, ator, permissions, clock, IDs, event collector e ports.

Cada operação segue:

1. permission check;
2. load do aggregate/contexto;
3. validation;
4. lifecycle/policy;
5. persistência;
6. audit;
7. event emission;
8. retorno seguro.

Reads verificam permissão e tenant com o mesmo rigor de writes. Application não importa concrete repositories.

## Ports

Ports expressam capacidades, não tabelas. Devem ser:

- pequenos;
- tipados;
- tenant-scoped;
- estáveis;
- orientados ao vocabulário do domínio;
- suficientes para testes in-memory;
- públicos apenas quando realmente cross-domain.

Exemplos de categorias:

- repository do aggregate;
- repository de entities filhas;
- search/read port;
- snapshot source;
- number allocator;
- audit/history port;
- atomic operation port;
- external integration adapter.

Um módulo não expõe seu concrete repository como contrato cross-domain.

## Infrastructure

Concrete adapters:

- são server-only;
- recebem tenant e ator verificados;
- rejeitam divergência de organização;
- usam filtros tenant-scoped;
- mapeiam rows para domínio sem inventar defaults;
- traduzem errors sem vazar detalhes;
- usam transação para mudança crítica multi-tabela;
- preservam snapshots e history;
- mantêm search projection derivada.

Quando SQL privilegiado puder contornar RLS, a factory deve verificar JWT e membership antes de fornecer o adapter.

## Persistência do módulo

Uma migration de módulo considera:

- `organization_id` e ownership;
- IDs, FKs e same-tenant integrity;
- status checks;
- unique rules por organização;
- índices dos padrões reais de consulta;
- `created_at/by`, `updated_at/by` e archive fields quando aplicáveis;
- history append-only;
- search projection;
- RLS e grants;
- funções transacionais;
- triggers de imutabilidade/projeção;
- comments de intenção.

## RPC e contracts

O módulo cria contracts serializáveis para a UI. Server functions:

- validam payload em runtime;
- tratam `organizationId` do cliente como claim;
- recuperam usuário e membership;
- compõem o service;
- retornam `ok/data` ou erro controlado;
- nunca expõem concrete infrastructure.

## Hooks

Hooks:

- obtêm a organização ativa;
- usam query keys do módulo e tenant;
- não rodam sem tenant;
- chamam apenas a API do módulo;
- fazem unwrap do envelope;
- invalidam escopo apropriado;
- não contêm regras de negócio;
- não usam Supabase diretamente.

## Workspace do módulo

Entidade importante exige Workspace, não CRUD isolado. O Workspace deve ter:

- identity/status header;
- resumo e indicadores;
- ações contextuais por lifecycle/permission;
- relacionamentos e cadeia documental;
- abas quando existirem dimensões irmãs;
- timeline humana;
- loading/error/empty/forbidden/partial states;
- desempenho com grandes volumes.

Lista e Workspace são complementares. A lista ajuda a localizar, filtrar e operar em lote; o Workspace ajuda a compreender e agir no contexto.

## Navegação

- rotas permanecem finas;
- labels usam linguagem operacional;
- o módulo registra subnav local quando necessário;
- ação rápida abre o fluxo específico;
- command palette oferece criação e busca quando relevante;
- deep links preservam contexto;
- áreas globais não espelham automaticamente nomes técnicos dos módulos.

## Auditoria e eventos

- toda ação sensível registra ator, ação, instante e motivo quando aplicável;
- histories são imutáveis;
- timeline traduz eventos para linguagem humana;
- fatos cross-domain são emitidos por eventos;
- entrega durável usa outbox quando consumidores dependerem dela;
- logs não substituem auditoria.

## Testes mínimos

- value objects e invariantes;
- lifecycle completo, inclusive transições proibidas;
- permissions denied;
- tenant mismatch/cross-tenant;
- service com repositories in-memory;
- mapper e repository contract;
- migration, constraints e RLS contra banco real;
- rollback e idempotência de operação crítica;
- concorrência quando há saldo, número ou lifecycle disputado;
- client bundle safety;
- Workspace, hooks e estados principais;
- E2E do fluxo de maior valor quando o módulo fecha ciclo crítico.

## Definition of Done do módulo

- ownership e ports aprovados;
- domain independente e testado;
- application authorization completa;
- infrastructure tenant-safe;
- migration e RLS verificadas;
- operação crítica atômica;
- Workspace produtivo e consistente;
- search/list preparados para volume;
- audit e events presentes;
- documentação e decisões atualizadas;
- typecheck, lint, tests e build verdes;
- nenhum import proibido, dual-write ou caminho legado novo.

## Referências internas

Os melhores exemplos atuais são:

- Catalog para aggregate rico, policies, ports e transactions;
- Inventory Ledger para imutabilidade, locks, idempotência e projections;
- Customers/Suppliers para aggregate com children, history e search;
- Purchase para snapshots e documento com itens;
- Receiving para operação cross-domain atômica;
- Payable para parcelas e cadeia documental.

Exemplos não devem ser copiados mecanicamente. O padrão é reproduzir responsabilidades e garantias.
