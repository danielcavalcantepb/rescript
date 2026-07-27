---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 02_ENGINEERING_GUIDE
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Guia de Engenharia

## Responsabilidade deste documento

Este documento define padrões permanentes de desenvolvimento, reutilização, convenções, nomenclatura e qualidade. Ele não redefine domínio nem arquitetura.

## Regras fundamentais

- seguir a arquitetura existente antes de introduzir novas estruturas;
- preservar ownership e dependency rules;
- preferir reutilização de contracts, components, services e platform capabilities existentes;
- não reescrever módulos por preferência técnica;
- não criar abstração especulativa;
- manter regras de negócio fora de UI e infrastructure;
- tratar tenant, autorização, auditoria e erro como requisitos de toda operação;
- tornar o caminho seguro o caminho padrão;
- testar de acordo com risco, não por meta de cobertura arbitrária.

## Convenções de linguagem e nomes

- identificadores técnicos em inglês;
- UX e documentação operacional em português brasileiro;
- pastas e arquivos em kebab-case;
- funções e variáveis em camelCase;
- tipos, classes e componentes em PascalCase;
- tabelas singulares e `snake_case`;
- FKs com `_id`, instantes com `_at`, datas civis com `_on` quando aplicável;
- chaves de idempotência com `_key`, snapshots com `_snapshot` e versões com `_version`;
- nomes de domínio genéricos, sem branches por segmento ou plano comercial.

## Imports e boundaries

- código da aplicação usa aliases absolutos existentes;
- imports cross-domain usam apenas barrels, ports ou contracts públicos;
- nenhum módulo importa infrastructure ou repository de outro módulo;
- nenhum componente cliente importa SQL, credentials ou concrete adapters;
- concerns transversais são consumidos da plataforma;
- ícones de feature vêm do catálogo de ícones;
- valores visuais vêm de tokens CSS;
- arquivos gerados não são editados manualmente.

## Estrutura padrão

Um módulo utiliza, conforme sua complexidade:

- `domain`: tipos, invariantes, lifecycle, policies, value objects e eventos;
- `application`: use cases/services, deps, ports, DTOs e errors;
- `infrastructure`: adapters server-only, mappers, tenant guards e composition factory;
- `ui`: RPC contracts, server functions, hooks, Workspaces, pages e components;
- `index`: API pública deliberada;
- testes co-localizados.

Não criar pastas ou arquivos vazios apenas para completar um template.

## Reutilização

Antes de criar uma nova solução, procurar:

1. capability equivalente na plataforma;
2. component ou pattern equivalente na UI compartilhada;
3. value object ou contract canônico no domínio proprietário;
4. port público existente;
5. decisão arquitetônica aplicável.

Reutilizar comportamento, não copiar implementação. Quando dois módulos têm conceitos semanticamente diferentes, não os unificar apenas por formato semelhante. Abstrações compartilhadas devem nascer de semântica comum e repetição comprovada.

## Application services

Services são compostos com dependencies explícitas: tenant, ator, permissions, clock, IDs, events e ports. A ordem esperada é:

1. autorizar;
2. carregar o estado necessário;
3. validar input e invariantes;
4. aplicar policy/lifecycle;
5. persistir atomicamente quando necessário;
6. registrar auditoria;
7. emitir eventos;
8. retornar DTO/aggregate seguro.

Services não acessam globals de sessão nem constroem concrete repositories.

## Repositories e adapters

- interfaces são pequenas e orientadas a capacidades;
- `organizationId` é explícito;
- adapters são vinculados a tenant e ator confiáveis;
- toda operação confirma a correspondência do tenant;
- queries filtram tenant e usam índices compatíveis;
- mappers reconstituem domínio sem disparar factories/events;
- erros externos são traduzidos e redigidos;
- listagens usam projections, não aggregates completos;
- repositories in-memory suportam testes de application.

## Server functions e RPCs

Server functions são a borda browser-servidor. Devem:

- aceitar contracts serializáveis;
- validar payload em runtime;
- recuperar o usuário pelo mecanismo de autenticação confiável;
- revalidar membership ativa;
- derivar permissões no servidor;
- compor application service por dependencies server-only;
- retornar envelopes de sucesso/erro controlados;
- nunca devolver erro SQL, JWT, connection string ou detalhe sensível.

PostgreSQL RPCs são usadas para operações críticas, multi-tabela, idempotentes ou que exigem locks. Não distribuir uma transação crítica em chamadas independentes.

## Banco e migrations

- toda alteração de schema é uma migration versionada;
- migrations são forward-only; migration aplicada não é editada;
- uma preocupação por migration quando prático;
- constraints e RLS fazem parte da entrega;
- dados operacionais carregam tenant e índices começam pelo tenant quando compatível;
- `DELETE` é negado para fatos e cadastros arquiváveis;
- `SECURITY DEFINER` exige `search_path` fixo, validação de acesso e grants mínimos;
- tipos do banco são regenerados após a migration;
- secrets, usuários Auth e configuração de ambiente não entram em migration;
- breaking changes seguem expand/cutover/contract.

## Dinheiro, quantidades e tempo

- nunca usar float binário para cálculo monetário crítico;
- usar representação decimal exata nas fronteiras e `numeric` no banco;
- moeda acompanha o valor;
- quantidade respeita unidade e precisão;
- operações entre unidades exigem fator explícito aprovado;
- instantes usam ISO/timestamptz;
- datas civis não são tratadas como instantes;
- totais são calculados no domínio/servidor, não confiados à UI.

## Erros

Erros são classificados em validation, conflict, not found, forbidden, unauthenticated, unavailable e unexpected, com códigos específicos quando necessário. Mensagens de UI são humanas e não expõem implementação.

Cross-tenant not found não deve revelar a existência do registro. Conflitos de concorrência devem solicitar reload; não fazer merge silencioso.

## Cache e dados na UI

- query keys incluem domínio e organização;
- queries são desabilitadas sem tenant válido;
- mutations invalidam o menor escopo correto;
- troca de organização limpa/invalida dados do tenant anterior;
- estado React não é fonte da verdade operacional;
- optimistic update só é usado quando o risco é baixo e a reconciliação é clara;
- listas grandes usam cursor/keyset, nunca dependem de offset ilimitado.

## Testes

### Unitários

Cobrem value objects, policies, factories, lifecycle, cálculos e application services com ports in-memory.

### Integração

Rodam contra PostgreSQL/Supabase real para verificar mappings, constraints, transações, rollback, idempotência, concorrência e repository contracts.

### Segurança

Cobrem RLS, tenant forgery, permission denial, client-bundle safety e ausência de secrets.

### UI

Cobrem Workspaces, hooks, permissões, loading, error, empty, keyboard e fluxos críticos. Layout decorativo recebe cobertura proporcional ao risco.

### E2E

Cobrem poucos ciclos completos de alto valor: autenticação, tenant, venda, estoque, compras, recebimento e financeiro.

## Quality gates

Uma mudança só é concluída quando:

- typecheck, lint, testes e build passam;
- ownership e imports respeitam boundaries;
- tenant e permission checks existem;
- operação crítica é atômica/idempotente;
- migration possui RLS, grants e testes;
- UI segue Product Design e UI Guidelines;
- documentação/ADR foi atualizada se contrato ou decisão mudou;
- não há caminho legado novo, dual-write ou regra duplicada.
