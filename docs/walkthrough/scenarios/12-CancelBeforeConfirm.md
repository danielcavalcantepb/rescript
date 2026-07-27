---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 12-CancelBeforeConfirm
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 12 — Cancelar Antes de Confirmar

## Cenário

Pedido com reserva ativa cancelado antes da confirmação; reserva liberada; saldos restaurados; sem movimento físico; sem recebível.

### Objetivo
Validar T7 StateMachines, `CancelSaleOrder`, RN-31b e ausência de efeitos financeiros.

### Atores
- Vendedor ou Gerente
- StockAllocationService

### Estado inicial
Sale Pedido; Reservation active qty=6; físico=30, reservado=6, disponível=24.

### Pré-condições
- Estado=Pedido (não Confirmada)
- `sales.edit` ou permissão de cancelamento de pedido

### Passos executados

#### 1. Cancelar pedido
1. **Comando:** `CancelSaleOrder` (Pedido → PedidoCancelado)
2. **Autorização:** `sales.edit`; vendedor dono ou gerente
3. **Validações:** G6 — transição válida; não Confirmada
4. **Consultadas:** Sale, InventoryReservation active
5. **Criadas:** nenhum InventoryMovement; nenhum Receivable
6. **Alteradas:** Sale.status=PedidoCancelado; Reservation→Released; reservado 6→0; disponível 24→30
7. **Locks:** reservation + balance (ordered variant_id)
8. **Auditoria:** motivo cancelamento (opcional pré-confirmação)
9. **Eventos:** `SaleOrderCancelled`, `InventoryReleased`
10. **Outbox:** nenhum crítico síncrono
11. **Derivados:** I3 restaurado
12. **Insight:** nenhum financeiro
13. **Falha:** cancelar Confirmada por este comando → rejeição (usar CancelSale)
14. **Recuperação:** n/a

#### 2. Verificações pós-cancelamento
1. **Comando:** queries estoque e financeiro
2. **Autorização:** read
3. **Validações:** físico inalterado (=30); ledger sem nova saída; zero Receivable para sale_id
4. **Consultadas:** InventoryMovement, Receivable
5–11. Nenhum efeito colateral
12. **Insight:** n/a
13. **Falha:** recebível fantasma → bug X1
14. **Recuperação:** compensação emergencial

#### 3. Idempotência cancelamento
1. **Comando:** repetir `CancelSaleOrder`
2. **Autorização:** idem
3. **Validações:** já PedidoCancelado → no-op/idempotent response
4. **Consultadas:** Sale status
5–14. Sem double-release

### Estado final esperado
Sale terminal PedidoCancelado; Reservation Released; físico=30, reservado=0, disponível=30; histórico de reserva preservado; sem financeiro.

### Invariantes verificadas
I4, I7 (n/a — sem compensação física pois não houve saída), S8, G6; liberação ≤ remaining reservado.

### Inconsistências encontradas
- PedidoCancelado é terminal — não reabre para Pedido (nova Sale necessária) — ok, mas UX B2B pode querer reativar; fora MVP.
- **HYPOTHESIS** negative FORBIDDEN irrelevante aqui (liberação).

### Ajustes recomendados
- Teste: cancelar Orçamento com reserva opcional (quote_reserves=true) — mesma liberação.
- Auditoria de motivo mesmo pré-confirmação (boa prática B2B).

### Classificação
**aprovado**
