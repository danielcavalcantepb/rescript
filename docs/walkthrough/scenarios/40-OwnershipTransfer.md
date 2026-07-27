---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 40-OwnershipTransfer
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 40 — Transferência de Propriedade

## Cenário

Owner transfere propriedade; novo owner aceita; antigo muda de papel; falha no meio.

### Objetivo
Atomicidade de TransferOwnership; invariante “sempre ≥1 owner”.

### Atores
Owner atual O1; futuro owner O2 (já member)

### Estado inicial
O1 owner; O2 member admin.

### Pré-condições
O2 membership active.

### Passos executados

#### 1. InitiateTransfer
5. OwnershipTransferRequest pending; Audit
**Lacuna:** modelo two-phase (initiate+accept) vs single atomic swap pouco fechado em IdentityModel.

#### 2. Accept (caminho feliz) — TX única recomendada
6. O2→owner; O1→admin (ou role escolhida); request completed
7. Locks membership rows
8–10. Audit OwnershipTransferred
13. Se falha mid-TX → rollback; ainda exatamente um owner

#### 3. Falha após demote O1 antes promote O2 (bug)
Violaria invariante — **deve ser impossível** se TX única

### Estado final esperado
Um owner; histórico de transferência; org operável.

### Invariantes verificadas
≥1 owner; tenant; audit.

### Inconsistências encontradas
- Aceite assíncrono com expiração: se O1 já demoted fora da TX com O2, gap.
- Transfer para user sem membership: convite+transfer acoplados?

### Ajustes recomendados
Operação atômica única `TransferOwnership(to_user)` se to_user já member; two-phase só com estado que **não** demote O1 até accept.

### Classificação
**aprovado com ressalvas**
