---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / DerivedData
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Dados Derivados

| Dado | Origem / fórmula | Persistência | Recomputável | Risco |
|---|---|---|---|---|
| Sale.subtotal/total | Σ itens − descontos | sim após confirm | sim | baixo se freeze |
| qty_on_hand | Σ movements | materializado | sim | divergência → reconcile job |
| qty_reserved | Σ active reservation remaining | materializado | sim | idem |
| qty_available | on_hand − reserved | materializado/calc | sim | idem |
| avg_cost current | fórmula média | materializado | sim via cost ledger | alto se editado — proibido |
| installment.open_balance | amount − allocations | materializado | sim | médio |
| installment.overdue | due_date + balance | calc | sim | — |
| receivable.status | balances | materializado | sim | médio |
| Insight | rules + reads | sim (resultado) | sim | stale → expire |
| Dashboard totals | queries | cache opcional | sim | nunca FT |
| Usage counters | COUNT real preferível | opcional | sim | drift |

### Correção
Job de reconciliação: recomputa balances/avg from ledger; alerta se drift > 0.
