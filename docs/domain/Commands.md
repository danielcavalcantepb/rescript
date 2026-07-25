# Rescript — Comandos

> Um **comando** é a intenção de **mudar** o estado do domínio (imperativo). Cada comando é atendido por um agregado/serviço, aplica invariantes e pode produzir eventos.
> Status: Modelagem conceitual (DDD). Leituras em `Queries.md`.

---

## 1. Anatomia de um Comando (conceitual)

- **Nome imperativo:** `ConfirmSale`, `RegisterPayment`.
- **Alvo:** o agregado que o executa.
- **Autorização:** a permissão necessária.
- **Entitlement:** se depende de plano/limite.
- **Invariantes:** o que ele nunca pode violar.
- **Resultado:** mudança de estado + eventos.
- **Idempotência:** comandos sensíveis são idempotentes.

> Comando ≠ evento. Comando é um **pedido** ("faça"); pode ser rejeitado. Evento é um **fato** ("aconteceu"); é imutável.

---

## 2. Catálogo de Comandos

### Access & Tenancy
| Comando | Alvo | Permissão | Eventos |
|---|---|---|---|
| `RegisterUser` | User | — (público) | `UserRegistered` |
| `CreateOrganization` | Organization | (onboarding) | `OrganizationCreated` |
| `InviteMember` | Organization/Invite | `members.invite` | `MemberInvited` |
| `AcceptInvite` | Invite/Membership | (convidado) | `InviteAccepted`, `MemberJoined` |
| `RevokeInvite` | Invite | `members.invite` | `InviteRevoked` |
| `ChangeMemberRoles` | Membership | `members.manage_roles` | `MemberRoleChanged` |
| `RemoveMember` | Membership | `members.remove` | `MemberRemoved` |
| `TransferOwnership` | Organization | `org.transfer` (proprietário) | `OwnershipTransferred` |
| `SwitchActiveOrganization` | (sessão) | (membership válida) | — |
| `SuspendOrganization` | Organization | interno/billing | `OrganizationSuspended` |

### Catalog & Customers
| Comando | Alvo | Permissão | Eventos |
|---|---|---|---|
| `CreateCustomer` | Customer | `customers.create` | `CustomerCreated` |
| `UpdateCustomer` | Customer | `customers.update` | `CustomerUpdated` |
| `DeactivateCustomer` | Customer | `customers.deactivate` | `CustomerDeactivated` |
| `CreateProduct` | Product | `products.create` | `ProductCreated`, `VariantCreated` |
| `UpdateProduct` | Product | `products.update` | `ProductUpdated` |
| `ChangePrice` | ProductVariant | `products.price` | `PriceChanged` |
| `DeactivateProduct` | Product | `products.deactivate` | `ProductDeactivated` |

### Inventory (Core)
| Comando | Alvo | Permissão | Eventos |
|---|---|---|---|
| `RecordInventoryEntry` | InventoryItem | `inventory.move` | `InventoryMoved` |
| `RecordInventoryExit` | InventoryItem | `inventory.move` | `InventoryMoved` |
| `AdjustInventory` | InventoryItem | `inventory.adjust` | `InventoryMoved` (ajuste) |
| `ReserveStock` | InventoryItem | (sistema/venda) | `InventoryReserved` |
| `ReleaseReservation` | InventoryItem | (sistema/venda) | `InventoryReleased` |

### Sales (Core)
| Comando | Alvo | Permissão | Idempotente | Eventos |
|---|---|---|---|---|
| `CreateSale` | Sale | `sales.create` | — | `SaleCreated` |
| `AddSaleItem` / `RemoveSaleItem` | Sale | `sales.edit` | — | — |
| `ApplyDiscount` | Sale | `sales.discount` (+ `sales.discount.authorize` se acima do teto) | — | — (auditado) |
| `ConfirmSale` ⭐ | Sale (+Inv+Rec+Fin) | `sales.confirm` | **Sim** | `SaleConfirmed`, reserva consumida, `InventoryMoved`, `ReceivableCreated`, `PaymentRegistered?` |
| `CancelSale` ⭐ | Sale (+compensações) | `sales.cancel` | **Sim** | `SaleCancelled`, `InventoryReleased`/estorno, `ReceivableCanceled`, `PaymentReversed?` |

