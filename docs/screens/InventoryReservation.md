---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / InventoryReservation
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# InventoryReservation

## Objetivo
Ver reservas ativas/expiradas; entender impacto no disponível; (liberação manual se permitido).

## Usuário
Estoque, vendedor, owner.

## Frequência
Média.

## Dados exibidos
Reserva: status · variante · qty · Sale número · expires_at · reserved/consumed/released.  
Prioridade: ativas e a expirar.

## Componentes
Header · Filters (ativa, expira 48h) · Table · Status Badge · Link Sale · Empty “Nenhuma reserva” · Alert TTL

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Abrir venda | SaleDetail | sales.read | não | — |
| Liberar (se policy) | release reservation | sales.cancel ou inventory especial | sim | disponível↑ |
| Expirar | job sistema | system | — | — |

## Estados
Loading · Empty · Error · No permission · Offline · Reserva expirada listada em filtro histórico

## Permissões
Leitura ampla operacional; liberação restrita

## Navegação
Estoque · Sale Pedido · Central “reservas expiram”

## Eventos
ReservationCreated/Consumed/Released/Expired (consumo via Confirm)

## Regras
FD-02; Reservation ≠ movement; OQ-02 TTL; walkthrough 07,11,51

## Casos extremos
Expire vs Confirm race · job duplo idempotente · Sale cancelada libera

## Design QA
- [ ] Deixar claro que não baixou estoque
- [ ] Link para venda óbvio
