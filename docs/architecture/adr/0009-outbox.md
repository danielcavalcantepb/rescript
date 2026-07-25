# ADR-0009 — Padrão Outbox + Fila em PostgreSQL

**Status:** Aceito · **Reversibilidade:** média

## Contexto
Efeitos secundários de operações críticas (insights, notificações, fiscal) não podem se perder. A stack não define um mecanismo de jobs assíncronos (lacuna em `../TechnologyEvaluation.md` §7). Detalhes em `../DomainEvents.md`.

## Problema
Como garantir que "aconteceu ⇒ será processado" de forma confiável, sem publicar em fila externa dentro da transação (risco de inconsistência)?

## Alternativas
- **A. Outbox transacional + fila baseada em PostgreSQL** (`FOR UPDATE SKIP LOCKED`) + `pg_cron`/worker.
- **B. Publicar direto em fila externa** após o commit.
- **C. Fila gerenciada externa** desde o início.

## Decisão
**(A)** Gravar eventos numa **tabela outbox na mesma transação** do dado; um worker publica após o commit, com retries+backoff, dead-letter e idempotência. Fila implementada em PostgreSQL para o estágio atual.

## Justificativa
(B) tem janela de inconsistência (commit ok, publicação falha). (C) adiciona fornecedor e complexidade antes da necessidade (AP7). (A) é atômico com o dado, barato (uma tabela + worker) e transacionalmente correto. **A outbox é necessária desde o primeiro efeito secundário que não pode se perder** — ou seja, desde já.

## Consequências positivas
- Atomicidade evento↔dado; nada se perde silenciosamente.
- Sem novo fornecedor; alinhado ao Postgres.
- Caminho claro para fila gerenciada quando escalar.

## Consequências negativas
- Worker/polling a manter e monitorar.
- Fila em Postgres tem teto de throughput (suficiente por anos).

## Riscos
R4 (jobs async) — mitigado por monitoramento de backlog/DLQ (`../Observability.md`).

## Gatilhos de revisão
- Backlog/throughput excedendo o que o Postgres atende → fila gerenciada.
- Necessidade de fan-out massivo.
