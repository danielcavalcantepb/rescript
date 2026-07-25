# Estratégia RLS (sem políticas SQL)

> Complementa `RLSMatrix.md`. Nunca confiar só em `organization_id` do client.

---

## 1. Pilares

1. **Membership ativa** na org do row  
2. **organization_id** em todo dado operacional  
3. **Permissão** (RBAC) na app + opcionalmente claims  
4. **Entitlement / suspensão** bloqueiam escrita  
5. **Service role** só backend/jobs com escopo estreito  
6. **FnOnly** para ops críticas (Confirm, Pay, Adjust…) — client não UPDATE ledger

---

## 2. Papéis de acesso

| Ator | SELECT | INSERT/UPDATE | Notas |
|---|---|---|---|
| Member org | rows da sua org + perm | conforme perm | |
| Owner | + settings/audit | amplo | |
| Support grant | scoped read/(write) | audit obrigatório | TTL |
| Platform admin | meta plataforma | não dados tenant sem grant | |
| Service role / jobs | bypass RLS controlado | processa outbox/import **por org do aggregate** | |
| Edge functions | mesmo que service com JWT user ou service | nunca misturar tenants | |
| Anon | nada operacional | auth only | |

---

## 3. Storage / uploads

Path prefix `org_id/…`; metadata FileObject com organization_id; signed URL só após authz File.

## 4. Views

Views expostas ao client herdam RLS das bases **ou** security barrier; views de platform não expõem cross-tenant.

## 5. Proibido

- Policy só por “id conhecido” sem org  
- Client setar organization_id arbitrário  
- Job que aceita org_id do payload sem validar ownership do aggregate  

## 6. Matriz por tabela

Ver `RLSMatrix.md` (acesso direto / read-only / FnOnly / backend / platform).
