---
Status: Active
Owner: Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Runbook
Scope: development / UserDisplayName
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Identidade nominal do usuário

## Fonte oficial

Funções centralizadas em `@rescript/auth`:

- `resolveUserDisplayName(source)` — nome completo
- `resolveUserFirstName(source)` — primeiro nome (saudação)
- `buildAuthNameMetadata(fullName)` — payload para `auth.updateUser` / convites
- `hasResolvedUserName(source)` — detecta ausência de nome humano

**Nunca** derivar nome a partir do e-mail ou do trecho antes do `@`.

### Prioridade

1. `profileFullName` (tabela pública, quando existir)
2. `user_metadata.full_name`
3. `user_metadata.display_name`
4. `user_metadata.name`
5. `user_metadata.first_name`
6. Fallback neutro: `Usuário`

Persistência atual: `supabase.auth.updateUser({ data: { full_name, display_name } })`  
via `authService.updateProfileName` — **sem** `service_role`, **sem** `app_metadata`.

## UI

| Superfície | Campo |
|------------|--------|
| Saudação (Home) | `authUser.firstName` |
| Menu de perfil / header | `authUser.displayName` |
| E-mail | secundário apenas |
| Avatar | `initials(displayName)` → “Daniel Cavalcante” = `DC` |

Se o usuário autenticado não tiver nome humano, `ProfileNameGate` bloqueia a shell até salvar o nome.

Onboarding exige **nome completo** + organização e grava metadata antes de criar a org.

## Convites (futuro)

Quando `members.invite` for implementado, usar `buildAuthNameMetadata` quando o nome estiver disponível.  
**Não** inventar nome a partir do e-mail do convidado.

## Evolução recomendada: `public.profile`

Hoje **não existe** tabela pública de perfil. Não foi criada migration nesta correção.

Evolução sugerida:

```sql
create table public.profile (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  preferred_name text,
  avatar_url text,
  job_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

- `id` = `auth.users.id`
- RLS: usuário lê/atualiza o próprio perfil; membros da org podem ler `full_name` conforme política futura
- `resolveUserDisplayName` já aceita `profileFullName` como prioridade 1
