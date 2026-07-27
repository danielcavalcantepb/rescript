# Arquitetura identificada

O projeto é um monorepo npm workspaces organizado como um monólito modular multi-tenant. A implantação é única, mas as fronteiras lógicas são definidas por bounded contexts de negócio. A arquitetura existente segue DDD pragmático, Ports and Adapters e separação em camadas, com regras de dependência voltadas para dentro:

`UI/rotas → application/services/use cases → domain`, enquanto `infrastructure` implementa ports definidos pela aplicação ou pelo domínio. Domínio e aplicação não dependem de React, TanStack, Supabase ou PostgreSQL. Dependências entre bounded contexts devem usar ports e DTOs/snapshots publicados, nunca repositories, tabelas ou estruturas internas do módulo proprietário.

O stack implementado é:

- React 19, TypeScript estrito, TanStack Start/Router e Vite na aplicação web;
- TanStack Query para cache, queries, mutations e invalidação por tenant;
- Tailwind CSS 4, tokens CSS próprios e primitives Radix para a UI;
- Supabase Auth, PostgREST/RLS e PostgreSQL como persistência;
- funções PostgreSQL para operações críticas, atômicas ou idempotentes;
- Vitest, Testing Library e integração com Supabase/PostgreSQL local;
- Zod e React Hook Form estão disponíveis, embora os módulos atuais também usem validadores e formulários controlados próprios.

A raiz está dividida em:

- `apps/web`: aplicação, composição, rotas, plataforma compartilhada e módulos de negócio;
- `packages/auth`: tipos e funções puras de identidade; não contém autorização nem clientes Supabase;
- `packages/permissions`: catálogo tipado de chaves, presets de papéis e funções `can/cannot/canAny/canAll`;
- `packages/database`: tipos gerados do Supabase e aliases tipados; `generated.ts` é artefato gerado, não editado manualmente;
- `packages/domain`: shared kernel ainda pequeno; não é destino automático para regras específicas de módulo;
- `supabase/migrations`: fonte versionada e forward-only do schema, constraints, índices, triggers, RLS, grants e RPCs;
- `supabase/types`: snapshot adicional dos tipos do banco;
- `docs`: decisões de produto, domínio, arquitetura, banco, plataforma, design, telas, ADRs e validações.

A hierarquia normativa encontrada prioriza ADRs aceitos e recentes, depois `DomainContracts.md`, `DependencyRules.md` e governança; documentos antigos de discovery podem descrever estado pré-implementação e devem ser confrontados com migrations e código atuais. A arquitetura atual é definitiva: fronteiras rígidas, implantação flexível, sem microserviços prematuros e sem abstrações especulativas.

O App Shell concentra autenticação, organização ativa, permissões, tema, comandos, dialogs, toasts, loading, errors, observabilidade e serviços. Módulos de negócio não recriam essas preocupações. Rotas protegidas usam o layout `_app`, cujo `beforeLoad` verifica sessão e membership ativa antes de renderizar `AppLayout` e as páginas filhas. O arquivo `routeTree.gen.ts` é gerado pelo TanStack Router.

O fluxo de uma operação web é:

1. A rota file-based importa uma page do módulo e permanece fina.
2. A page aplica `RequirePermission` para acesso à tela e `FeatureGate` para ações, compõe componentes compartilhados e chama hooks do próprio módulo.
3. O hook obtém a organização ativa, monta uma query key que inclui `organizationId` e chama uma TanStack server function.
4. A server function recebe `organizationId` apenas como alegação de seleção, recupera o usuário pelo JWT, revalida membership ativa, expande o role preset em grants e constrói o service com adapters server-only.
5. O application service verifica a permissão novamente, valida o comando, aplica lifecycle/policies do domínio, chama ports, registra histórico e emite eventos de domínio.
6. O adapter confirma o tenant confiável, aplica filtros explícitos por `organization_id`, usa o cliente Supabase protegido por RLS ou uma transação/RPC PostgreSQL para operações críticas, e mapeia rows para tipos do domínio.
7. O resultado volta como união serializável `{ ok: true, data } | { ok: false, error }`; o hook converte erros em exceções seguras e invalida o escopo correto do cache.

