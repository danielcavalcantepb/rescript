---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / Performance
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Performance e Escala

> Orgs ativas aproximadas. Sem SQL.

| Escala orgs | Perfil | Estratégia |
|---|---|---|
| 10 | dev/beachhead | índices MVP; queries simples |
| 100 | early | idem + connection pooling |
| 1.000 | growth | cuidar outbox/audit volume; insight jobs batch |
| 10.000 | scale | partição audit/movement por tempo; read replicas opcional |
| 100.000 | large | sharding lógico por org ainda single DB possível com RLS; mat views seletivas; cache authz |

---

## Consultas críticas

| Query | Defesa |
|---|---|
| Lista vendas org+status | índice composto |
| Vencidos | installment (org,status,due) |
| Saldo variante | balance PK lógica |
| Expire reservas | (status, expires_at) |
| Outbox pending | (status, next_retry) |
| Central insights | (org,status,severity) pré-persistido |

## Cache

- Permissões efetivas: TTL curto / invalidate on role change  
- Central: revalidate on event; não cachear saldo estoque longo  

## Particionamento (futuro)

AuditEvent · InventoryMovement · OutboxMessage por `occurred_at` / mês.

## O que não fazer cedo

Microserviços DB · CQRS completo · mat view na hot path de ConfirmSale.
