---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0008-internal-events
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0008 — Eventos Internos de Domínio

**Status:** Aceito · **Reversibilidade:** média

## Contexto
Módulos precisam reagir a fatos (venda confirmada → insights/notificações/fiscal) sem acoplamento direto. Detalhes em `../DomainEvents.md`.

## Problema
Como desacoplar módulos e disparar efeitos secundários de forma confiável, sem infraestrutura de streaming prematura?

## Alternativas
- **A. Eventos de domínio internos** (nomes no passado) + processamento assíncrono via outbox/fila.
- **B. Chamadas diretas** entre módulos.
- **C. Event streaming (Kafka)** desde o início.

## Decisão
**(A)** Eventos de domínio imutáveis (`SaleConfirmed`, etc.), com `organization_id`, id único e timestamp; consumidores idempotentes; entrega via outbox (ADR-0009).

## Justificativa
(B) acopla e alonga transações. (C) é infraestrutura distribuída pesada, injustificada na escala atual (AP5, AP7). (A) desacopla com custo mínimo dentro do monólito.

## Consequências positivas
- Baixo acoplamento; módulos evoluem independentes.
- Base para extrair consumidores no futuro (`../Scalability.md`).

## Consequências negativas
- Consistência eventual nos efeitos secundários.
- Exige disciplina de idempotência.

## Riscos
Ordenação/duplicação (mitigadas por idempotência e ordenação por chave quando necessário).

## Gatilhos de revisão
- Volume de eventos exigindo fila gerenciada ou streaming.
- Necessidade de ordenação global estrita.
