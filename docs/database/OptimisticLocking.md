---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / OptimisticLocking
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Optimistic Locking

---

## 1. Campo `version`

Inteiro monotônico; incrementa a cada update bem-sucedido da entidade mutável.

## 2. Onde aplicar (MVP)

| Entidade | Motivo |
|---|---|
| Sale | edição concorrente pré-confirmação |
| Customer / Product (opcional) | conflitos raros; útil |
| Membership | mudança de papel |

## 3. Onde NÃO aplicar

Ledgers append-only · Payment confirmado · InventoryMovement · Audit · Outbox payload.

## 4. Fluxo

1. Read version=N  
2. Update … WHERE id AND version=N  
3. Se 0 rows → conflito → UX “recarregar”  
4. ConfirmSale: também valida version **ou** status+lock pessimista (ambos ok)

## 5. Relação com pessimista

Confirm/estoque: pessimista nos balances. Wizard edição: optimista na Sale.
