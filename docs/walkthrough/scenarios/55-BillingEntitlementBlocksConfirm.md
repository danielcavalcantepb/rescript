# Cenário 55 — Entitlement Bloqueia Confirmação (exploratório)

## Cenário

Plano/entitlement impede confirmar venda (ex.: trial expirado, módulo sales off, limite).

### Objetivo
Separar RBAC de entitlement.

### Atores
Vendedor com permissão; Billing

### Estado inicial
Membership+RBAC OK; entitlement `sales.confirm` feature false ou subscription inactive.

### Passos executados

#### 1. ConfirmSale
2. RBAC pass; entitlement check fail
13. payment_required / entitlement_denied
5–6. Sem efeitos de estoque/financeiro

### Estado final esperado
Núcleo intacto; UX direciona a billing.

### Invariantes verificadas
Entitlement ≠ permission; suspensão (27) relacionada.

### Inconsistências encontradas
Quais entitlements exatos bloqueiam Confirm vs só create — catalogar.

### Ajustes recomendados
Matriz feature→ops críticas em EntitlementModel.

### Classificação
**aprovado com ressalvas**
