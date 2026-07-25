# Módulo Products

Catálogo comercial da organização. Espelha a arquitetura do bounded context Customers.

**Fora de escopo:** estoque, movimentações, preço, variantes, compras, vendas e financeiro.

## Propósito

Cadastro de produtos (**Product** no domínio; **Produto** na UI pt-BR) para identificação comercial (nome, SKU, unidade, categoria).

## Arquitetura

```
UI (routes/produtos)
  → application use cases (can + validation)
    → ProductRepository
      → SupabaseProductRepository
        → PostgreSQL + RLS
```

Componentes React **não** importam o SDK Supabase.

## Entidade (`product`)

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| id, organization_id | sim | tenant; org vem do contexto ativo, nunca do formulário |
| name | sim | 1–200 chars |
| description | não | ≤2000 |
| sku | sim | único por org; normalizado UPPERCASE |
| category | não | texto livre ≤120 (sem tabela de categorias nesta sprint) |
| unit | sim | texto livre ≤32 (`un`, `kg`, `cx`…) |
| status | sim | `active` \| `inactive` |
| archived_at / archived_by | com archive | soft archive |
| created_*/updated_* | sim | auditoria de linha |

## Invariantes

1. Todo product pertence a exatamente uma organização.
2. SKU é único por organização **em qualquer status** (arquivar não libera o SKU).
3. Sem hard delete — arquivar (`inactive` + `archived_at`).
4. Produto arquivado não é editável até restaurar.
5. Não há saldo, preço ou variante neste módulo.

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
| `products.read` | listar, buscar, detalhe |
| `products.create` | criar (`write` implica) |
| `products.edit` | editar, arquivar, restaurar (`write` implica) |
| `products.write` | atalho owner/admin/manager |

UI: `can()`, `FeatureGate`, `RequirePermission`.  
Casos de uso revalidam `can()` no servidor de aplicação.

## Casos de uso

- `createProduct` — `products.create` \| `write`
- `updateProduct` — `products.edit` \| `write` (bloqueia arquivado)
- `archiveProduct` / `restoreProduct` — `products.edit` \| `write`
- `getProduct` / `listProducts` (`searchProducts`) — `products.read`

## Listagem (servidor)

| Concern | Comportamento |
|---------|---------------|
| Busca `q` | `name`, `sku`, `category`, `description` |
| Filtro | `active` (padrão) \| `inactive` \| `all` |
| Ordenação | `name_asc` (padrão) \| `updated_desc` |
| Paginação | cursor `encodeURIComponent(value)::id`; page size 20 (máx. 50) |
| Isolamento | sempre `organization_id` da org ativa |

## Query keys

```
['rescript','products', orgId, 'list', filters]
['rescript','products', orgId, 'detail', id]
```

Isoladas por organização; invalidadas em switch de org e mutations.

## Mutations

| Hook | Invalidação |
|------|-------------|
| `useProductActions().create/update/archive/restore` | `queryKeys.products.all(orgId)` |

## RLS (banco)

| Policy | Regra |
|--------|-------|
| SELECT | `is_org_member(organization_id)` |
| INSERT | membro + `created_by`/`updated_by` = `auth.uid()` |
| UPDATE | membro + `updated_by` = `auth.uid()` |
| DELETE | inexistente |

**Nível de segurança:**

- **Banco:** isolamento por membership ativa no tenant.
- **Aplicação:** autorização granular `products.*` via `can()`.

## UI

| Rota | Conteúdo |
|------|----------|
| `/produtos` | busca, filtro status, tabela, paginação, dialog criar |
| `/produtos/:id` | detalhe, editar, arquivar/restaurar, banner arquivado |

Estados: loading, vazio, erro, forbidden, não encontrado (mesmo UX sem revelar outro tenant).

## Command palette

| Comando | Permissão |
|---------|-----------|
| Ir para Produtos | — |
| Novo Produto | `products.create` |
| Buscar Produto | `products.read` |

## Estrutura

```
apps/web/src/modules/products/
  domain/       types, validation
  application/  use cases, errors, audit
  infrastructure/ mappers, supabase repository
  ui/           ProductForm, useProductActions
  index.ts      barrel
```

## Decisões

Ver `ProductsInconsistencies.md`.

## Migration

`supabase/migrations/20260725030000_products.sql`

```bash
npx supabase db push
npm run db:types
```

## Limitações

- Sem variantes / preço / estoque (Inventory / Pricing futuros)
- Category e unit como texto (sem FKs nesta sprint)
- Audit port noop
- ⌘K não lista entidades reais de product (vai à listagem)
- Testes RLS live pendentes até migration aplicada no remoto
