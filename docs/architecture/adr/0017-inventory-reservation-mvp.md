---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: ADR
Scope: architecture / adr / 0017-inventory-reservation-mvp
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ADR-0017 — Reserva de Estoque no MVP

**Status:** Aceito · **Reversibilidade:** média

## Contexto
Pedidos B2B, orçamentos e separação de mercadoria exigem comprometer saldo sem baixar. FD-02.

## Problema
Como prevenir venda duplicada do mesmo saldo antes da confirmação, sem confundir reserva com saída?

## Alternativas
- **A. Reserva no MVP** como entidade distinta do ledger físico.
- **B. Só baixa na confirmação.**
- **C. Reserva modelada como tipo de InventoryMovement.**

## Decisão
**(A)** Reservation no agregado InventoryItem, **separada** de InventoryMovement. Saldos: físico, reservado, disponível (= físico − reservado). Reserva ≠ saída. Confirmação **consome** reserva e **gera** saída no ledger.

## Justificativa
Necessidade de negócio do beachhead. Tratar reserva como movimento físico (C) corrompe o significado do ledger. Omitir reserva (B) permite oversell em pedidos abertos.

## Consequências positivas
- Ciclo orçamento/pedido seguro; histórico de compromisso.
- Ledger físico permanece limpo (entradas/saídas/ajustes/estornos).

## Consequências negativas
- Expiração, liberação e concorrência a implementar e testar.

## Riscos
Reserva órfã / expiração falha — mitigado por job + estados explícitos + testes.

## Gatilhos de revisão
Fulfillment complexo; multi-depósito; picking avançado.
