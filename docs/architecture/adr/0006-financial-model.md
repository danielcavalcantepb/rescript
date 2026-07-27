---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0006-financial-model
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0006 — Modelo Financeiro (entidades separadas + ledger)

**Status:** Aceito · **Reversibilidade:** BAIXA (cara de mudar) — decisão estrutural

## Contexto
O financeiro precisa suportar pagamentos parciais, múltiplos pagamentos, estornos, parcelas e conciliação. "Pago" não pode ser um booleano. Detalhes em `../FinancialArchitecture.md`.

## Problema
Como modelar recebíveis/pagamentos para refletir a realidade financeira sem inconsistência nem duplicidade?

## Alternativas
- **A. Entidades separadas** (Venda, Recebível, Parcela, Pagamento, Movimentação) com situações **derivadas** + ledger financeiro.
- **B. Campo booleano `pago`** na venda.
- **C. Um único status de venda** cobrindo tudo.

## Decisão
**(A)** Venda, Recebível, Parcela, Pagamento e Movimentação Financeira como entidades distintas com ciclos próprios; "pago" é **derivado** dos pagamentos; caixa é derivado de um **ledger financeiro** append-only; idempotência no registro de pagamento.

## Justificativa
(B)/(C) tornam impossível representar parciais, múltiplos pagamentos, estornos e conciliação — e corrompem a confiança nos dados. (A) reflete a realidade, previne duplicidade (idempotência + constraints) e permite conciliação futura. Dinheiro nunca em float.

## Consequências positivas
- Suporta parciais, múltiplos pagamentos, estornos, parcelamento.
- Caixa reconstruível; base para insights financeiros.
- Sem duplicidade de recebimento.

## Consequências negativas
- Modelo mais rico (mais tabelas/estados).
- Situações derivadas exigem cálculo consistente.

## Riscos
R2 (inconsistência/duplicidade) — mitigado por idempotência, transações e constraints (`../FailureModes.md`).

## Complemento (decisões do fundador)
- **Juros e multa:** fora do MVP; fronteira reservada para V1 (FD-04). MVP: valor original, desconto, parcial, vencimento, atraso, estorno, cancelamento.
- **Moeda:** operacional BRL no MVP; Money carrega moeda; sem FX/multi-moeda (FD-07). Não espalhar string `"BRL"` rígida — usar moeda da organização.

## Gatilhos de revisão
- Introdução de juros/multa (V1).
- Conciliação bancária.
- Representação monetária definitiva (centavos vs. numeric).
- Multi-moeda / FX.
