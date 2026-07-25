# Migrations

## Layout

```
supabase/
  config.toml
  migrations/
    20260725010000_organizations_memberships.sql
```

## Rules

- All schema changes are versioned SQL — never panel-only as source of truth
- One concern per migration when practical
- Never put Auth users or secrets in migrations
- Seeds (if any) stay separate from schema

## Commands

```bash
npx supabase migration list
npx supabase db push          # apply to linked remote
npx supabase gen types typescript --linked > packages/database/src/generated.ts
```

Until linked, `packages/database/src/types.ts` is the hand-maintained contract.

## First migration contents

- `organization`, `membership`
- indexes + uniqueness (one owner; one non-removed membership per user/org)
- RLS + `is_org_member` / `is_org_owner`
- `create_organization(text)` RPC