O banco é simultaneamente persistência e última barreira de integridade. Constraints, unicidade por tenant, checks de status, FKs, triggers de `updated_at`, imutabilidade e RLS não são delegados apenas à aplicação. Operações críticas seguem o princípio `authorize → idempotency gate → locks → invariants → writes/audit → commit`. O ledger de estoque é append-only, movimentos são compensados em vez de alterados, transferências geram pares correlacionados e o saldo materializado é projeção do ledger.

O multi-tenant usa banco compartilhado e isolamento lógico por `organization_id`. `organization` é a raiz do tenant; `membership` liga usuário global à organização e carrega role/status. A organização ativa no browser é apenas preferência validada. A defesa é profunda: gate de rota, revalidação JWT/membership na RPC, `organizationId` obrigatório nos services e ports, factory de repositories vinculada ao tenant, guards contra divergência, predicados explícitos nos adapters, RLS `is_org_member(...)`, FKs/uniqueness tenant-scoped e testes de isolamento. Caminhos SQL privilegiados do Catalog não dependem de RLS: verificam membership antes da composição e fixam tenant/ator na transação.

A autorização é RBAC por preset na persistência e permission-based no código. A UI nunca verifica nomes de papéis; usa chaves `resource.action`. Os services também negam por padrão e verificam a chave adequada. `owner`, `admin`, `manager`, `seller`, `inventory`, `finance` e `viewer` são presets iniciais; implicações como `*.write`, gestão de itens e ações de lifecycle ficam centralizadas em `@rescript/permissions`.

A auditoria possui camadas distintas:

- histories por aggregate, append-only, com ação, campo, valores anterior/novo, motivo, ator, IP e instante;
- tabela específica de lifecycle do Catalog;
- ledgers imutáveis para verdade operacional/financeira;
- eventos de domínio tipados, hoje coletados em memória em vários módulos;
- logs técnicos via services/observability, sem substituir auditoria de negócio.

Triggers impedem `UPDATE` e `DELETE` nos históricos e ledgers. Cadastros usam arquivamento/inativação; transações usam cancelamento ou lançamentos compensatórios. Não há hard delete para fatos operacionais.

# Estrutura dos módulos

O padrão atual de módulo de negócio fica em `apps/web/src/modules/<module>`:

```text
<module>/
  domain/
    types.ts
    validation.ts
    lifecycle.ts
    events.ts
    value-objects/ | policies/ | factories/
  application/
    <module>-service.ts | use-cases/
    deps.ts
    ports.ts | ports/
    dto.ts
    errors.ts
    memory-*.ts
  infrastructure/
    assert-server-only.ts
    client-options.ts
    tenant-context.ts
    mappers.ts
    errors.ts
    create-supabase-<module>-repos.ts
    supabase-*-repository.ts
    index.server.ts
  ui/
    <module>-api.ts
    api/contracts.ts
    errors/
    hooks/ | use-*-queries.ts
    pages/
    components/
    <entity>-form.tsx
  index.ts
  APPLICATION.md (quando o contexto exige documentação própria)
```

As pastas são adaptadas à complexidade, sem obrigação de criar arquivos vazios. Catalog, por exemplo, separa use cases, ports, factories, policies, value objects, repositories memory/Supabase e muitos componentes de UI. Aggregates mais lineares usam um único service e `ports.ts`.

Os módulos e seus papéis atuais são:

