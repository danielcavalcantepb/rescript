---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / DomainValidation
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Validação do Domínio — 15 Perguntas-Guia

Respostas agregadas após 55 walkthroughs.

| # | Pergunta | Resposta |
|---|---|---|
| 1 | O domínio suporta os cenários? | **Sim**, com ressalvas e 5 pontos de decisão. Nenhum cenário bloqueado. |
| 2 | Entidade faltando? | Possível `OwnershipTransferRequest`; `ImportConflictDecision` se ask; `Return` como comando/agregado ambíguo (WT-04); `request_hash` em IdempotencyRecord. |
| 3 | Estado faltando? | `PedidoExpirado` opcional (FQ-06); demais máquinas OK. |
| 4 | Transição inválida/ambígua? | Cancel após paid (FQ-01); Confirm from Draft sem reserva explícita (41). |
| 5 | Regra sem responsável? | Financeiro da devolução; ajuste vs reserved; preço do rascunho. |
| 6 | Responsabilidade duplicada? | Insight vs Decision Center (OK derivado); Payment vs futuro GL (OK). |
| 7 | Derivado como fonte? | Não estruturalmente; totais Sale materializados na confirmação com regra de recálculo prévia — OK se documentado. |
| 8 | Vazamento multi-tenant? | Não no modelo; mitigado por RLSMatrix + checks. |
| 9 | Inconsistência financeira? | Risco em 14/17/21 até FQ fecharem. |
| 10 | Inconsistência estoque? | Mitigada se locks+H policy; conflito H-02/RN-34. |
| 11 | Falha idempotência? | Coberto; gap request_hash (49). |
| 12 | Ops que deveriam ser TX? | Confirm/Cancel/Reserve/Pay/Reverse/Transfer/Import batch — já catalogadas. Return se atômica. |
| 13 | Conflito entre docs? | H-02 vs RN-34; OQ-09 vs FD-01 wording; ver ConsistencyReview. |
| 14 | Abstração prematura? | GL, PriceList, custom roles — corretamente FUT. `partially_reversed` pode ser prematuro se FQ-02=A. |
| 15 | Requisito sem representação? | Devolução financeira; política import conflict; matriz suspensão detalhada. |

## Veredito parcial

Domínio **apto para schema físico após fechar FQs/OQs bloqueantes**; não requer remodelagem estrutural.
