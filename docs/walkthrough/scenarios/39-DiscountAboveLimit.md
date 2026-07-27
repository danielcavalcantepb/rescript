---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 39-DiscountAboveLimit
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 39 — Desconto Acima do Limite

## Cenário

Vendedor excede limite sem autorização; solicita autorização; aprovador decide; auto-autorização negada.

### Objetivo
FD-05; DiscountModel; permissions sales.discount / sales.discount.authorize.

### Atores
Vendedor; Gerente autorizador

### Estado inicial
**HYPOTHESIS** max_without_auth=5%; vendedor tenta 15%; allow_self_authorization=false.

### Pré-condições
Sale editável (Rascunho/Orçamento/Pedido).

### Passos executados

#### 1. ApplyDiscount 15%
3. > max_without_auth → não aplica; cria DiscountAuthorization pending **ou** bloqueia até auth
5. DiscountAuthorization(requested_by=V, status=pending)
#### 2. V tenta self-authorize
2. authorize com mesmo user → **negado** (allow_self_authorization=false)
#### 3. Gerente aprova
2. sales.discount.authorize; authorized_by≠requested_by
6. Auth approved; SaleDiscount aplicado; Audit
8–10. DiscountAuthorized event

### Estado final esperado
Desconto só após auth válida; trilha completa; sem auto-aprovação.

### Invariantes verificadas
FD-05; não por nome de papel; imutável pós-Confirmada.

### Inconsistências encontradas
- OQ-04 percentual default aberto.
- Fluxo pending vs hard-block na UI pouco prescrito.

### Ajustes recomendados
Default allow_self_authorization=false como seed; fechar OQ-04.

### Classificação
**aprovado com ressalvas**