- `catalog`: bounded context proprietário de Product, Variant, Brand, Category, atributos, unidades de medida e Price List/Entry. É o exemplo mais completo de aggregate rico, value objects, policies, factories, ports publicados e transações SQL. Produto simples nasce com uma variante default invisível; preço nunca pertence à Product/Variant.
- `inventory`: proprietário de StockLocation, InventoryItem/projeção, disponibilidade e ledger variant × location. Contém uma implementação legada product-scoped e a fundação atual do Catalog Inventory; código novo deve usar identidade `variant_id` e o ledger atual, sem dual-write.
- `customers`: aggregate Customer com PF/PJ imutável, contatos, endereços, lifecycle, histórico append-only e projeção de busca. É acessado pelas rotas atuais de CRM.
- `suppliers`: aggregate Supplier equivalente em forma ao Customer, reutilizando exclusivamente o value object de CPF/CNPJ de Customers. Pertence a Procurement, não a Catalog.
- `purchase`: aggregate PurchaseOrder e PurchaseItem. Congela snapshots de fornecedor, variante e preço, calcula totais no servidor, usa numeração tenant-scoped, soft-remove de itens e projeção de busca. Pedido representa intenção de compra e não altera estoque.
- `receiving`: aggregate GoodsReceipt. Consome um port de Purchase e publica o recebimento atomicamente por `post_goods_receipt`, criando entradas no ledger, atualizando quantidades recebidas e fechando o pedido quando aplicável. O post é idempotente.
- `payable`: aggregate AccountsPayable e installments. Nasce de um Goods Receipt postado por meio de um port de origem e congela snapshots de fornecedor, pedido e recebimento.
- `products`: módulo legado flat, usado nas telas antigas `/produtos` e em partes do estoque antigo. Não representa o padrão canônico para evolução do Catalog.
- `crm` e `procurement`: contextos de composição/navegação e documentação; os aggregates concretos permanecem em módulos próprios.
- vendas: as rotas atuais ainda usam mocks; a documentação e os contratos arquiteturais definem Sales como futuro proprietário de Sale/SaleItem/snapshots, consumidor de ports de Catalog e Inventory, sem escrita direta nesses contextos.

O aggregate padrão é modelado por tipos TypeScript e funções puras, não obrigatoriamente por classes. Possui:

- root com `id`, `organizationId`, status e metadados de criação/alteração;
- entidades-filhas referenciadas pelo root e sempre tenant-scoped;
- lifecycle explícito como máquina de estados e função `assert*Transition`;
- invariantes em validation, policies, factories, value objects e constraints do banco;
- inputs de comando separados dos tipos persistidos;
- snapshots imutáveis para dependências cross-domain e fatos históricos;
- eventos discriminados pelo campo `type`;
- arquivamento, status `removed` ou compensação em vez de exclusão física;
- totais e quantidades monetárias calculados no domínio/servidor, persistidos como decimal PostgreSQL e transportados como strings nos módulos transacionais mais recentes.

Os services de aplicação são factories (`createXService(deps)`) ou uma facade fina sobre use cases. `deps.ts` agrupa `organizationId`, `userId`, função `can`, clock, gerador de IDs, collector de eventos, repositories/ports e opcionalmente IP do ator. Cada método executa autorização, carregamento obrigatório do aggregate, validação, invariantes/lifecycle, persistência, auditoria e emissão de evento. Erros de domínio/aplicação são tipados e erros da infraestrutura são mapeados para categorias seguras como validation, conflict, not found, forbidden, unavailable e unexpected.

Repositories são interfaces pequenas e específicas em `application/ports`, sempre recebem `organizationId`, e têm implementações in-memory para testes e Supabase para produção. A composição concreta ocorre somente no servidor. Adapters:

- importam um guard `server-only`;
- recebem opções com cliente, tenant e ator confiáveis;
- chamam `assertEntityOrganization` antes da operação;
- filtram por `organization_id` e `id`;
- usam mappers row ↔ domain;
- traduzem erros Supabase/PostgreSQL sem vazar SQL, JWT ou connection string;
- separam repository do aggregate, filhos, history, search projection, number allocator e ports cross-domain.

