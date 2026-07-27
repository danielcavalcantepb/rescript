---
Status: Active
Owner: Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Runbook
Scope: development / InventoryRLSSmoke
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Inventory — RLS e smoke

## Pré-requisitos

- Migrations `…30000_products` e `…40000_inventory` aplicadas no projeto linkado
- Dois usuários Auth (A/B) com orgs distintas (fixtures Database Live ou manuais)
- App com publishable key (sem service_role)

## Checklist RLS (SQL editor / SDK JWT)

1. A SELECT `inventory_balance` / `inventory_movement` só da própria org  
2. B não vê linhas da org de A  
3. A não chama RPC com `product_id` da org B (`product_not_found`)  
4. Sem membership → RPC `not_org_member`  
5. `DELETE FROM inventory_movement` → negado (trigger / sem policy)  
6. `UPDATE inventory_movement` → `inventory_movement_immutable`  
7. Saída com qty > saldo → `insufficient_stock`  
8. Dois exits concorrentes sobre saldo 1 → um sucesso, um `insufficient_stock`  
9. Produto `inactive` → `product_archived`  
10. `compute_product_stock` = `inventory_balance.quantity` após operações

## Smoke UI

Login → org ativa → `/estoque` → entrada → saldo → saída → saldo → saída excessiva bloqueada → ajuste → `/estoque/movimentacoes` → trocar org (isolamento) → arquivar produto → bloquear movimento → reload (persistência).

## Automação nesta sprint

Cobertura automatizada = unitários (delta, use cases, permissões, helpers).  
Checklist live acima é validação operacional no projeto Supabase (mesmo padrão de `RLSTesting.md`).
