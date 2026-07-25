# Catálogo de Relacionamentos

> Cardinalidades e regras de vínculo. Isolamento: **nunca** relacionar entidades de organizações diferentes.

---

## 1. Identity & Tenancy

```mermaid
erDiagram
    USER ||--o{ MEMBERSHIP : has
    ORGANIZATION ||--o{ MEMBERSHIP : has
    ORGANIZATION ||--o{ INVITE : issues
    ROLE ||--o{ MEMBERSHIP : assigned
    ROLE ||--o{ ROLE_PERMISSION : has
    PERMISSION ||--o{ ROLE_PERMISSION : grants
    ORGANIZATION ||--|| SUBSCRIPTION : has
    USER ||--o| USER_PROFILE : has
```

| De → Para | Card. | Regra |
|---|---|---|
| User → Membership | 1:N | Papéis só no membership |
| Organization → Membership | 1:N | ≥1 owner ativo |
| Organization → Invite | 1:N | Convite escopado à org |
| Membership → Role | N:N ou N:1 | MVP: um ou mais roles por membership |
| Organization → Subscription | 1:1 vigente | Histórico de mudanças versionado |

---

## 2. Catálogo

```mermaid
erDiagram
    ORGANIZATION ||--o{ CUSTOMER : owns
    CUSTOMER ||--o{ CUSTOMER_ADDRESS : has
    ORGANIZATION ||--o{ PRODUCT : owns
    PRODUCT ||--|{ PRODUCT_VARIANT : has
    PRODUCT ||--o{ VARIANT_ATTRIBUTE_DEF : defines
    PRODUCT_VARIANT ||--o{ VARIANT_ATTRIBUTE_VALUE : has
    PRODUCT_VARIANT ||--o| PRICE_CURRENT : has
    PRODUCT_VARIANT }o--|| UNIT_OF_MEASURE : uses
```

| De → Para | Card. | Regra |
|---|---|---|
| Product → Variant | 1:N (≥1) | Sempre existe variante padrão se sem atributos |
| Variant → Unit | N:1 | Unidade imutável após movimento (regra) |
| Variant → InventoryBalance | 1:N (por location) | Estoque na variante |

---

## 3. Estoque e reservas

```mermaid
erDiagram
    ORGANIZATION ||--|{ STOCK_LOCATION : has
    PRODUCT_VARIANT ||--o{ INVENTORY_BALANCE : stocked_as
    STOCK_LOCATION ||--o{ INVENTORY_BALANCE : holds
    PRODUCT_VARIANT ||--o{ INVENTORY_MOVEMENT : moved
    SALE ||--o{ INVENTORY_RESERVATION : originates
    INVENTORY_RESERVATION ||--|{ INVENTORY_RESERVATION_ITEM : contains
    PRODUCT_VARIANT ||--o{ INVENTORY_RESERVATION_ITEM : reserved
```

| De → Para | Card. | Regra |
|---|---|---|
| Movement → Variant + Location + Org | N:1 | organization_id consistente |
| Reservation → Sale | N:1 | Origem tipicamente Sale (fase Pedido/Orçamento) |
| ReservationItem → Variant | N:1 | Quantidades ≥ 0 |

---

## 4. Sale → Financeiro

```mermaid
erDiagram
    ORGANIZATION ||--o{ SALE : owns
    CUSTOMER ||--o{ SALE : buys
    SALE ||--|{ SALE_ITEM : contains
    SALE ||--o{ SALE_DISCOUNT : has
    SALE ||--o| RECEIVABLE : generates
    RECEIVABLE ||--|{ INSTALLMENT : splits
    PAYMENT ||--o{ PAYMENT_ALLOCATION : allocates
    INSTALLMENT ||--o{ PAYMENT_ALLOCATION : receives
    SALE_ITEM }o--|| PRODUCT_VARIANT : refs
```

| De → Para | Card. | Regra |
|---|---|---|
| Sale → SaleItem | 1:N (≥1 na confirmação) | Snapshots no item |
| Sale → Receivable | 1:0..1 (MVP) | À vista pode criar receivable quitado ou pagamento direto alocado |
| Payment → Allocation → Installment | N:N via allocation | MVP: tipicamente 1 pagamento → 1 parcela; modelo permite N |

**Proibido:** Sale.organization_id ≠ Item/Receivable/Payment.organization_id.

---

## 5. Assíncrono e inteligência

| De → Para | Card. | Regra |
|---|---|---|
| Outbox → Aggregate | N:1 | aggregate_type + aggregate_id |
| Insight → Organization | N:1 | fingerprint único ativo |
| ImportJob → FileObject | N:1 | arquivo temporário |
| AuditEvent → Actor/Org | N:1 | append-only |

---

## 6. Integridade cross-tenant (invariante global)

Toda FK entre entidades tenantadas implica **mesmo `organization_id`**. Garantia futura: constraint composta / trigger / validação de domínio — catalogada em `ConstraintCatalog.md` (C-TENANT-01).