Listagens usam read models/projeções próprias (`*_search`) em vez de reconstituir aggregates completos. As projeções são atualizadas por funções/triggers, são reconstruíveis e nunca são fonte de verdade para writes. Paginação tende a cursor, com query keys hierárquicas e filtros serializáveis.

As RPCs existem em dois níveis complementares:

- TanStack `createServerFn({ method: 'POST' })` em `ui/*-api.ts` é a ponte browser → application. Possui contrato serializável, validator, autenticação/membership server-side, composição dinâmica de dependencies, envelope de resultado e sanitização de erros.
- PostgreSQL RPCs são reservadas a alocação de números e operações que exigem atomicidade, locks, idempotência ou proteção contra mutação direta, como criação de organização, registro/transferência/reversão de estoque e post de recebimento.

Hooks são finos e module-scoped. Usam `useQuery`, `useInfiniteQuery` e `useMutation`, obtêm `currentOrganization`, desabilitam a consulta sem tenant, chamam somente a API do módulo, fazem unwrap do envelope RPC e invalidam query keys do módulo/aggregate. Não importam repositories nem Supabase. Não há optimistic update como padrão; a verdade volta do servidor.

# Padrões encontrados

- Monólito modular com ownership único de entidades e ports como única fronteira cross-domain.
- Camadas `domain/application/infrastructure/ui` e imports absolutos por `#/`; barrels públicos evitam deep imports cross-domain.
- Domínio puro, funcional e persistence-agnostic, com tipos discriminados, factories, policies, value objects e `Result` em áreas ricas.
- Application services construídos por dependency injection explícita, sem container global.
- Aggregates reconstituídos por mappers; leitura nunca dispara factories nem eventos de criação.
- Snapshots congelados em transações históricas para impedir que mudanças cadastrais alterem o passado.
- Repositories segregados por responsabilidade e implementações in-memory usadas em testes unitários/contract tests.
- Infrastructure server-only com dynamic imports na borda RPC e testes que inspecionam a ausência de SQL/credentials no bundle cliente.
- Defesa multi-tenant em profundidade: JWT, membership, tenant-bound factory, guards, filtros, RLS, constraints e testes cross-org.
- Autorização duplicada intencionalmente na UI e no servidor; a verificação efetiva está no application service.
- Permissões centralizadas e tipadas em `resource.action`; roles são apenas presets de grants.
- Migrations SQL timestamped (`YYYYMMDDHHMMSS_assunto.sql`), forward-only, uma preocupação por migration quando prático e correções em nova migration.
- Banco em `public`, tabelas singulares e `snake_case`; IDs UUID; FKs com `_id`; instantes com `_at`; chaves de idempotência com `_key`; snapshots explícitos.
- `organization_id` obrigatório em dados operacionais, índices começando pelo tenant e uniques compostos/parciais por organização.
- Text + `CHECK` é usado amplamente para estados em vez de depender de enums PostgreSQL; aliases TypeScript refinam os tipos gerados.
- RLS habilitada por tabela, policies para `authenticated`, helpers `is_org_member/is_org_owner`, grants mínimos e ausência deliberada de `DELETE` para fatos/cadastros arquiváveis.
- Histories e ledgers append-only protegidos por triggers contra update/delete.
- Operações críticas em `SECURITY DEFINER` com `search_path` fixo, membership verificada, locks ordenados e idempotência por tenant.
- Ledger como fonte da verdade; saldos e search documents como projeções reconstruíveis.
- Eventos de domínio tipados emitidos depois das operações; enquanto não há outbox implementada nos módulos atuais, o collector é in-memory e não deve ser confundido com entrega durável.
- Soft archive para cadastros, cancelamento para transações e reversals para fatos financeiros/estoque.
- File-based routing TanStack; arquivos de rota apenas validam search/guard e delegam a pages dos módulos.
- App Shell e providers compartilhados para session, org, permission, theme, commands, toast, dialogs, errors e services.
- UI “Quiet Instrument”: desktop-first, responsiva, baseada em tokens CSS, uma ação primária por região, tabelas compactas, labels externos, estados loading/error/empty/forbidden e confirmação para descarte/destrutivo.
- Componentes compartilhados em `components/` e primitives em `components/ui/`; módulos compõem esses componentes e mantêm componentes específicos dentro de `ui/`.
- Acessibilidade orientada a WCAG 2.2 AA, teclado, focus visible, status não dependente apenas de cor, overlays acessíveis e suporte a reduced motion.
- Query keys hierárquicas começam em `['rescript', domínio, organizationId]`; troca de organização invalida/limpa escopos para evitar cache cross-tenant.
- TypeScript `strict`, imports type-only, ES modules, sem emissão; Prettier usa 2 espaços, aspas simples, sem ponto e vírgula, trailing commas e largura 90.
- Testes co-localizados como `*.test.ts(x)`: domínio/application com memória, UI com Testing Library, infrastructure com contracts e integração contra Supabase real, além de suites de RLS, concorrência, transações e segurança de bundle. Risco de banco/tenant recebe mais cobertura que UI decorativa.

