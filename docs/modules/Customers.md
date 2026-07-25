# Módulo Customers

Bounded context de referência do Rescript. Padrão para Products, Inventory, Sales e Finance.

## Propósito

Cadastro comercial de quem compra da organização (**Customer** no domínio; **Cliente** na UI pt-BR).

## Arquitetura

```
UI (routes/clientes)
  → application use cases (can + validation)
    → CustomerRepository
      → SupabaseCustomerRepository
        → PostgreSQL + RLS
```

Componentes React **não** importam o SDK Supabase.

## Entidade (`customer`)

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| id, organization_id | sim | tenant; org vem do contexto ativo, nunca do formulário |
| name | sim | 1–200 chars |
| person_type | sim | `PF` \| `PJ` |
| trade_name | não | ≤200; típico PJ |
| document | não | dígitos normalizados; único por org quando preenchido; CPF/CNPJ com checksum |
| email | não | ≤254 |
| phone | não | ≤40 |
| city | não | ≤120 |
| notes | não | ≤2000 |
| status | sim | `active` \| `inactive` |
| archived_at / archived_by | com archive | soft archive |
| created_*/updated_* | sim | auditoria de linha |

Contatos/endereços em tabelas próprias = futuro.

## Invariantes

1. Todo customer pertence a exatamente uma organização.
2. Documento, quando informado, é único por organização.
3. Sem hard delete — arquivar (`inactive` + `archived_at`).
4. Cliente arquivado não é editável até restaurar.
5. Edição não reescreve snapshots de vendas futuras (Sales).

## Status e arquivamento

| Ação | Efeito |
|------|--------|
| Criar | `status=active`, `archived_at=null` |
| Arquivar | `status=inactive`, `archived_at`/`archived_by` preenchidos |
| Restaurar | volta a `active`, limpa archive |
| DELETE SQL | **negado** (sem policy) |

## Permissões

| Chave | Uso |
|-------|-----|
| `customers.read` | listar, buscar, detalhe |
| `customers.create` | criar (`write` implica) |
| `customers.edit` | editar, arquivar, restaurar (`write` implica) |
| `customers.write` | atalho owner/admin/manager |

UI: `can()`, `FeatureGate`, `ForbiddenState`.  
Casos de uso revalidam `can()` no servidor de aplicação.

## Casos de uso

- `createCustomer` — `customers.create` \| `write`
- `updateCustomer` — `customers.edit` \| `write` (bloqueia arquivado)
- `archiveCustomer` / `restoreCustomer` — `customers.edit` \| `write`
- `getCustomer` / `listCustomers` (`searchCustomers`) — `customers.read`

## Listagem (servidor)

| Concern | Comportamento |
|---------|---------------|
| Busca `q` | `name`, `trade_name`, `email`, `city`; documento se ≥3 dígitos |
| Filtro | `active` (padrão) \| `inactive` \| `all` |
| Ordenação | `name_asc` (padrão) \| `updated_desc` |
| Paginação | cursor `encodeURIComponent(value)::id`; page size 20 (máx. 50) |
| Isolamento | sempre `organization_id` da org ativa |

Não carrega o tenant inteiro no browser para filtrar.

## Query keys

```
['rescript','customers', orgId, 'list', filters]
['rescript','customers', orgId, 'detail', id]
```

Isoladas por organização; invalidadas em switch de org e mutations.

## RLS (banco)

| Policy | Regra |
|--------|-------|
| SELECT | `is_org_member(organization_id)` |
| INSERT | membro + `created_by`/`updated_by` = `auth.uid()` |
| UPDATE | membro + `updated_by` = `auth.uid()` |
| DELETE | inexistente |

**Nível de segurança:**

- **Banco:** isolamento por membership ativa no tenant (não a matriz `customers.*`).
- **Aplicação:** autorização granular `customers.*` via `can()`.
- Membership inativa falha `is_org_member` → sem acesso via SDK/API.

## UI

| Rota | Conteúdo |
|------|----------|
| `/clientes` | busca, filtro status, tabela, paginação, dialog criar |
| `/clientes/:id` | detalhe, editar, arquivar/restaurar, banner arquivado |

Estados: loading, vazio, erro, forbidden, não encontrado (mesmo UX sem revelar outro tenant).

## Decisões

Ver `CustomersInconsistencies.md` (`name`, `person_type`, archive, permissões, contatos flat).

## Migration

`supabase/migrations/20260725020000_customers.sql`

**Aplicação:** o projeto Supabase *Rescript* existe, mas **não está linkado** neste workspace. Não aplicar sem `supabase link`.

```bash
npx supabase link --project-ref kdtbvgeymlizadsmigxj
npx supabase db push
npm run db:types
```

## Limitações

- Sem histórico de vendas / `lastPurchaseAt` (Sales)
- Sem `customer_contact` / `customer_address`
- Audit port noop (tabela futura)
- ⌘K lista entidades reais de customer ainda não (vai à listagem)
- Testes RLS live pendentes até migration aplicada
- Produtos no ⌘K ainda usam mock (fora deste módulo)

## Próximos passos

1. Link + `db push` da migration Customers
2. Smoke manual criar → editar → arquivar → trocar org
3. Products como próximo bounded context (após aprovação)
