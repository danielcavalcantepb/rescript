---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / ERD
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ERD Lógico (Mermaid por contexto)

> Sem diagrama gigante. Cardinalidades simplificadas.

---

## Access

```mermaid
erDiagram
    USER ||--o{ MEMBERSHIP : has
    ORGANIZATION ||--o{ MEMBERSHIP : has
    ROLE ||--o{ MEMBERSHIP : assigned
    ROLE ||--o{ ROLE_PERMISSION : has
    PERMISSION ||--o{ ROLE_PERMISSION : granted
    ORGANIZATION ||--o{ INVITE : sends
    ORGANIZATION ||--o{ SUPPORT_ACCESS_GRANT : may_have
```

## Catalog

```mermaid
erDiagram
    ORGANIZATION ||--o{ PRODUCT : owns
    PRODUCT ||--|{ PRODUCT_VARIANT : has
    PRODUCT ||--o{ VARIANT_ATTRIBUTE_DEF : defines
    VARIANT_ATTRIBUTE_DEF ||--o{ VARIANT_ATTRIBUTE_OPTION : has
    PRODUCT_VARIANT ||--o{ VARIANT_ATTRIBUTE_VALUE : values
    PRODUCT_VARIANT ||--o| PRICE_CURRENT : priced
```

## Customers

```mermaid
erDiagram
    ORGANIZATION ||--o{ CUSTOMER : owns
    CUSTOMER ||--o{ CUSTOMER_CONTACT : has
    CUSTOMER ||--o{ CUSTOMER_ADDRESS : has
```

## Inventory

```mermaid
erDiagram
    ORGANIZATION ||--o{ STOCK_LOCATION : owns
    STOCK_LOCATION ||--o{ INVENTORY_BALANCE : at
    PRODUCT_VARIANT ||--o{ INVENTORY_BALANCE : of
    PRODUCT_VARIANT ||--o{ INVENTORY_MOVEMENT : ledger
    STOCK_LOCATION ||--o{ INVENTORY_MOVEMENT : at
    PRODUCT_VARIANT ||--o{ INVENTORY_RESERVATION_ITEM : reserved
    INVENTORY_RESERVATION ||--|{ INVENTORY_RESERVATION_ITEM : contains
    PRODUCT_VARIANT ||--o| AVERAGE_COST_CURRENT : cost
```

## Sales

```mermaid
erDiagram
    ORGANIZATION ||--o{ SALE : owns
    SALE ||--|{ SALE_ITEM : contains
    SALE ||--o{ SALE_STATUS_HISTORY : history
    SALE ||--o{ SALE_DISCOUNT : discounts
    SALE }o--o| CUSTOMER : for
    SALE ||--o{ INVENTORY_RESERVATION : reserves
```

## Finance

```mermaid
erDiagram
    SALE ||--o| RECEIVABLE : generates
    RECEIVABLE ||--|{ RECEIVABLE_INSTALLMENT : splits
    PAYMENT ||--|{ PAYMENT_ALLOCATION : allocates
    RECEIVABLE_INSTALLMENT ||--o{ PAYMENT_ALLOCATION : receives
    PAYMENT ||--o| PAYMENT : reverses
```

## Insights

```mermaid
erDiagram
    ORGANIZATION ||--o{ INSIGHT : owns
    INSIGHT_RULE ||--o{ INSIGHT : defines
```

## Fiscal (fronteira)

```mermaid
erDiagram
    SALE ||--o{ FISCAL_REQUEST : may_request
    FISCAL_REQUEST ||--o| FISCAL_DOCUMENT : results
```

## Subscriptions

```mermaid
erDiagram
    PLAN ||--o{ PLAN_VERSION : versions
    PLAN_VERSION ||--o{ ENTITLEMENT : grants
    ORGANIZATION ||--o| SUBSCRIPTION : subscribes
    SUBSCRIPTION }o--|| PLAN_VERSION : on
    ORGANIZATION ||--o{ ORGANIZATION_ENTITLEMENT : overrides
```