# Convenções utilizadas

- Identificadores técnicos, pastas, tipos e banco em inglês; textos de UX e documentação operacional em português brasileiro.
- Nome de módulo e tabela no singular quando representa entidade; rotas e agrupamentos podem usar plural legível.
- Arquivos e funções em kebab-case/camelCase; tipos e componentes em PascalCase; factories usam `createX` e adapters concretos usam `SupabaseXRepository`.
- Services expõem `create<Aggregate>Service`; dependencies usam `<Aggregate>AppDeps`; ports usam `<Entity>Repository`, `<Capability>Port`, `<Number>Allocator` e `<Snapshot>Sources`.
- Métodos repository recebem tenant explicitamente como primeiro argumento e IDs em seguida; o adapter compara o argumento com o tenant vinculado na construção.
- Status e eventos são unions discriminadas; transições ficam em `lifecycle.ts`; labels de status derivam do domínio, não são duplicadas nas pages.
- Validação de negócio fica no domínio/application e é repetida por constraints no banco quando estrutural. Validação visual no form melhora UX, mas não substitui o servidor.
- Dinheiro e quantidade não usam float binário para persistência/cálculo crítico. PostgreSQL usa `numeric`; fronteiras recentes usam strings decimais; moeda acompanha o valor e hoje é predominantemente BRL.
- Timestamps são ISO nas fronteiras TypeScript e `timestamptz` no banco; datas civis usam strings `YYYY-MM-DD`/colunas de data.
- Entidades históricas guardam snapshots e não fazem live join para reescrever o passado.
- Operações repetíveis recebem idempotency key tenant-scoped; transferências e reversões carregam correlation/reference IDs.
- Nenhum segredo, usuário Auth ou dado de ambiente entra em migration. Connection strings nunca usam prefixo `VITE_*`.
- Migrations aplicadas não são editadas; usa-se migration corretiva e estratégia expand/contract para breaking changes.
- Após migration, os tipos do banco são regenerados por `npm run db:types`; `packages/database/src/generated.ts` não é editado manualmente.
- Imports de feature usam `#/modules/...`; concerns transversais usam `#/platform/...`; pacotes compartilhados usam `@rescript/...`.
- Código cliente importa apenas contracts, hooks, domain types seguros e stubs RPC; `index.server.ts`, SQL e concrete repositories nunca atravessam a fronteira do bundle.
- Erros enviados à UI são códigos e mensagens controladas; detalhes Supabase/SQL são redigidos.
- Páginas completas usam `RequirePermission`; ações condicionais usam `FeatureGate`; ocultar botão não elimina autorização server-side.
- Formulários bloqueiam double submit, exibem erros de campo e de formulário e confirmam descarte quando dirty. Sucesso usa notification/toast e mutations invalidam o cache correspondente.
- Listas usam busca com debounce, filtros de status, cursor/“carregar mais”, estados explícitos e navegação tipada.
- Ícones de feature devem vir do catálogo da plataforma; valores visuais devem usar tokens de `styles.css`, não cores/dimensões arbitrárias.
- Arquivos gerados, artefatos `dist` e dependências não são fontes para edição manual.

