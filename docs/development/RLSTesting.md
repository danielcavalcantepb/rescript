---
Status: Active
Owner: Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Runbook
Scope: development / RLSTesting
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# RLS Testing

## Prerequisites

- Migration applied on the linked Rescript project (see [DatabaseLive.md](./DatabaseLive.md))
- Two Auth users (A, B) — Dashboard or ephemeral seed (no passwords in repo)
- User A creates an organization via app onboarding / RPC

## Manual / SQL checklist

Using the Supabase SQL editor **as each user** (or SDK with user JWT):

1. **A sees own org** — `select * from organization` returns A's org  
2. **B sees nothing** of A's org  
3. **B cannot insert** into `organization` directly  
4. **B cannot insert** into `membership` for A's org  
5. **A lists own membership** with `role = owner`  
6. **Suspended org** — after `update organization set status = 'suspended'`, app refuses to select it as active  
7. **create_organization** as authenticated user succeeds once per click (advisory lock)  
8. **Customer isolation** — A cannot SELECT/INSERT/UPDATE customers of B  
9. **Customer DELETE** denied (no policy)  
10. Publishable key only in client — never `service_role`

## Automated

Unit tests cover role→permission mapping, active-org preference, query-key isolation, and provider wiring.  
Live RLS suite (A/B via SDK) executed in Database Live — **11/11 PASS** (see DatabaseLive.md).

## Negative cases to retest after every tenancy change

- Access foreign `organization_id` via SDK  
- Membership inactive / removed  
- Forged active-org id in localStorage (must fall back or clear)
