---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / Constraints
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Constraints e Integridade Lógica

> Classificação: **DB** garantia de banco futura · **DOM** domínio · **BOTH** · **ASYNC** · **AUDIT**

---

## 1. Transversais

| ID | Regra | Classe |
|---|---|---|
| C-TENANT | organization_id consistente em grafos relacionados | BOTH |
| C-NO-CROSS | proibido FK cross-org | BOTH |
| C-MONEY | amount scale válido; currency presente | BOTH |
| C-QTY | quantity ≥ 0 salvo tipos que permitem sinal; sem float | BOTH |
| C-APPEND | movements/audit/outbox payload não UPDATE destrutivo | BOTH |
| C-IDEM | idempotency_key única por escopo | DB |

---

## 2. Identity

| Regra | Classe |
|---|---|
| ≥1 owner ativo por org | DOM (+ DB partial unique) |
| Membership (user,org) único se active | DB |
| Invite email+org único pending | DB |

---

## 3. Catalog

| Regra | Classe |
|---|---|
| ≥1 variant por product | DOM |
| combination_hash único por product | DB |
| attrs sem duplicar no product | DOM |
| não alterar combination após movement | DOM |
| SKU único por org se presente | DB |

---

## 4. Inventory

| Regra | Classe |
|---|---|
| available = physical − reserved | DOM (+ check materializado) |
| reserved ≥ 0 · physical policy RN-34 | BOTH |
| reservation ≠ movement | DOM |
| movement exige source | BOTH |
| ajuste com motivo | DOM |
| avg cost key (org,loc,variant) | DB — OQ-09 |

---

## 5. Sale / Finance

| Regra | Classe |
|---|---|
| transições só máquina oficial | DOM |
| totais coerentes com itens+descontos no confirm | DOM |
| desconto ≤ max; auth se acima | DOM |
| self-auth proibido se policy | DOM |
| confirm atômico com estoque+receivable | DOM TX |
| payment amount ≤ saldo installment | BOTH |
| receivable sem juros MVP | DOM FD-04 |

---

## 6. Imutabilidade

| Estrutura | Imutável |
|---|---|
| InventoryMovement | linha completa |
| unit_cost_applied | sim |
| SaleItem snapshots pós-confirm | sim |
| Payment confirmado (valores) | sim; estorno=novo |
| AverageCostLedger | append |
| AuditEvent | append |
| Outbox payload | sim |

---

## 7. Opcionais vs obrigatórios

Ver `Attributes.md`. Cadastros importados podem omitir document/email. Sale.customer_id opcional se policy.

---

## 8. Auditáveis (alto)

Membership changes · Confirm/Cancel Sale · Payments · Adjust inventory · Policy changes · Support grants · Discount auth · Ownership transfer
