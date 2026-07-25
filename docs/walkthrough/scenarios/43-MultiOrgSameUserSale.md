# Cenário 43 — Mesmo Usuário em Duas Orgs (exploratório)

## Cenário

User membro de Org A e B; contexto de org ativa; venda não cruza.

### Objetivo
Active organization context server-side.

### Atores
Vendedor multi-org

### Estado inicial
Membership A+B active; customer só em A.

### Passos executados

#### 1. Switch active org B
6. session/context org=B
#### 2. Tenta usar customer de A em Sale B
3. Falha tenant consistency
#### 3. Cria Sale em A com header org A
OK

### Estado final esperado
Isolamento por contexto; sem vazamento.

### Invariantes verificadas
C-TENANT-01; membership.

### Inconsistências encontradas
Como “org ativa” é persistida (cookie/claim) — detalhe de Identity a fixar na implementação.

### Ajustes recomendados
Active org em claim curto + revalidação membership a cada request.

### Classificação
**aprovado**
