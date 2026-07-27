---
Status: Archived
Owner: Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Archive
Scope: development / AuthSetup
Supersedes: None
Superseded-By: README.md
Related-Modules: All
---

# Auth Setup — Supabase (etapa identidade)

Fundação de autenticação do Rescript. **Auth ≠ Organization ≠ Membership.**

---

## Pré-requisitos

- Projeto Supabase criado
- Variáveis em `apps/web/.env.local`:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

- Nunca versionar `.env.local`
- Nunca usar `service_role` / Secret Key no frontend

---

## Criar usuário de teste

Como não há cadastro público nesta etapa:

1. Abra o [Dashboard Supabase](https://supabase.com/dashboard) → projeto Rescript  
2. **Authentication → Users → Add user**  
3. Escolha **Create user**  
4. Informe e-mail e senha do usuário de teste  
5. Marque **Auto Confirm User** (evita bloqueio por e-mail não confirmado em dev)  
6. Salve  

Não documente senhas reais neste arquivo.

---

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — rotas protegidas redirecionam para `/login`.

---

## Fluxo de login

1. Usuário acessa rota protegida sem sessão → `/login?redirect=…`  
2. `signInWithPassword` via cliente browser (`@supabase/ssr` cookies)  
3. Sessão validada no servidor com `getClaims()`  
4. Redirect para destino seguro ou Central  

## Fluxo de logout

1. **Sair** na Topbar  
2. `signOut` + limpeza de estado auth / cache Query  
3. Redirect para `/login`  

---

## Rotas

| Tipo | Rotas |
|---|---|
| Pública | `/login` |
| Protegidas | `/`, `/clientes`, `/produtos`, `/vendas`, detalhes, onboarding |

Proteção centralizada em `routes/_app.tsx` via `fetchAuthSession` (server function).

---

## Limitações atuais

- Sem cadastro público  
- Sem recuperação de senha  
- Sem Organization / Membership reais (org **Mr Wick** ainda mockada)  
- Sem RLS / profiles / permissões reais  
- Onboarding continua com flag mock local  

---

## Segurança

- Publishable key ≠ segredo; ainda assim não versionar `.env.local`  
- Mensagens de erro sem enumeração de e-mail  
- Redirect pós-login sanitizado (somente path relativo)  
- Tokens não são logados  

---

## Próximos passos (após aprovação)

1. Organization + Membership  
2. Resolução de org ativa no servidor  
3. Profiles / espelho de User  
4. Permissões reais + RLS  
