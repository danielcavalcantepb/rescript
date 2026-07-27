---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: 09_DEVELOPMENT_WORKFLOW
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Fluxo de Desenvolvimento

## Responsabilidade deste documento

Este documento define o fluxo ideal desde uma necessidade até a entrega revisada e documentada.

## Visão geral

`Necessidade → Descoberta → Decisão → Design → Implementação → Testes → Build → Review → Entrega → Observação`

## 1. Definir o resultado

- descrever usuário, tarefa e resultado esperado;
- identificar produtividade/cliques afetados;
- definir escopo e não escopo;
- registrar métricas ou sinais de sucesso;
- confirmar que a solução não é apenas “adicionar uma tela”.

## 2. Ler o contexto

Ler, nesta ordem:

1. `00_PRODUCT_VISION`;
2. `03_PRODUCT_DESIGN`;
3. `01_PROJECT_ARCHITECTURE`;
4. documento do módulo/domínio;
5. ADRs e migrations aplicáveis;
6. código e testes representativos.

Verificar worktree antes de editar e preservar mudanças existentes.

## 3. Analisar domínio e arquitetura

- localizar bounded context e owner;
- identificar aggregate, invariantes e lifecycle;
- mapear ports e dependencies;
- definir tenant, permissions e audit;
- classificar operação crítica/atômica/idempotente;
- avaliar snapshot, projection, event e history;
- estimar volume, concorrência e retenção;
- confirmar que não há caminho legado ou dual-write.

Ambiguidade relevante exige decisão antes de implementação.

## 4. Desenhar a experiência

- mapear happy path e exceções;
- contar cliques e alternâncias de contexto;
- decidir Workspace, página, drawer ou modal;
- definir informações visíveis na lista e no resumo;
- desenhar loading, empty, error, forbidden, partial e concurrency;
- considerar teclado, bulk, mobile e milhares de registros;
- revisar checklist de Product Design.

## 5. Planejar a mudança

Dividir em increments verificáveis:

- domain;
- application/ports;
- migration/infrastructure;
- RPC/hooks;
- Workspace/UI;
- testes;
- documentação/cutover.

Mudança breaking usa expand/cutover/contract. Operações críticas não são divididas de forma que permita estado parcial.

## 6. Implementar

Ordem recomendada:

1. domain e unit tests;
2. application ports/services e memory tests;
3. migration, constraints, RLS e transaction functions;
4. adapters/mappers e integration tests;
5. contracts/server functions;
6. hooks/cache;
7. Workspace/pages/components;
8. E2E crítico;
9. documentação.

Reutilizar plataforma e components existentes. Não fazer refactor não relacionado.

## 7. Testar

### Sempre

- typecheck;
- lint;
- unit tests;
- build.

### Quando há banco

- migration limpa;
- generated types;
- repository integration;
- constraints;
- RLS cross-tenant;
- rollback;
- grants.

### Quando há operação crítica

- idempotência;
- concurrency;
- partial failure;
- reversal/cancel;
- audit/history;
- permission change.

### Quando há UI

- loading/error/empty/forbidden;
- keyboard/a11y;
- permission gates;
- form errors;
- cache invalidation;
- responsive behavior;
- fluxo E2E principal.

## 8. Build e inspeção

- confirmar ausência de server-only code no client bundle;
- inspecionar warnings e tamanho quando relevante;
- verificar route generation;
- testar navegação e deep links;
- revisar queries e planos em mudança de alto volume;
- validar que secrets não foram incluídos.

## 9. Review

### Produto

- reduz cliques?
- mantém contexto?
- parece Workspace enterprise?
- funciona em volume?

### Arquitetura

- owner correto?
- cross-domain via port?
- sem circular dependency/dual-write?
- operação crítica atômica?

### Segurança

- tenant verificado?
- permission no servidor?
- RLS/grants corretos?
- erro e audit seguros?

### Qualidade

- regra não duplicada?
- tests proporcionais ao risco?
- generated files tratados corretamente?
- documentação atualizada?

Falha em gate bloqueia merge independentemente de CI verde.

## 10. Entrega

- aplicar migration de forma controlada;
- usar rollout/feature flag quando necessário;
- executar reconcile/cutover runbook;
- comunicar mudança de fluxo;
- manter rollback de aplicação e forward fix de schema;
- não remover estrutura antiga antes de confirmar cutover.

## 11. Observar

- latência, erros, lock waits e retries;
- adoção e conclusão de tarefa;
- abandono e cliques reais;
- incidentes de permission/tenant;
- reconciliação de projections;
- feedback de usuários.

Aprendizado pode ajustar UX e priorização, não contornar invariantes.

## Definition of Done

Uma funcionalidade está pronta quando:

- entrega resultado de produto definido;
- segue Workspaces/Product Design;
- preserva arquitetura e ownership;
- é tenant-safe e permission-safe;
- é atômica/idempotente quando necessário;
- passa quality gates;
- possui observabilidade proporcional;
- documentação e decisões estão atualizadas;
- nenhum trabalho obrigatório permanece oculto como “depois”.
