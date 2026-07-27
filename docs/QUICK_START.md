---
Status: Active
Owner: Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Runbook
Scope: Local developer setup and environment validation
Supersedes: Fragmented setup instructions as onboarding entry
Superseded-By: None
Related-Modules: Platform, Database, Authentication
---

# Quick Start

## Prerequisites

- Git
- Node.js 22 compatible runtime and npm
- Docker Desktop or compatible Docker engine for local Supabase
- Supabase CLI through `npx`

Do not use the shared remote development database unless the team explicitly grants access. Local Supabase is the default onboarding environment.

## Install

From the repository root:

```bash
npm install
```

## Start the local database

```bash
npx supabase start
npx supabase status
```

The repository configuration exposes the local API at `http://127.0.0.1:54321` and Studio at `http://127.0.0.1:54323`. `supabase start` applies migrations and the configured seed.

If the database already exists and migrations changed:

```bash
npx supabase db reset
```

`db reset` destroys local Supabase data. Never run it against a linked remote project.

## Configure the web application

Copy `apps/web/.env.example` to `apps/web/.env.local`. Populate the public values printed by `npx supabase status`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local publishable/anon key>
```

Server-only database variables are required only by flows that use direct transactional database access. Use local values from `supabase status`; never prefix secrets with `VITE_`, commit `.env.local`, or expose service-role credentials to browser code.

## Run

```bash
npm run dev
```

Open `http://localhost:3000`. Protected routes redirect to `/login`. Use the local Supabase Studio to create a confirmed development user when the seed does not provide one.

On Windows PowerShell systems that block `npm.ps1`, invoke `npm.cmd` and `npx.cmd` instead of changing the machine execution policy.

## Required quality gates

Run from the repository root:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

All four commands must pass before delivery. Database work also requires the module's migration/RLS/integration checks.

## Database workflow

- Add a new corrective migration; never edit an applied migration.
- Validate locally with `npx supabase db reset`.
- Regenerate database types with `npm run db:types` only against the intended project.
- Never edit `packages/database/src/generated.ts` manually.
- Linking or pushing to a remote project requires explicit team authorization.

See [Migrations](./development/Migrations.md) and [RLS Testing](./development/RLSTesting.md).

## Environment validation

The environment is ready when:

- `npx supabase status` reports local services healthy;
- the application opens at port 3000;
- login reaches a tenant-scoped route;
- switching Organization does not expose data from the previous tenant;
- typecheck, lint, tests, and build pass;
- no server-only credential is present in the browser bundle or `VITE_` variables.

## Common failures

| Symptom | Check |
|---|---|
| Supabase does not start | Docker is running and ports 54320–54329 are available |
| Login redirects repeatedly | `.env.local` URL/key match the running local project and the user is confirmed |
| No active Organization | Create one through onboarding/`create_organization`; do not insert membership directly |
| Database types disagree | Reset/apply migrations, then regenerate types against the same environment |
| Permission UI appears empty | Verify active membership and permission provider state |
| PowerShell blocks npm | Use `npm.cmd`/`npx.cmd` |

## Next reading

Return to the [Documentation Portal](./README.md), inspect [Module Status](./MODULE_STATUS.md), then read the relevant module references, migrations, and tests.