# Fluxo para criação de um novo módulo

1. Identificar o bounded context proprietário, o aggregate root, entidades-filhas, invariantes, lifecycle, fatos históricos e dependências. Consultar ADRs, `DomainContracts`, `DependencyRules` e governança; se ownership ou contrato não estiver definido, registrar a decisão antes da implementação.
2. Definir o contrato público do módulo e os ports necessários. Dependências em outros contextos devem consumir DTOs/snapshots versionáveis por ports; é proibido importar repository ou consultar tabela de outro módulo.
3. Criar `modules/<module>/domain` com tipos tenant-scoped, inputs, lifecycle, validações, eventos e, quando necessário, value objects, policies e factories puras. Fixar regras como dinheiro decimal, soft archive, snapshots e ausência de hard delete.
4. Escrever testes unitários das invariantes, transições, totais, precisão e casos-limite antes de acoplar infraestrutura.
5. Criar `application/ports.ts` ou `application/ports/`, `deps.ts`, erros tipados e o service/facade de use cases. A ordem padrão é autorização → carregamento → validação → policy/lifecycle → persistência → auditoria → eventos.
6. Criar repositories in-memory e um test harness para testar o service, inclusive permissão negada, tenant incorreto, conflito, lifecycle, snapshots e histórico.
7. Modelar a migration forward-only em `supabase/migrations/<timestamp>_<assunto>.sql`: tabelas singulares, `organization_id`, FKs, checks, uniques e índices tenant-first, `updated_at`, archive fields, history/search projections, RLS, policies, grants e comments.
8. Para uma operação multi-tabela crítica, implementar uma função PostgreSQL transacional/idempotente com membership, `search_path` fixo, locks, constraints e rollback integral. Não distribuir a atomicidade por chamadas independentes do frontend ou repositories.
9. Implementar adapters em `infrastructure`: opções vinculadas a tenant/ator, guard server-only, tenant context, mappers, error mapping, repositories específicos, factory de composição e `index.server.ts`. Usar PostgREST + RLS em acessos comuns e o port da RPC/transação nas operações críticas.
10. Adicionar testes de mapper, repository contract, persistência real, RLS cross-tenant, constraints, rollback, idempotência, concorrência e client-bundle safety de acordo com o risco.
11. Regenerar os tipos de banco e expor somente aliases/barrels seguros; nunca exportar concrete repository/SQL pelo barrel público do módulo.
12. Criar `ui/api/contracts.ts`, mapper de erros e `<module>-api.ts` com server functions POST. Cada handler deve recuperar o usuário real, validar membership ativa para a organização alegada, derivar grants, compor o service por dynamic import e retornar o envelope RPC seguro.
13. Criar hooks TanStack Query tenant-scoped, query keys hierárquicas, regras de `enabled`, unwrap de erros e invalidações após mutation. Evitar estado React como fonte de verdade e optimistic updates sem necessidade comprovada.
14. Criar pages, forms e components específicos usando App Shell, design tokens, primitives compartilhadas, loading/error/empty/forbidden, debounce, cursor, dialogs e notifications existentes. Aplicar `RequirePermission` na página e `FeatureGate` nas ações.
15. Criar rotas file-based finas sob `routes/_app`, delegando a pages do módulo, e registrar navegação/command palette apenas pelos mecanismos da plataforma. Regenerar a route tree pelo script existente.
16. Atualizar chaves e role presets em `@rescript/permissions`, query keys/invalidação de troca de organização, documentação do módulo e ADRs somente quando o contrato exigir.
17. Executar typecheck, lint, testes, integração Supabase/RLS e build. O módulo só está completo quando isolamento, autorização, atomicidade proporcional ao risco, acessibilidade e ausência de dependências proibidas estiverem verificadas.

