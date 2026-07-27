---
Status: Archived
Owner: Module Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Archive
Scope: modules / CustomersInconsistencies
Supersedes: None
Superseded-By: README.md
Related-Modules: All
---

# Customers — Divergências resolvidas nesta sprint

| Tópico | Docs | Decisão |
|--------|------|--------|
| Nome do campo | `legal_name` vs `name` vs Attributes | Coluna **`name`** (razão/nome); `trade_name` opcional |
| Tipo | `type` vs `person_type` | **`person_type`**: `PF` \| `PJ` |
| Contatos | tabelas `customer_contact` / `customer_address` | **MVP:** `email`, `phone`, `city` na própria `customer`; tabelas filhas = sprint futura |
| Permissões | `view`/`update`/`deactivate` | Código: **`customers.read|create|edit|write`**; arquivar exige `edit` |
| Soft delete | `deleted_at` vs archive | **Arquivar:** `status=inactive` + `archived_at`; sem hard delete |
| RLS + permissão | matriz “por permission” | **RLS:** membership ativa no tenant; **app:** `can()`; sem tabela de permissions no DB |
| lastPurchaseAt | lista de telas | **Adiado** (depende de Sales) |
