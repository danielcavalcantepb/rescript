# Soft Delete, Arquivamento e Fim de Vida

| Conceito | Uso | Exemplos |
|---|---|---|
| Arquivamento | cadastro fora de uso; histórico ok | Customer, Product, Variant |
| Inativação | user/membership | Membership status |
| Cancelamento | transação anulada c/ compensação | Sale Cancelada |
| Expiração | tempo | Invite, Reservation, Quote |
| Estorno | compensação financeira | Payment reversal |
| Soft delete (`deleted_at`) | **raro** | só se não houver conceito melhor |
| Hard delete | temporários / previews | ImportRow staging, files temp |
| Imutável | nunca delete | Movement, Audit, confirmed payment amounts |

**Proibido:** hard delete Sale confirmada, Movement, Payment, Audit.

Client “excluir produto” → **arquivar**.
