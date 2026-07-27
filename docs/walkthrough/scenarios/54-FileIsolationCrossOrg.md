---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 54-FileIsolationCrossOrg
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 54 — Isolamento de Arquivos Cross-Org (exploratório)

## Cenário

URL/path de arquivo da Org B acessado por user da Org A.

### Objetivo
FileModel multi-tenant.

### Atores
User Org A

### Estado inicial
File B path bucket/org_B/...

### Passos executados

#### 1. Request signed URL with file_id B
2–3. Lookup File where id e organization_id=A → miss → 404
#### 2. Guess raw storage path
Storage policies + path prefix org_id; sem list público

### Estado final esperado
Sem leitura cross-tenant.

### Invariantes verificadas
Tenant em File; RLSMatrix files.

### Inconsistências encontradas
Nenhuma de modelo.

### Ajustes recomendados
Nunca URL permanente sem authz; TTL curto signed URL.

### Classificação
**aprovado**
