---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: validation / CatalogPhase3BValidation
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Catalog Phase 3B — Persistence Hardening Validation

**Date:** 2026-07-25  
**Scope:** `apps/web/src/modules/catalog/infrastructure/supabase/**`  
**Secrets:** none recorded in this document.

## Verdict

**PHASE 3B HARDENING — APPROVED FOR CATALOG UI**

## Risks found (pre-hardening)

1. Public `#/modules/catalog` barrel re-exported SQL repositories / `postgres` graph.  
2. Direct SQL used owner role → **RLS bypassed** (FORCE RLS not enabled).  
3. SQL deletes/updates often filtered by id only (no `organization_id`).  
4. Factory trusted `actorUserId` without JWT/membership proof.  
5. Brand/category upsert could collide on global PK across tenants.  
6. Mappers invented defaults (`draft`, `0`, coerce currency) on bad rows.  
7. No automated client-bundle inspection.

## Vulnerabilities corrected

| Issue | Fix |
|---|---|
| Client import surface | Removed SQL repos from public barrel; `index.server.ts` + `server-only` |
| Untrusted tenant | Async factory: JWT `getUser()` + active membership |
| Org param spoofing | `assertEntityOrganization` on every port call / save |
| SQL cross-tenant mutate | Explicit `organization_id` on all SQL read/write/delete |
| Upsert tenant transfer | Brand/Category insert-or-update scoped by org |
| Error leakage | `redactSensitive` + opaque application errors |
| Inferred field opacity | Documented + round-trip tests |
| Bundle risk | `client-bundle-safety.test.ts` |

## Authorization model (final)

```
createServerFn / loader
  → resolve session JWT client
  → resolveCatalogDatabaseUrlFromEnv()  // SUPABASE_DB_URL | DATABASE_URL
  → createSupabaseCatalogRepos({ client, actorUserId, organizationId, databaseUrl })
       1) assertSafeDatabaseUrl
       2) auth.getUser() === actorUserId
       3) membership(org, user, active)
  → repository ops always pinned to options.organizationId
```

Service role is **not** used for repository operations (tests seed with admin, repos use member JWT).

## SQL direct behavior

| Question | Answer |
|---|---|
| PG role | Owner (`postgres` locally) |
| RLS active on connection? | Policies exist; **owner bypasses** (not FORCE) |
| `auth.uid()` | NULL |
| Tenant definition | Verified `options.organizationId` + SQL predicates |
| Pool reuse | Transactions + `SET LOCAL`; concurrent test proves no GUC leak |

## Multi-tenant evidence

Suite: `rls-isolation.integration.test.ts`

- Org A / Org B users  
- Cross-id get → null / `organization_mismatch`  
- Search cannot request foreign org  
- Anonymous / non-member factory → `CatalogPermissionError`  
- Actor mismatch → denied  
- SQL without filter can see foreign row (documents bypass)  
- SQL **with** org filter cannot update foreign row  

## Reconstitution

`mapProductAggregate` = authorized structural reconstitution (not create factory).  
Rejects: null lifecycle, cross-tenant children, multiple defaults, bad currency/numeric.

## Inferred fields

- `topology` ← axes count (deterministic)  
- `defaultUnitOfMeasureId` ← default/first variant UOM  
Round-trip covered in `persistence.integration.test.ts`.

## Transactions

`transactions.integration.test.ts`: mid-flight rollback, constraint atomicity, concurrent SET LOCAL isolation, pool reuse after rollback.

## Bundle inspection

`client-bundle-safety.test.ts` after `npm run build`:

- no `postgres` import  
- no `postgresql://…` secrets  
- no `createSupabaseCatalogRepos` / `getCatalogSql` / `withCatalogTransaction`  
- no service-role assignments  

## Contract parity

`repository-contract.integration.test.ts` runs the same brand/product flows against InMemory and Supabase.

**Intentional differences:** Supabase requires real UOM FK + auth; InMemory accepts any UOM id; Supabase search is SQL-backed (`CatalogSearchPort`) while Application search still scans products in-memory.

## Gates

| Gate | Result |
|---|---|
| `npx supabase start` | OK (already running) |
| `npx supabase db reset` | OK |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm test` | OK — 246 passed |
| `npm run build` | OK |
| bundle inspection (`client-bundle-safety.test.ts` post-build) | OK |

## Remaining limitations

1. Direct SQL remains a privileged path — must stay server-only forever.  
2. Without `FORCE ROW LEVEL SECURITY`, any future leak of `databaseUrl` is critical (mitigated by env + bundle checks).  
3. Application search use cases still use product list scan (domain `CatalogSearchPort` adapter is ready for UI wiring on server).  
4. No reconstitution API inside Domain Layer (documented; structural mappers + invariant rejects only).

## Domain / Application changes

None (behavior-preserving). Hardening confined to infrastructure, tests, env example, docs, vitest alias for `server-only`.
