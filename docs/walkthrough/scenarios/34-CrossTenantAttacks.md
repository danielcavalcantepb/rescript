# Cenário 34 — Dados Cruzados entre Organizações

## Cenário

Tentativas de IDOR, troca de organization_id, cross-link, arquivo alheio, job no tenant errado.

### Objetivo
Defesa em profundidade: app + RLS + constraints + FnOnly.

### Atores
Atacante autenticado na Org A; dados da Org B

### Estado inicial
User member só de A; conhece UUID de Customer B / Sale B / File B.

### Pré-condições
RLS futuro alinhado a RLSMatrix; organization_id nunca trust do client.

### Passos executados

#### 1. GET /customers/{id_B}
2. Membership A; RLS filtra org B → 404/403
#### 2. PATCH sale set organization_id=B
3. Campo imutável; rejeitado no domínio; constraint
#### 3. Create Sale A com customer_id de B
3. Validação: customer.organization_id == sale.organization_id → falha (C-TENANT-01)
#### 4. Signed URL file B
3. Path inclui org; authz file.organization_id
#### 5. Job com org header forjado
3. Worker usa org do aggregate, não do payload client

### Estado final esperado
Zero vazamento; zero vínculo cruzado.

### Invariantes verificadas
Tenant ownership; RLSMatrix; FnOnly em críticos.

### Inconsistências encontradas
Nenhuma de modelo; risco só se implementação relaxar checks.

### Ajustes recomendados
Testes automatizados de tenancy obrigatórios antes de prod.

### Classificação
**aprovado**
