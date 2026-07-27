---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 26-PermissionChangedDuringOp
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 26 — Permissão Removida Durante Operação

## Cenário

Usuário tem `sales.confirm`; inicia UI; permissão removida; confirmação chega depois.

### Objetivo
Recheck de permissão no commit da operação crítica.

### Atores
Admin; Vendedor

### Estado inicial
Membership ativa; role com sales.confirm; Sale Pedido.

### Pré-condições
Admin pode alterar RolePermission / membership role.

### Passos executados

#### 1. Revoga sales.confirm
1. **Comando:** UpdateRolePermissions (remove sales.confirm)
6. Effective permissions mudam; Audit
11. Cache de permissões deve invalidar (se houver)

#### 2. ConfirmSale tardio
1. **Comando:** ConfirmSale
2. **Autorização:** reavaliar permissions **dentro da TX** → negado
5–6. Nenhum movimento/recebível
13. 403 permission_denied
14. Admin restaura permissão e retry

### Estado final esperado
Sale não confirmada; estoque intacto.

### Invariantes verificadas
Autorização no ponto crítico; atomicidade.

### Inconsistências encontradas
- Cache de permissões sem TTL/invalidação pode causar bypass temporário — risco se implementado mal.

### Ajustes recomendados
Proibir cache positivo longo; sempre ler RolePermission em ops FnOnly ou versionar membership.

### Classificação
**aprovado**
