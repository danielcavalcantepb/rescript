# ADR-0012 — Estrutura do Repositório (Monorepo Mínimo)

**Status:** Aceito · **Reversibilidade:** alta

## Contexto
Time pequeno; fronteiras de domínio fortes que queremos impor mecanicamente; risco de overengineering. Detalhes em `../RepositoryStrategy.md`.

## Problema
Aplicação única por módulos ou monorepo? Como impor fronteiras sem criar complexidade prematura?

## Alternativas
- **A. Monorepo mínimo:** `apps/web` + poucos pacotes críticos (`domain`, `database`, `auth`, `permissions`).
- **B. Aplicação única** por módulos (fronteiras só por disciplina).
- **C. Monorepo completo** com ~10 pacotes desde o início.

## Decisão
**(A)** Monorepo enxuto: `apps/web` + os 4 pacotes críticos. `domain` é puro (sem framework/Supabase). Novos pacotes só na 3ª repetição ou fronteira crítica comprovada.

## Justificativa
(B) deixa fronteiras dependentes de disciplina e torna a migração futura dolorosa. (C) é abstração especulativa (AP6) que drena o time. (A) impõe as fronteiras que já sabemos críticas com custo baixo e evita migração futura.

## Consequências positivas
- Fronteiras impostas pelo build (import proibido falha).
- Domínio isolado (testável, anti lock-in).
- Cresce por necessidade.

## Consequências negativas
- Um pouco mais de tooling que app única.
- Requer disciplina para não multiplicar pacotes.

## Riscos
R12 (overengineering) — mitigado pela regra da 3ª repetição.

## Gatilhos de revisão
- Reuso real de UI/validação; segundo app; SDK público; extração de serviço.
- Overhead do monorepo atrapalhando o time (reconsiderar).
