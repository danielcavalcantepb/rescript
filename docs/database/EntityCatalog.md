---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / EntityCatalog
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Catálogo de Entidades Lógicas

> Finalidade · agregado · ownership · dependências · escopo.  
> Atributos detalhados em `Attributes.md`. FT = fonte de verdade · DER = derivado.

---

## 1. Access / Identity

| Entidade | Finalidade | Agregado | Owner | Dependências | Escopo |
|---|---|---|---|---|---|
| User | Identidade autenticada | User | plataforma | — | MVP |
| UserProfile | Nome/avatar preferências | User | user | User | MVP |
| Organization | Tenant comercial | Organization | self | — | MVP |
| Membership | User∈Org + role | Organization | org | User, Org, Role | MVP |
| Invite | Convite pendente | Organization | org | Org, Role | MVP |
| Role | Papel | Authorization | org ou system | Org? | MVP |
| Permission | Chave de capacidade | Authorization | system | — | MVP |
| RolePermission | N:N | Authorization | system/org | Role, Permission | MVP |
| SupportAccessGrant | Suporte temporário | Platform | platform | Org, User | MVP |
| PlatformAdmin | Staff Rescript | Platform | platform | User | MVP |
| IdempotencyRecord | Resultado de ops | Organization | org | — | MVP |

## 2. Billing

| Entidade | Finalidade | Agregado | Owner | Dependências | Escopo |
|---|---|---|---|---|---|
| Plan | Produto SaaS | Billing | platform | — | MVP |
| PlanVersion | Versão imutável | Billing | platform | Plan | MVP |
| Subscription | Assinatura org | Organization | org | PlanVersion | MVP |
| Entitlement | Capacidade plano | Billing | platform | PlanVersion | MVP |
| OrganizationEntitlement | Override | Organization | org | Entitlement | MVP |
| UsageCounter | Consumo | Organization | org | Entitlement | MVP |
| FeatureFlag | Flag técnica | Platform/Org | varia | — | MVP |

## 3. Settings

| Entidade | Finalidade | Agregado | Owner | Dependências | Escopo |
|---|---|---|---|---|---|
| OrganizationSetting | Config tipada | Organization | org | Org | MVP |
| OrganizationPolicy | Políticas negócio | Organization | org | Org | MVP |

## 4. Customers

| Entidade | Finalidade | Agregado | Owner | Dependências | Escopo |
|---|---|---|---|---|---|
| Customer | Cliente comercial | Customer | org | Org | MVP |
| CustomerContact | Contatos | Customer | org | Customer | MVP |
| CustomerAddress | Endereços | Customer | org | Customer | MVP |

## 5. Catalog

| Entidade | Finalidade | Agregado | Owner | Dependências | Escopo |
|---|---|---|---|---|---|
| UnitOfMeasure | Unidade | Org/Platform | org/platform | — | MVP |
| ProductCategory | Categoria | Organization | org | Org | MVP |
| Product | Produto | Product | org | Unit, Category? | MVP |
| ProductVariant | SKU/estoque/preço | Product | org | Product | MVP |
| VariantAttributeDef | Atributo (Cor) | Product | org | Product | MVP |
| VariantAttributeOption | Opção (Azul) | Product | org | AttrDef | MVP |
| VariantAttributeValue | Valor na variante | Product | org | Variant, Option | MVP |
| PriceCurrent | Preço vigente | Product | org | Variant | MVP |
| PriceHistory | Histórico preço | Product | org | Variant | MVP |

## 6. Inventory

| Entidade | Finalidade | Agregado | Owner | Dependências | Escopo |
|---|---|---|---|---|---|
| StockLocation | Local | Organization | org | Org | MVP |
| InventoryBalance | Saldos materializados | Inventory | org | Location, Variant | MVP DER |
| InventoryMovement | Ledger físico | Inventory | org | Location, Variant, source | MVP FT **imutável** |
| InventoryReservation | Compromisso | Inventory | org | Sale?, Location, Variant | MVP |
| InventoryReservationItem | Linha reserva | Inventory | org | Reservation, Variant | MVP |
| AverageCostCurrent | Média vigente | Inventory | org | Location, Variant | MVP DER |
| AverageCostLedger | Histórico cálculo | Inventory | org | Movement | MVP FT |
| InventoryCount | Contagem | Inventory | org | Location | FUT |

## 7. Sales

| Entidade | Finalidade | Agregado | Owner | Dependências | Escopo |
|---|---|---|---|---|---|
| Sale | Agregado comercial único | Sale | org | Customer?, User | MVP |
| SaleItem | Linha + snapshots | Sale | org | Sale, Variant | MVP |
| SaleStatusHistory | Histórico estados | Sale | org | Sale | MVP |
| SaleDiscount | Desconto aplicado | Sale | org | Sale, Auth? | MVP |
| DiscountAuthorization | Auth desconto | Sale | org | Sale, Users | MVP |
| SaleNote | Observações | Sale | org | Sale | MVP |

## 8. Finance

| Entidade | Finalidade | Agregado | Owner | Dependências | Escopo |
|---|---|---|---|---|---|
| Receivable | Obrigação a receber | Receivable | org | Sale | MVP |
| ReceivableInstallment | Parcela | Receivable | org | Receivable | MVP |
| Payment | Liquidação | Payment | org | — | MVP |
| PaymentAllocation | Payment↔Installment | Payment | org | Payment, Installment | MVP |
| FinancialEntry / FinancialCashMovement | Ledger caixa | Finance | org | Payment? | **FUT** (MVP: Payment é liquidação) |

## 9. Insights / Async / Edge

| Entidade | Finalidade | Agregado | Owner | Dependências | Escopo |
|---|---|---|---|---|---|
| InsightRule | Definição regra | Platform | platform | — | MVP |
| Insight | Resultado | Organization | org | sources | MVP |
| DomainEvent | Evento (opcional persist) | varia | org | aggregate | MVP |
| OutboxMessage | Outbox | Organization | org | — | MVP |
| AuditEvent | Auditoria | Organization | org | actor | MVP |
| ImportJob | Job import | Organization | org | File | MVP |
| ImportRow | Linha | ImportJob | org | Job | MVP |
| FileObject | Arquivo | Organization | org | — | MVP |
| FiscalDocument | Doc fiscal | Fiscal | org | Sale | V1/FUT |
| FiscalRequest | Solicitação emissão | Fiscal | org | Sale | V1/FUT |
| IntegrationConnection | Conexão | Organization | org | — | FUT |
| WebhookDelivery | Dedup webhook | Organization | org | — | FUT |

---

## 3. Agregados (fronteiras)

| Agregado | Raiz | Filhos principais |
|---|---|---|
| Organization | Organization | Membership, Invite, Policies, Subscription link |
| User | User | Profile |
| Customer | Customer | Contacts, Addresses |
| Product | Product | Variants, Attr*, Prices |
| InventoryItem (lógico) | Variant@Location | Balance, Movements, Reservations, AvgCost |
| Sale | Sale | Items, Discounts, Auths, Notes, StatusHistory |
| Receivable | Receivable | Installments |
| Payment | Payment | Allocations |
| ImportJob | ImportJob | Rows |
| Insight | Insight | (rule ref) |

**Sale não contém** InventoryMovement como filho de composição obrigatória — vínculo por `source_type/source_id` (referência). Reservation referencia Sale.
