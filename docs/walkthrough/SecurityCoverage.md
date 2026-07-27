---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / SecurityCoverage
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cobertura de Segurança

| Tema | Cenários | Defesa esperada | Gap |
|---|---|---|---|
| Isolamento multi-tenant | 02,34,43,54 | membership + RLS + C-TENANT-01 | testes obrigatórios na implementação |
| IDOR por UUID | 34 | 404 cross-org | — |
| organization_id forjado | 34 | imutável / server-set | — |
| Cross-link entidades | 34 | org consistency checks | — |
| Arquivos | 54 | path+authz | signed URL TTL |
| Authz no commit | 25,26 | recheck membership+permission | cache permissões |
| Suporte | 44 | SupportAccessGrant + audit | scopes |
| Suspensão / entitlement | 27,55 | override escrita | matriz capacidades |
| Enumeração sequencial | 02,34 | UUID PK; números só UX | — |
| Idempotency misuse | 49 | request_hash | WT-14 |
| Secrets integração | 30 | credential reference | OQ-07 |
| Self-auth desconto | 39 | allow_self_authorization=false | seed |
| Export pós-remoção | 52 | deny ex-member | — |

**Veredito:** modelo lógico **adequado** para RLSMatrix; nenhum vazamento estrutural encontrado; risco principal é implementação frouxa de cache/authz.
