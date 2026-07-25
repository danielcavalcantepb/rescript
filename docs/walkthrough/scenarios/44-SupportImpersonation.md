# Cenário 44 — Impersonação / Suporte (exploratório)

## Cenário

SupportAccessGrant temporário; ações auditadas; escopo mínimo.

### Objetivo
Acesso suporte controlado sem misturar com membership normal.

### Atores
Platform support; Owner (aprova grant)

### Estado inicial
Org A; ticket; grant pending.

### Passos executados

#### 1. Approve SupportAccessGrant (TTL, scopes read|limited_write)
5. Grant active; Audit
#### 2. Support lê Sales
2. Auth via grant≠membership; correlation support_session_id em Audit
#### 3. Expiração
6. Grant expired; acesso negado
13. Tentativa write fora do scope → deny

### Estado final esperado
Trilha completa; sem grant eterno.

### Invariantes verificadas
Audit de suporte; tenant.

### Inconsistências encontradas
Scopes exatos de suporte pouco enumerados.

### Ajustes recomendados
Default read-only; write só com justificativa e scopes listados.

### Classificação
**aprovado com ressalvas**
