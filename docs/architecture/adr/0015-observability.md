# ADR-0015 — Observabilidade

**Status:** Aceito · **Reversibilidade:** alta

## Contexto
Precisamos enxergar o sistema em produção (transações, jobs, outbox, webhooks, segurança) sem vazar dados sensíveis. A stack não fixa provedor. Detalhes em `../Observability.md`.

## Problema
Como obter logs/métricas/tracing e alertas úteis, com correlação ponta a ponta, de forma barata e sem lock-in?

## Alternativas
- **A. Logs estruturados + métricas + tracing + alertas, com `correlation_id` propagado, atrás de `packages/observability`; provedor gerenciado de baixo custo.**
- **B. Só logs** (sem métricas/tracing).
- **C. Stack de observabilidade auto-hospedada** completa.

## Decisão
**(A)** Três pilares + alertas; `correlation_id` em request/job/evento ligando logs, tracing e audit log; SDK do provedor isolado num pacote; provedor gerenciado inicial de baixo custo; logs livres de PII desnecessária.

## Justificativa
(B) cega o time em incidentes de performance/consistência. (C) é operacionalmente pesado para o estágio (AP7). (A) dá visibilidade suficiente com custo e lock-in controlados.

## Consequências positivas
- Diagnóstico ponta a ponta via correlação.
- Alertas sobre outbox/DLQ/webhooks/segurança.
- Troca de provedor de baixo custo (isolado).

## Consequências negativas
- Custo de provedor cresce com volume (R13).
- Disciplina para não logar dados sensíveis.

## Riscos
Vazamento por logs (mitigado por redAção/minimização — `../Privacy.md`); custo (R13).

## Gatilhos de revisão
- Custo de observabilidade fora da meta.
- Necessidade de retenção/consulta avançada (reavaliar provedor).