### Sales — fases pré-confirmação (sem agregado Order)
| Comando | Alvo | Permissão | Eventos |
|---|---|---|---|
| `QuoteSale` | Sale → Orçamento | `sales.edit` | `SaleQuoted`, `InventoryReserved?` |
| `PlaceSaleOrder` | Sale → Pedido | `sales.edit` | `SaleOrdered`, `InventoryReserved` |
| `DiscardSale` | Sale → Descartada | `sales.edit` | `SaleDiscarded`, `InventoryReleased?` |
| `CancelSaleOrder` | Sale → PedidoCancelado | `sales.edit` | `SaleOrderCancelled`, `InventoryReleased` |
| `RejectQuote` / (expiração) | Sale | `sales.edit` / sistema | `SaleQuoteRejected` / `SaleQuoteExpired` |

### Finance (Core)
| Comando | Alvo | Permissão | Idempotente | Eventos |
|---|---|---|---|---|
| `RegisterPayment` | Receivable | `payments.register` | **Sim** | `PaymentRegistered`, `ReceivableSettled?` |
| `ReversePayment` | Receivable | `payments.reverse` | **Sim** | `PaymentReversed` |
| `ChangeInstallmentDueDate` | Receivable | `receivables.reschedule` | — | (auditado) |

### Intelligence
| Comando | Alvo | Permissão | Eventos |
|---|---|---|---|
| `DismissInsight` | Insight | (usuário) | `InsightDismissed` |
| `ProvideInsightFeedback` | Insight | (usuário) | — |
| *(GenerateInsight é do sistema, não do usuário)* | Insight | (motor) | `InsightGenerated` |

### Bordas
| Comando | Alvo | Permissão | Idempotente | Eventos |
|---|---|---|---|---|
| `StartImport` | ImportJob | `imports.run` | — | — |
| `ConfirmImport` | ImportJob | `imports.run` | **Sim** | `ImportCompleted`/`ImportFailed` |
| `RevertImport` | ImportJob | `imports.run` | **Sim** | `ImportReverted` |
| `IssueFiscalDocument` | FiscalDocument | `fiscal.issue` | **Sim** | `FiscalDocumentIssued`/`Rejected` |
| `CancelFiscalDocument` | FiscalDocument | `fiscal.cancel` | **Sim** | `FiscalDocumentCanceled` |
| `ChangePlan` | Subscription | `billing.manage` | — | `SubscriptionChanged` |
| `CancelSubscription` | Subscription | `billing.manage` | — | `SubscriptionCanceled` |

---

## 3. Comandos idempotentes (destaque)

Comandos que mudam estoque/financeiro/fiscal ou têm efeito colateral externo são **idempotentes** — repetir (clique duplo, retry) não duplica efeito:

`ConfirmSale`, `CancelSale`, `RegisterPayment`, `ReversePayment`, `ConfirmImport`, `RevertImport`, `IssueFiscalDocument`, `CancelFiscalDocument`, `ReserveStock`, `ReleaseReservation`.

> A mecânica (chave de idempotência) é da camada de aplicação (`architecture/SaleTransaction.md`); no domínio, a **garantia** é que o resultado é o mesmo em repetição.

---

## 4. Regras gerais de Comandos

1. Todo comando passa por **autorização** e, quando aplicável, **entitlement** (ambos independentes).
2. Comandos podem ser **rejeitados** (violação de invariante/política) — e a rejeição é explicável.
3. Comandos sensíveis geram **auditoria**.
4. Comandos que mudam múltiplos agregados são atendidos por **serviços de domínio** (`DomainServices.md`).
5. O nome do comando é **imperativo** e da linguagem ubíqua.
