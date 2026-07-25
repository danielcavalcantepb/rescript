# Sprint 0 — Entrega (Fase 1 bootstrap)

## Como rodar

```bash
npm install
npm run dev
```

Abrir http://localhost:3000 → **Entrar** (auth mock via `localStorage`).

## Escopo entregue

- Monorepo `apps/web` + `packages/{domain,auth,permissions,database}`
- Design System Quiet Instrument (tokens + componentes)
- Layout: Sidebar, Topbar, Breadcrumb, Command Palette (⌘K)
- Telas navegáveis com mocks: Login, Onboarding, Central, Clientes, Produtos, Vendas
- 404, erro, loading global, empty states
- Permissões / org / usuário mock
- Dark mode preparado (classe `.dark` — não ativado)

## Fora de escopo (intencional)

Supabase, migrations, RLS, Edge Functions, APIs, regras de negócio reais, estoque/financeiro completos.

## Estrutura

```
apps/web/src/
  components/          # layout + DS + UI
  integrations/        # TanStack Query
  lib/                 # utils, format
  mocks/               # dados coerentes
  providers/           # sessão mock
  routes/              # login, onboarding, _app/*
packages/
  auth/ domain/ permissions/ database/
```

## Componentes

AppLayout, Sidebar, Topbar, CommandPalette, AppBreadcrumb, PageHeader, SectionHeader, MetricCard, InsightCard, StatusBadge, StatChip, Timeline, EmptyState, SearchBar, ConfirmDialog, EntityTable, DataCard, EntityAvatar, GlobalLoading + UI (Button, Input, Badge, Dialog).

## Pendências — Sprint 1

1. Conectar Supabase (auth + schema mínimo) sem quebrar UI mock
2. Substituir mocks de Clientes/Produtos por queries reais (read-only primeiro)
3. Implementar formulários Create/Edit com validação de domínio
4. Vendas: rascunho → confirmação (máquina de estados documentada)
5. RLS por organização + membership
6. Inventário ledger (local padrão oculto) conforme ADRs / Founder Decisions
7. Insights reais da Central (pipeline Registrar → Interpretar)
8. Testes unitários de domínio + smoke E2E das rotas principais
