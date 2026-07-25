# Migrations

## Layout

```
supabase/
  config.toml
  migrations/
    20260725010000_organizations_memberships.sql
    20260725020000_customers.sql
```

## Rules

- All schema changes are versioned SQL — never panel-only as source of truth
- One concern per migration when practical
- Never put Auth users or secrets in migrations
- Seeds (if any) stay separate from schema
- Never edit migrations already applied remotely — add a corrective migration

## Commands

```bash
npx supabase link --project-ref kdtbvgeymlizadsmigxj --yes
npx supabase migration list
npx supabase db push          # apply to linked remote
npm run db:types              # → packages/database/src/generated.ts
```

See [DatabaseLive.md](./DatabaseLive.md) for the live sync record.

## Migration contents

### Organizations / Memberships

- `organization`, `membership`
- indexes + uniqueness (one owner; one non-removed membership per user/org)
- RLS + `is_org_member` / `is_org_owner`
- `create_organization(text)` RPC

### Customers

- `customer` (+ archive fields, document unique per org)
- RLS SELECT/INSERT/UPDATE for members; no DELETE
