---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / Attributes
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Atributos Lógicos

> Tipos: identificador · texto · decimal · inteiro · boolean · data · instante · enum · money · quantity · json · referência · hash.  
> **Ainda não** tipos SQL. Legenda: Obrig=obrigatório · Imut=imutável pós-create (ou pós-evento) · Único=escopo indicado · Calc=calculado/derivado.

---

## Convenções transversais

| Atributo | Tipo | Obrig | Imut | Notas |
|---|---|---|---|---|
| id | identificador | sim | sim | PK técnica UUID (pref. v7) |
| organization_id | referência | sim* | sim | *exceto User, Permission system, Plan |
| created_at / created_by | instante / ref | sim / var | sim | |
| updated_at / updated_by | instante / ref | mutáveis | não | ausente em ledgers |
| version | inteiro | mutáveis críticos | não | optimistic lock |
| archived_at | instante | não | — | cadastros |
| idempotency_key | texto | ops críticas | sim | |
| correlation_id | texto | audit/outbox | — | |
| metadata | json | não | — | raro, schema versionado |

---

## User

| Nome | Significado | Tipo | Obrig | Imut | Único | Calc | Origem |
|---|---|---|---|---|---|---|---|
| id | PK | id | sim | sim | global | não | auth |
| auth_subject | id provedor | texto | sim | sim | global | não | auth |
| email | login | texto | sim | não | global | não | user |
| status | active/disabled | enum | sim | não | — | não | system |

## Organization

| Nome | Significado | Tipo | Obrig | Imut | Único | Calc |
|---|---|---|---|---|---|---|
| id | PK | id | sim | sim | global | não |
| name | nome fantasia | texto | sim | não | — | não |
| legal_name | razão | texto | não | não | — | não |
| document | CNPJ/etc | texto | não | não | por org policy | não |
| currency | moeda ops | enum/texto | sim | quase | — | não | default BRL |
| operational_status | active/suspended/canceled | enum | sim | não | — | não |
| onboarding_completed_at | fim onboarding | instante | não | não | — | não |

## Membership

| Nome | Tipo | Obrig | Imut | Único |
|---|---|---|---|---|
| user_id, organization_id, role_id | ref | sim | role mutável | (user, org) active |
| status | enum | sim | não | — |
| is_owner | boolean | sim | não | ≥1 owner/org |

## Customer

| Nome | Tipo | Obrig | Imut | Único | Calc |
|---|---|---|---|---|---|
| person_type | enum PF/PJ | sim | não | — | não |
| name | texto | sim | não | — | não |
| trade_name | texto | não | não | — | não |
| document | texto | não | não | (org, document) se presente | não |
| status | enum | sim | não | — | não |
| notes | texto | não | não | — | não |
| external_id | texto | não | não | (org, source, external_id) | não |

## Product / ProductVariant

| Nome | Entidade | Tipo | Obrig | Imut | Único | Calc |
|---|---|---|---|---|---|---|
| name | Product | texto | sim | não | — | não |
| unit_id | Product | ref | sim | quase* | — | não |
| tracks_inventory | Product/Variant | bool | sim | não | — | não |
| is_default | Variant | bool | sim | não | um default/produto | não |
| sku | Variant | texto | não | não | (org, sku) | não |
| barcode | Variant | texto | não | não | (org, barcode) se set | não |
| combination_hash | Variant | hash | se attrs | **sim após movimento** | (org, product, hash) | sim |
| status | both | enum | sim | não | — | não |
| min_sale_qty / sale_multiple / precision | Variant/Unit | decimal/int | var | precisão quase imutável | — | não |

\*troca de unidade bloqueada após movimentos (domínio).

## Money / Quantity (VO persistido)

| Campo | Tipo | Notas |
|---|---|---|
| amount | decimal | nunca float binário |
| currency | texto | BRL MVP |
| unit_id / precision | ref/int | Quantity |
| rounding_policy | enum | quando necessário |

## PriceCurrent / PriceHistory

| Nome | Tipo | Obrig | Imut |
|---|---|---|---|
| variant_id | ref | sim | — |
| amount + currency | money | sim | history sim |
| effective_at | instante | history | sim |

## InventoryMovement

| Nome | Tipo | Obrig | Imut | Calc |
|---|---|---|---|---|
| type | enum entry/exit/adjust/return/reversal | sim | **sim** | não |
| quantity | quantity | sim | **sim** | não |
| unit_cost_applied | money | saída sim | **sim** | não |
| total_cost | money | var | **sim** | sim |
| source_type / source_id | texto/id | sim | **sim** | não |
| reason | texto | ajuste sim | **sim** | não |
| occurred_at | instante | sim | **sim** | não |

## InventoryReservation (+ Item)

| Nome | Tipo | Obrig | Imut |
|---|---|---|---|
| status | enum | sim | transição |
| source_type/source_id | (Sale) | sim | sim |
| expires_at | instante | não | não |
| qty_reserved / consumed / released | quantity | sim | transição |
| variant_id, location_id | ref | sim | sim |

