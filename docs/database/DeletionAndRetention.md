# Exclusão e Retenção (orientação técnica — não parecer jurídico)

| Entidade | Estratégia |
|---|---|
| User | inativar / anonimizar; retenção audit |
| Organization | suspend → cancel → retention window → anonymize |
| Membership | status=removed (nunca apagar se há audit) |
| Customer | archive; anonymize sob pedido; **nunca** se quebrar histórico — snapshots ficam |
| Product/Variant | archive; sem delete se movimentos/vendas |
| Sale | nunca delete; cancel |
| InventoryMovement | **nunca delete** |
| Reservation | estados terminais; purge opcional só metadados antigos expired (cuidado) |
| Receivable/Payment | nunca delete; cancel/reverse |
| File temp | expire + physical delete |
| File fiscal | retenção longa (legal) |
| Insight | expire/dismiss; purge antigos ok |
| ImportJob | retenção operacional; arquivo temp purge |
| AuditEvent | retenção longa; sem delete |
| Outbox processed | archive/purge após N dias |
| Integration secrets | rotate; delete vault refs |

### Classificação rápida
- **Exclusão física permitida:** temp files, outbox processado antigo, previews
- **Arquivamento:** cadastros
- **Anonimização:** PII
- **Nunca excluir com dependências:** ledgers, confirmed sales, payments, audit
