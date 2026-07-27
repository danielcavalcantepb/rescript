---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / AuditPersistence
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Persistência de Auditoria

---

## 1. AuditEvent (FT)

Append-only. Campos: ver `Attributes.md` / `AuditModel.md`.

## 2. O que auditar (mínimo)

Authz changes · Confirm/Cancel Sale · Payments/Reversals · Inventory adjust · Discount auth · Policy changes · Ownership · Support access · Import commit · Login suporte

## 3. O que NÃO copiar

Secrets · tokens · senhas · payloads fiscais completos desnecessários · cartão · dumps enormes de PII (mascarar document)

## 4. Diferenças

| Tipo | Papel |
|---|---|
| AuditEvent | quem/quando/quê (compliance/ops) |
| Domain ledger | verdade de estoque/financeiro |
| Outbox | integração |
| SaleStatusHistory | histórico de estado do agregado |
| Logs técnicos | observabilidade, retenção curta |

## 5. Suporte

SupportAccessGrant id no AuditEvent quando aplicável.
