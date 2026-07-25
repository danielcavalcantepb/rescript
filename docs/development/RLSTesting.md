# RLS Testing

## Prerequisites

- Migration applied on a dedicated Supabase project
- Two Auth users (A, B) created in Dashboard (no passwords in repo)
- User A creates an organization via app onboarding

## Manual / SQL checklist

Using the Supabase SQL editor **as each user** (or `set request.jwt.claim.sub`):

1. **A sees own org** — `select * from organization` returns A's org  
2. **B sees nothing** of A's org  
3. **B cannot insert** into `organization` directly  
4. **B cannot insert** into `membership` for A's org  
5. **A lists own membership** with `role = owner`  
6. **Suspended org** — after `update organization set status = 'suspended'`, app refuses to select it as active  
7. **create_organization** as authenticated user succeeds once per click (advisory lock)  
8. Publishable key only in client — never `service_role`

## Automated

Unit tests cover role→permission mapping, active-org preference, query-key isolation, and provider wiring.  
Full RLS suite requires a live project (CI secret) — scripts can be added when the remote is linked.

## Negative cases to retest after every tenancy change

- Access foreign `organization_id` via SDK  
- Membership inactive / removed  
- Forged active-org id in localStorage (must fall back or clear)
