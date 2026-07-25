# Database Live

Sprint de sincronização local ↔ Supabase. **Sem features novas.**

## Projeto

| Campo | Valor |
|-------|--------|
| Nome | Rescript |
| Project ref | `kdtbvgeymlizadsmigxj` |
| Região | `sa-east-1` |
| URL app | `https://kdtbvgeymlizadsmigxj.supabase.co` |

Link CLI:

```bash
npx supabase link --project-ref kdtbvgeymlizadsmigxj --yes
```

## Migrations aplicadas (ordem)

1. `20260725010000_organizations_memberships.sql` — organization, membership, RLS helpers, `create_organization`
2. `20260725020000_customers.sql` — customer + RLS

```bash
npx supabase db push --yes
npx supabase migration list
```

Ambas locais e remotas alinhadas após o push.

## Schema remoto verificado

Tabelas: `organization`, `membership`, `customer` (RLS **on**).

Funções: `create_organization`, `is_org_member`, `is_org_owner`, `set_updated_at`.

Policies relevantes:

| Tabela | Policies |
|--------|----------|
| organization | SELECT member, UPDATE owner |
| membership | SELECT same org |
| customer | SELECT / INSERT / UPDATE member; **sem DELETE** |

Org/membership INSERT direto negado — bootstrap via RPC `create_organization`.

## Tipos gerados

```bash
npm run db:types
# → packages/database/src/generated.ts
```

- `generated.ts` — saída oficial do CLI (não editar à mão)
- `types.ts` — aliases de domínio (`CustomerRow`, status unions dos CHECKs)
- `index.ts` — reexporta o pacote `@rescript/database`

## RLS (validação live)

Usuários A/B efêmeros + orgs isoladas. Suite via SDK (publishable key + JWT):

| Caso | Resultado |
|------|-----------|
| A vê só a própria org | PASS |
| B vê só a própria org | PASS |
| A vê só customers da org A | PASS |
| B vê só customers da org B | PASS |
| A não lê customer de B por id | PASS |
| A não insere em org B | PASS (42501) |
| A não atualiza customer de B | PASS |
| A não vê memberships de B | PASS |
| `is_org_member` A/B | PASS |
| DELETE customer negado | PASS |

**11/11 PASS**

## Smoke tests

### API (SDK)

Login → create/edit/search customer → archive → restore → list orgs (≥2) → logout/login: **8/8 PASS**

### UI (`npm run dev` → localhost:3000)

- Login → Central
- Clientes: listagem, criar (dialog), detalhe
- Arquivar + restaurar
- Troca de organização (A → A2): lista vazia sem dados do tenant anterior
- Logout → login → reload: sessão e lista OK

Correção pós-sprint: `PermissionProvider` distingue `loading` / `ready` / `error`; UI usa `RequirePermission` + `PageLoading` — **não** mostra “Sem permissão” até grants resolvidos (session + org + membership).

Onboarding “primeira org” coberto via RPC `create_organization` (segunda org do usuário A). Fluxo UI de usuário sem membership não repetido nesta sprint (usuários de teste já tinham membership).

## Dados de teste (dev only)

Criados **apenas no projeto Rescript de desenvolvimento**, via SQL privilegiado da CLI (não versionado; sem senhas no repositório).

| Tipo | Identificação |
|------|----------------|
| Auth users | 2 usuários de fixture RLS (labels locais A/B) |
| Organizations | slugs `rls-smoke-org-a`, `rls-smoke-org-b`, mais org criada via RPC pelo usuário A |
| Memberships | owner ativo em cada org de fixture |
| Customers | customers de fixture por org + registros criados nos smokes |

**Permanecem no Auth/DB remoto** até limpeza manual.

### Limpeza segura (listar antes de apagar)

Não executar automaticamente em produção. No SQL Editor (ou `supabase db query --linked`), **inspecionar**:

```sql
select id, email, created_at
from auth.users
where email like 'rls-user-%@rescript.local';

select id, name, slug
from public.organization
where slug like 'rls-smoke-%' or slug like 'rls-org-a2-%';
```

Se a lista for a esperada, remover na ordem (customers → memberships → organizations → identities → users) filtrando pelos ids retornados. Não embutir senhas/tokens nos comandos.

## Comandos usados

```bash
npx supabase link --project-ref kdtbvgeymlizadsmigxj --yes
npx supabase migration list
npx supabase db push --yes
npm run db:types
npx supabase db query --linked "<sql>"
npm run typecheck && npm run lint && npm run test && npm run build
npm run dev
```

## Problemas e soluções

| Problema | Solução |
|----------|---------|
| Projeto não linkado | `supabase link --project-ref kdtbvgeymlizadsmigxj` |
| `db push` avisou Docker ausente | Aviso de cache local; migrations aplicadas no remoto |
| Tipos gerados com `string` vs unions CHECK | Aliases em `types.ts` + narrow nos mappers |
| 0 usuários Auth para RLS | Seed privilegiado efêmero A/B (não versionar senhas) |
| Redirect `>` do `db:types` no Windows | Script npm usa `>` (cmd); regenerar com CLI se o arquivo poluir |

## Segurança

- Client: apenas `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.local` (gitignored)
- Sem `service_role` no frontend
- Sem credenciais em migrations/Git
- Isolamento multi-tenant confirmado via RLS live

## Limitações

- Fixture RLS A/B permanece no projeto até limpeza manual (ver seção acima)
- `AuthSetup.md` ainda tem trechos históricos sobre mock de org (desatualizado vs runtime atual)
- `supabase/.temp/` é local (gitignore) — não versionar
- Próximo módulo (Products) só após aprovação
