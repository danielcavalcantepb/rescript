# Matriz Lógica de RLS / Acesso

> Sem SQL de policy. Classificação de acesso por estrutura.

Legenda acesso: **Direct** (cliente com RLS) · **RO** · **FnOnly** (função/transação) · **Backend** (service role restrito) · **Platform**

| Estrutura | Select | Insert | Update | Delete | Classe |
|---|---|---|---|---|---|
| User (próprio) | self | signup | self | — | Direct limitado |
| Organization | members | owner flow | admin | — | Direct |
| Membership | members admin | via invite fn | admin roles | soft remove | Direct/Fn |
| Invite | admin | admin | — | revoke | Direct |
| Role/Permission | all auth | platform | platform | — | RO / Platform |
| Customer/Product/Variant | perm | perm | perm | archive only | Direct |
| PriceCurrent | perm | perm | perm | — | Direct |
| InventoryBalance | perm | **FnOnly** | **FnOnly** | — | RO + Fn |
| InventoryMovement | perm | **FnOnly** | **proibido** | **proibido** | RO + Fn |
| Reservation* | perm | **FnOnly** | **FnOnly** | — | Fn |
| Sale (draft/quote/order) | perm | perm | perm+version | discard | Direct |
| Sale confirmed fields | perm | — | **proibido** | — | RO |
| Confirm/Cancel Sale | — | — | **FnOnly** | — | Fn |
| Receivable/Installment | perm fin | **FnOnly** | limitado | — | RO + Fn |
| Payment/Allocation | perm fin | **FnOnly** | reverse fn | — | Fn |
| AuditEvent | audit.view | **Backend/Fn** | proibido | proibido | RO + Backend |
| Outbox | — | **Fn/Backend** | worker | — | Backend |
| Insight | perm | system | user dismiss | — | Direct limitado |
| ImportJob | perm | perm | system | — | Direct |
| FileObject meta | perm | perm | — | soft | Direct |
| Subscription | owner/admin | billing webhook | billing | — | Direct limitado |
| SupportAccessGrant | platform+owner | platform/owner | revoke | — | Platform |
| Secrets | — | — | — | — | Vault only |

### Regras transversais
1. Membership ativa + org ativa para escrita.
2. Org suspensa → select talvez; insert/update operacional negado.
3. Confirmação/estoque/pagamento **somente** via operação transacional controlada.
4. Service role nunca exposto ao cliente.
5. organization_id do JWT/claim é insuficiente sozinho — validar membership.
