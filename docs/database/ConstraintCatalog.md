---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / ConstraintCatalog
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Catálogo de Constraints Lógicas

Legenda de garantia: **DB** · **DOM** (domínio) · **BOTH** · **ASYNC** · **AUDIT**

| ID | Regra | Garantia |
|---|---|---|
| C-TENANT-01 | FKs tenantadas ⇒ mesmo organization_id | BOTH |
| C-TENANT-02 | organization_id NOT NULL em tabelas operacionais | DB |
| C-ID-01 | User.email unique | DB |
| C-MEM-01 | (org, user) membership ativa única | DB |
| C-MEM-02 | Org tem ≥1 owner ativo | DOM (+ job check) |
| C-INV-01 | Invite token unique; single use | DB |
| C-CUS-01 | (org, document) unique where not null | DB |
| C-VAR-01 | (org, sku) unique where not null | DB |
| C-VAR-02 | (product_id, combination_hash) unique | DB |
| C-VAR-03 | Product tem ≥1 variant | DOM |
| C-UOM-01 | Quantity respeita precision da unit | DOM |
| C-MONEY-01 | currency válida; amount scale coerente | BOTH |
| C-SAL-01 | sale_number unique per org | DB |
| C-SAL-02 | Transições de status só pelas permitidas | DOM |
| C-SAL-03 | Confirmada imutável (itens/totais) | DOM |
| C-SAL-04 | Confirm idempotency_key unique per org | DB |
| C-SAL-05 | total = f(itens, descontos) | DOM |
| C-DISC-01 | desconto ≤ max_absolute | DOM |
| C-DISC-02 | authorize permission se > threshold | DOM |
| C-STK-01 | Movement append-only | DOM (+ privs DB) |
| C-STK-02 | Movement tem source_type+source_id | DB |
| C-STK-03 | Exit grava unit_cost_applied | DOM |
| C-RES-01 | consumed+released ≤ reserved | BOTH |
| C-RES-02 | Uma reservation active por Sale (rec.) | DB/DOM |
| C-RES-03 | Não reservar se !tracks_inventory | DOM |
| C-REC-01 | Σ parcels = receivable amount | BOTH |
| C-PAY-01 | Payment idempotency unique | DB |
| C-PAY-02 | Allocation ≤ open balances | DOM |
| C-PAY-03 | Status payment não booleano na Sale | DOM |
| C-OUT-01 | Outbox insert same TX as aggregate | DOM |
| C-INS-01 | Unique active fingerprint per org | DB |
| C-IMP-01 | Import idempotency unique | DB |
| C-AUDIT-01 | Audit append-only | DB privs |

Regras críticas de dinheiro/estoque/tenant → **BOTH** (defesa em profundidade).
