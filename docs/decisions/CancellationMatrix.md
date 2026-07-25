# Matriz — Cancelar × Estornar × Devolver

> Baseada nas **PROPOSTAS** de `PendingDecisions.md` / `FounderDecisionClosure.md`.  
> Não aprovada até voto do fundador.

Legenda impacto: — nenhum · ↑ aumenta · ↓ reduz · C cancela/encerra · R reversal/compensação · B bloqueado até pré-condição · FUT fora MVP

| Ação | Entidade | Pré-condição | Estoque | Receivable | Payment | Caixa (derivado) | Fiscal | Auth | Evento | Reversível? |
|---|---|---|---|---|---|---|---|---|---|---|
| Descartar rascunho | Sale→Descartada | status Rascunho | — (libera res se houver) | — | — | — | — | sales.edit | SaleDiscarded | não reabre mesmo id |
| Recusar orçamento | Sale→OrçamentoRecusado | Orçamento | libera res se houver | — | — | — | — | sales.edit | SaleQuoteRejected | não |
| Expirar orçamento | Sale→OrçamentoExpirado | validade | libera res | — | — | — | — | system | SaleQuoteExpired | não |
| Cancelar pedido | Sale→PedidoCancelado | Pedido | libera reserva | — | — | — | — | sales.cancel | SaleOrderCanceled | não |
| Liberar reserva | Reservation→Released | active | reserved↓ | — | — | — | — | sales.cancel / system | ReservationReleased | não (pode nova res) |
| Expirar reserva | Reservation→Expired | TTL | reserved↓ | — | — | — | — | system | ReservationExpired | Pedido permanece |
| Confirmar venda | Sale→Confirmada | pré-confirm | consome res + exit↓ | cria | opcional | ↑ se pay | FUT request | sales.confirm | SaleConfirmed | via cancel path |
| Cancelar venda confirmada **não paga** | Sale→Cancelada | Confirmada; net pay=0 | R entry | C | — | — | FUT | sales.cancel | SaleCanceled | não “descancelar” |
| Cancelar venda confirmada **com pagamento** | Sale | net pay>0 | **B** | **B** | exige estorno antes | — | — | — | — | — |
| Estornar pagamento (total) | Payment→reversed + reversal pay | confirmed; amount=líquido | — | saldo↑ / reabre | R | ↓ | — | payments.reverse | PaymentReversed | não apaga original |
| Estornar pagamento parcial | Payment | — | — | — | **FUT** | — | — | — | — | — |
| Cancelar recebível (via cancel sale) | Receivable | com CancelSale unpaid | — | C | — | — | — | (na OP) | ReceivableCanceled | — |
| Devolver item (estoque) | Movement return | Sale Confirmada; qty≤líquida | ↑ return | — | separado | — | FUT | inventory.return / sales.return | InventoryReturned | compensação só |
| Devolver dinheiro | processo ops | após/estorno | — | — | ligado a reverse | ↓ real | — | ops | audit | — |
| Gerar crédito cliente | — | — | — | — | — | — | — | — | — | **FUT** |
| Cancelar documento fiscal | FiscalRequest | V1; NF exists | — | — | — | — | C provider | fiscal.* | FiscalCanceled | provider rules |

### Ordem obrigatória proposta (venda paga)

```
ReversePayment(s) até net=0  →  CancelSale (estoque + receivable + status)
```

Atalho UX “Estornar e cancelar” = mesma ordem em uma TX, mesmas permissões.