## InventoryBalance

| Nome | Tipo | Calc | Notas |
|---|---|---|---|
| qty_physical / reserved / available | quantity | sim | available = physical − reserved |
| updated_at | instante | sim | materializado reconstruível |

## AverageCostCurrent / Ledger

| Nome | Tipo | Calc |
|---|---|---|
| unit_cost | money | vigente DER |
| qty_before/after, cost_before/after, entry_* | decimal/money | ledger FT |

## Sale

| Nome | Tipo | Obrig | Imut | Único | Calc |
|---|---|---|---|---|---|
| sale_number | texto/int | sim | sim pós-emit | (org, number) | seq org |
| status | enum | sim | transição | — | não |
| customer_id | ref | não | não pré-confirm | — | não |
| customer_snapshot | json/cols | var | **sim pós orçamento/confirm** | — | cópia |
| seller_user_id | ref | sim | não | — | não |
| currency | texto | sim | sim | — | org |
| quote_valid_until | instante | orçamento | não | — | não |
| confirmed_at / canceled_at | instante | var | sim quando set | — | não |
| subtotal / discount_total / total | money | sim | pós-confirm | — | **sim** |
| version | int | sim | não | — | não |
| idempotency_key | texto | na confirm | sim | (org, key) | não |
| channel / source | enum | sim | sim | — | não |

## SaleItem

| Nome | Tipo | Obrig | Imut pós-confirm |
|---|---|---|---|
| line_no | int | sim | sim |
| variant_id | ref | sim | ref sim; snapshot sim |
| description/sku/unit/attrs snapshots | texto | sim | **sim** |
| quantity | quantity | sim | sim |
| list_price / unit_price | money | sim | sim |
| line_discount | money/% | não | sim |
| line_total | money | sim | sim calc |
| tracks_inventory_at_confirm | bool | sim | sim |

## SaleDiscount / DiscountAuthorization

| Nome | Tipo | Notas |
|---|---|---|
| type percent/amount | enum | |
| requested_by / authorized_by | ref | self-auth policy |
| status | enum pending/approved/denied | auth |
| permission_key_used | texto | |

## Receivable / Installment

| Nome | Tipo | Obrig | Calc |
|---|---|---|---|
| sale_id | ref | sim | não |
| original_amount | money | sim | não |
| balance | money | sim | **sim** via allocations |
| status | enum | sim | **sim** derivado preferencial |
| due_on | data | parcela | não |
| installment_no | int | sim | não |

## Payment / Allocation

| Nome | Tipo | Obrig | Imut | Único |
|---|---|---|---|---|
| amount | money | sim | sim confirmado | — |
| method | enum | sim | sim | — |
| status | enum | sim | transição | — |
| paid_at | instante | sim | sim | — |
| idempotency_key | texto | sim API | sim | (org, key) |
| external_ref | texto | não | sim | (org, source, ref) recomendado |
| reverses_payment_id | ref | estorno | sim | — |
| allocation.amount | money | sim | sim | — |

## Insight

| Nome | Tipo | Obrig | Único |
|---|---|---|---|
| rule_key / rule_version | texto/int | sim | — |
| fingerprint | hash | sim | (org, fingerprint, active) dedup |
| type | fato/projeção/recomendação | sim | — |
| severity | enum | sim | — |
| title / explanation | texto | sim | — |
| source_refs | json | sim | — |
| status | active/dismissed/resolved/expired | sim | — |
| confidence | enum | sim | — |

## OutboxMessage

| Nome | Tipo | Obrig |
|---|---|---|
| event_type / payload_version | texto/int | sim |
| payload | json | sim |
| aggregate_type / aggregate_id | texto/id | sim |
| status | pending/processed/dead | sim |
| attempts / next_retry_at / last_error | int/instante/texto | var |
| correlation_id / causation_id | texto | recomendado |

## AuditEvent

| Nome | Tipo | Obrig |
|---|---|---|
| actor_user_id / actor_type | ref/enum | sim |
| action | texto | sim |
| entity_type / entity_id | texto/id | sim |
| before / after | json seletivo | não (sem segredos) |
| ip / user_agent | texto | não |
| occurred_at | instante | sim |

## ImportJob / FileObject

| Nome | Tipo | Notas |
|---|---|---|
| type / status / mapping | enum/json | job |
| idempotency_key | texto | unique org |
| path / hash / size / mime | texto/int | file |
| organization_id | ref | isolamento |

## Fiscal* (fronteira)

| Nome | Tipo | Notas |
|---|---|---|
| status / provider_ref / access_key | enum/texto | V1 |
| sale_id | ref | vínculo |
| xml/pdf file refs | ref | storage |

---

## Campos derivados (nunca FT primária)

totais Sale (pré-confirm recalculáveis) · available · balance receivable · installment status · Decision Center blocks · margem estimada  

Ver `DerivedData.md`.
