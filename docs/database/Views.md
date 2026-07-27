---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / Views
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Views Lógicas (não materializadas)

> Projeções de leitura. **Não** fonte de verdade.

| View lógica | Fonte | Uso | Expor client? |
|---|---|---|---|
| v_inventory_available | Balance | listas estoque | sim (RLS) |
| v_receivables_aging | Installment+Pay | FinanceOverview | sim |
| v_sale_list | Sale+customer snap | SalesList | sim |
| v_open_orders | Sale status Pedido | Central | sim |
| v_member_effective_permissions | RolePermission | authz debug | não (backend) |

**Regra:** totais financeiros/estoque críticos preferem cálculo em TX ou materialização controlada — view não substitui ConfirmSale.
