---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0010-insights
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0010 — Insights Determinísticos

**Status:** Aceito · **Reversibilidade:** média

## Contexto
A camada Interpretar deve gerar conclusões confiáveis, explicáveis e rastreáveis, sem depender de IA generativa. Governada por `../../IntelligencePrinciples.md`. Detalhes em `../InsightArchitecture.md`.

## Problema
Como gerar inteligência que o dono confie, sem "chutes" nem alarmismo, e que aponte sempre para dados rastreáveis?

## Alternativas
- **A. Motor de regras determinísticas** sobre dados transacionais + rastreabilidade obrigatória; IA generativa só para redação, no futuro.
- **B. IA generativa** como motor de insights desde o início.
- **C. BI configurável** (usuário monta relatórios).

## Decisão
**(A)** Regras determinísticas versionadas (do `../../InsightCatalog.md`), cada insight respondendo 8 perguntas de rastreabilidade; dedup/expiração/relevância; sem dados suficientes → sem insight. IA generativa fica reservada para *redigir* explicações sobre dados já verdadeiros (nunca decidir/inventar).

## Justificativa
(B) arrisca inventar dados e destruir a confiança (viola IP1/IP2). (C) transformaria o Rescript num BI, o que `../../Positioning.md` proíbe. (A) entrega inteligência explicável e auditável — a diferença central do produto.

## Consequências positivas
- Confiança: toda conclusão é rastreável e explicável.
- Determinístico é testável e previsível.
- Evolução controlada (anomalia estatística; depois IA só para redação).

## Consequências negativas
- Regras precisam ser escritas/mantidas (não "aprende sozinho").
- Cobre menos casos que um modelo genérico — por design (conservador).

## Riscos
R7 (fadiga/insights ruins) — mitigado por relevância, dedup, expiração, feedback.

## Gatilhos de revisão
- Maturidade para camada de detecção de anomalias.
- Uso de IA generativa apenas para redação (quando simplificar de fato).