# Melhorias sugeridas (sem alterar arquitetura)

- Consolidar a composição repetida das server functions (JWT, membership, grants, tenant e actor) em um helper de plataforma compatível com o mesmo fluxo. Hoje cada `*-api.ts` replica esse código, aumentando risco de divergência sem benefício de domínio.
- Uniformizar o uso de `validator`/`inputValidator` e adotar validação runtime efetiva para payloads RPC. Vários validators atuais apenas retornam o input tipado, o que protege em compile time, mas não contra requests externos malformados.
- Levar todas as operações multi-repository que não podem falhar parcialmente para transações PostgreSQL/SQL ports no padrão já usado por Catalog, Inventory Ledger e Goods Receipt. Criação/cancelamento de contas a pagar, manutenção de itens/totais de compras e escrita de histórico podem hoje deixar efeitos parciais se uma chamada intermediária falhar.
- Implementar outbox durável quando efeitos cross-domain começarem a depender dos eventos existentes. Os collectors in-memory preservam o contrato, mas não oferecem entrega, replay ou atomicidade com a escrita.
- Adicionar optimistic concurrency/version checks aos aggregates editáveis. O Catalog documenta last-write-wins e outros cadastros também dependem de `updated_at` sem precondition, permitindo perda silenciosa em edição simultânea.
- Concluir e documentar o cutover dos caminhos legados `products` e estoque product-scoped para Catalog/Inventory variant-scoped, seguindo expand/cutover/contract e sem dual-write. Enquanto coexistirem, marcar claramente as rotas e barrels legados para impedir que virem referência para módulos novos.
- Substituir as telas de vendas mockadas apenas quando o bounded context Sales for implementado conforme os ports e snapshots já definidos; até lá, sinalizar mocks explicitamente na UI/testes para não confundi-los com persistência real.
- Completar testes E2E dos fluxos críticos. A cobertura unitária e de integração é ampla, mas a própria documentação dos módulos registra a ausência de E2E para Catalog/Inventory; priorizar autenticação → troca de organização → operação → histórico e o fluxo PO → recebimento → ledger → conta a pagar.
- Criar enforcement automatizado das dependency rules já normativas: path lint para impedir imports cross-domain de infrastructure/repositories, imports server-only no cliente, acesso a Lucide fora do catálogo e uso de tabelas de outro bounded context.
- Garantir que toda migration nova tenha teste automatizado de RLS, grants, imutabilidade e isolamento antes do merge, conforme a estratégia documentada; manter uma matriz executável por tabela/função reduz lacunas de policy.
- Regenerar e validar os tipos Supabase em CI após migrations para detectar drift entre `supabase/migrations`, `packages/database/src/generated.ts` e o banco conectado.
- Atualizar os documentos antigos marcados como “pré-implementação” ou “futuro” com um cabeçalho de supersessão/estado atual, sem apagar seu histórico. O código já implementa áreas que esses documentos ainda descrevem como inexistentes.
- Propagar e persistir `actorIp`/correlation ID de forma uniforme nas RPCs e histories. Os deps já preveem IP, mas a composição atual frequentemente não o fornece.
- Centralizar o contrato base de `RpcResult/RpcError` na plataforma mantendo códigos específicos por módulo, reduzindo duplicação sem remover a responsabilidade local de mapear mensagens e field errors.
- Tornar o padrão decimal único e verificável em todos os módulos: strings/VOs para transporte e cálculo, `numeric` no PostgreSQL e testes que proíbam `number` em dinheiro. O shared kernel ainda contém um stub `Money.amount: number`, divergente do padrão mais seguro já aplicado em Catalog, Purchase e Payable.
- Completar a fundação de observabilidade com implementação real dos ports existentes, incluindo logs estruturados com tenant, aggregate, operation e correlation ID, sempre sem PII/secrets e sem misturar logs técnicos com audit trail.
