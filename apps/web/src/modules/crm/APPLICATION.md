# CRM — Customer Aggregate (Phase 6A)

## Existente → Novo

| Existente (MVP) | Novo (Sprint 025) |
|---|---|
| Flat `customer` row + browser Supabase | Aggregate via Ports + server RPC |
| status `active`/`inactive` (= archive) | `draft` / `active` / `inactive` / `archived` |
| Flat email/phone/city | Contatos + Endereços + identity fields |
| Search on `customer` | Projection `customer_search` |
| Noop audit | Append-only `customer_history` |
| `/clientes` CRUD | `/crm` → `/crm/customers` |

## Aggregate

- **Customer** (root): PF | PJ (imutável), legalName, tradeName, document digits, email/phone, status
- **CustomerContact**: múltiplos, principal, soft-archive
- **CustomerAddress**: billing | shipping | other, principal por kind
- **CustomerDocument**: VO CPF/CNPJ (dígitos, checksum, sem máscara)
- **CustomerHistory**: append-only
- **CustomerSearch**: projeção — list/search nunca reconstrói o aggregate

## Lifecycle

`Create (draft|active) → Activate → Deactivate → Archive → Restore`  
Sem delete físico.

## Permissões

`customers.read|create|edit|write|archive|restore|contacts.manage|addresses.manage`  
Autorização no servidor (RPC); UI só FeatureGate.

## RPC

Contratos serializáveis em `modules/customers/ui/api/contracts.ts`.  
Bridge: `customer-api.ts` (createServerFn). Sem SQL/Supabase no client.

## Migrations

- `20260725020000_customers.sql` (base)
- `20260726050000_customer_aggregate.sql` (aggregate)

## Limitações

- Sem Sales / Purchase / Pipeline / Financeiro / Fiscal / Marketplace
- Sem Lead / Opportunity
- `/clientes` redireciona para `/crm/customers`
- Reserved/credit/tax avançado fora de escopo
