---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 10_AI_GUIDE
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Guia para Agentes de IA

## Responsabilidade deste documento

Este documento permite que Codex, ChatGPT, Claude, Cursor e outros agentes compreendam e contribuam com segurança. Ele não concede autoridade adicional para alterar produto, dados ou sistemas externos.

## Regra principal

Não invente arquitetura. A arquitetura existente é definitiva. Evolua por extensão dos padrões atuais, preserve ownership e nunca reescreva um módulo por preferência técnica.

## Ordem de leitura obrigatória

Antes de propor ou implementar:

1. `docs/00_PRODUCT_VISION.md`;
2. `docs/03_PRODUCT_DESIGN.md`;
3. `docs/01_PROJECT_ARCHITECTURE.md`;
4. `docs/02_ENGINEERING_GUIDE.md`;
5. `docs/05_MODULE_STANDARDS.md`;
6. `docs/06_DOMAIN_GUIDE.md`;
7. `docs/08_ARCHITECTURE_DECISIONS.md`;
8. `docs/09_DEVELOPMENT_WORKFLOW.md`;
9. documentação/ADRs específicos do módulo;
10. código, migrations e testes representativos.

Para UI, ler também `04_UI_GUIDELINES`. Para priorização, ler `07_ROADMAP`.

## Como entender uma tarefa

Identifique:

- usuário e objetivo;
- bounded context proprietário;
- aggregate e lifecycle;
- dados canônicos e projections;
- dependencies e ports;
- tenant e permission requirements;
- audit/history/events;
- atomicidade/idempotência;
- Workspace e impacto em cliques;
- volume e concorrência;
- decisões/ADRs aplicáveis.

Se a tarefa disser apenas “criar CRUD”, reinterpretar dentro dos padrões: entidade importante precisa de Workspace e contexto. Não ampliar escopo sem autorização; apresente a incompatibilidade quando necessário.

## Como explorar o projeto

- leia instruções locais (`AGENTS.md`) antes de editar;
- use busca rápida por arquivos/texto;
- inspecione git status e preserve mudanças do usuário;
- compare pelo menos um módulo simples e um módulo rico;
- leia migration e tests do domínio afetado;
- diferencie código atual de documentação histórica/pré-implementação;
- não trate `dist`, generated files ou mocks como arquitetura canônica;
- identifique caminhos legados antes de copiar padrões.

## Como criar um novo módulo

1. confirmar ownership e decisão de produto;
2. definir domain types, invariants e lifecycle;
3. definir application ports e dependencies;
4. criar memory tests;
5. modelar migration/RLS/transactions;
6. implementar server-only adapters;
7. criar serializable RPC contracts e server functions;
8. criar tenant-scoped hooks/cache;
9. criar Workspace e listas produtivas;
10. adicionar audit, events, search projection e tests;
11. executar quality gates;
12. atualizar documentação/ADR quando aplicável.

Nunca comece pela tabela ou pelo formulário sem definir domínio e tarefa.

## Como reutilizar a arquitetura

- copie a forma das responsabilidades, não código indiscriminadamente;
- use Catalog para aggregate rico;
- use Inventory Ledger para operações imutáveis/idempotentes;
- use Customers/Suppliers para children/history/search;
- use Purchase para snapshots e itens;
- use Receiving para transação cross-domain;
- use Payable para parcelas e cadeia de origem;
- use App Shell para concerns transversais;
- use shared UI components e tokens;
- use permission keys existentes ou adicione-as centralmente.

## Como evitar duplicação

Antes de criar:

- busque capability na plataforma;
- procure component equivalente;
- procure VO/policy canônico;
- verifique port público existente;
- verifique query key/error contract;
- verifique decisão anterior.

Não abstraia conceitos diferentes apenas porque têm os mesmos campos. Não copie regra de domínio para UI. Não implemente novamente auth/membership/permissions em cada módulo quando houver helper oficial aprovado.

## Regras proibitivas

Nunca:

- acessar table/repository de outro bounded context sem port;
- colocar preço em Product/Variant;
- tratar Product como unidade de estoque nova;
- fazer dual-write entre legado e modelo atual;
- atualizar/deletar ledger ou history;
- confiar em `organizationId` do cliente;
- verificar role name na UI;
- importar server-only no client;
- calcular dinheiro crítico com float;
- dividir operação atômica em requests independentes;
- usar search projection como fonte canônica;
- atualizar snapshot histórico;
- criar modal para fluxo complexo;
- criar tela importante como CRUD sem Workspace;
- inventar dados ou indicadores;
- editar migration aplicada;
- alterar arquivo gerado manualmente;
- incluir refactor não solicitado.

## Como tomar decisões

Use esta ordem:

1. segurança e integridade;
2. decisão/ADR aceito;
3. ownership e domínio;
4. produtividade e contexto;
5. consistência com módulos existentes;
6. escalabilidade proporcional;
7. simplicidade;
8. preferência técnica.

Quando houver conflito real, pare e proponha decisão documentada. Não resolva silenciosamente no código.

## Checklist antes de implementar

- entendi o objetivo do usuário?
- li os documentos oficiais relevantes?
- identifiquei owner e aggregate?
- encontrei referências atuais, não legadas?
- defini ports e boundaries?
- considerei tenant, permissions e audit?
- avaliei atomicidade, retry e concurrency?
- desenhei Workspace/contexto e contei cliques?
- considerei milhares de registros?
- preservei mudanças existentes?

## Checklist antes de concluir

- nenhuma arquitetura foi alterada por preferência?
- nenhuma regra foi duplicada?
- nenhum boundary foi violado?
- tests e build apropriados foram executados?
- RLS/tenant/permissions foram verificados?
- operação crítica é íntegra?
- UI segue Product Design/UI Guidelines?
- documentação está coerente?
- arquivos alterados são apenas os necessários?
- limitações e verificações foram comunicadas com precisão?

## Comunicação do agente

- liderar com resultado;
- declarar assumptions relevantes;
- distinguir fato observado de recomendação;
- informar riscos e limitações sem dramatizar;
- não alegar testes ou escalabilidade não executados;
- não esconder falha parcial;
- referenciar arquivos com caminhos claros;
- manter updates concisos durante trabalho longo;
- entregar resumo, verificações e próximos riscos reais.

## Tarefas exclusivamente documentais

Quando a solicitação proibir código:

- não executar formatadores que alterem fontes;
- não regenerar tipos/rotas;
- não modificar migrations;
- criar apenas os documentos autorizados;
- verificar git status por paths;
- preservar documentação histórica salvo pedido explícito de remoção.

## Fonte de verdade

Os documentos numerados em `docs/` são a entrada oficial. ADRs aceitos detalham decisões específicas. Código/migrations representam o estado implementado. Se documentação oficial e implementação divergirem, registrar a divergência; não assumir silenciosamente que uma delas está correta.

Com essa leitura, qualquer agente deve conseguir contribuir imediatamente sem introduzir arquitetura paralela, duplicação, experiência CRUD ou risco multi-tenant.
