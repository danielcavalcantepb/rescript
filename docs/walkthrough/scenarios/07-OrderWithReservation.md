# Cenário 07 — Pedido com Reserva

## Cenário

Rascunho promovido a Pedido cria reserva ativa; TTL configurável; reservado sobe, disponível desce, físico inalterado; idempotência impede reserva duplicada.

### Objetivo
Validar FD-02, RN-31b, RN-38, ADR-0017 e **HYPOTHESIS:** pedido reserva; TTL org-configurable.

### Atores
- Vendedor
- Sistema (expiração futura — cenário 11)

### Estado inicial
Variante X: físico=10, reservado=0, disponível=10; Sale Rascunho qty=4 de X.

### Pré-condições
- `sales.edit` para promover a Pedido
- reservation_ttl configurado (ex.: 48h — **HYPOTHESIS**)
- Política estoque: **HYPOTHESIS** negative FORBIDDEN (conflito RN-34 — ver inconsistências)

### Passos executados

#### 1. Promover a Pedido com reserva
1. **Comando:** `OrderSale` (Rascunho → Pedido) + `ReserveStock` (implícito/coordenado)
2. **Autorização:** `sales.edit`; reserva via StockAllocationService
3. **Validações:** qty ≤ disponível se negative forbidden; variant tracks_inventory; uma reservation ativa por Sale (ReservationModel §5)
4. **Consultadas:** InventoryItem balance, OrganizationSettings (TTL, negative policy)
5. **Criadas:** InventoryReservation (active, expires_at), InventoryReservationItem (qty=4)
6. **Alteradas:** Sale.status=Pedido; reservado 0→4; disponível 10→6; **físico permanece 10**
7. **Locks:** pessimista row lock balance; variant_id ordenado
8. **Auditoria:** origem=sale_id
9. **Eventos:** `SaleOrdered`, `InventoryReserved`
10. **Outbox:** nenhum síncrono crítico
11. **Derivados:** I3 recalculado
12. **Insight:** pedido parado próximo ao TTL
13. **Falha:** disponível insuficiente → rejeição (**HYPOTHESIS** block; RN-34 default allow_with_alert)
14. **Recuperação:** reduzir qty ou aguardar liberação

#### 2. Idempotência — repetir OrderSale
1. **Comando:** `OrderSale` com mesma idempotency_key
2. **Autorização:** idem
3. **Validações:** Sale já Pedido; reservation existente
4. **Consultadas:** idempotency store, Reservation active
5. **Criadas:** nenhuma duplicata
6. **Alteradas:** nenhuma adicional
7. **Locks:** nenhum extra
8. **Auditoria:** retorno idempotente
9. **Eventos:** nenhum novo
10. **Outbox:** nenhum
11. **Derivados:** saldos inalterados
12. **Insight:** nenhum
13. **Falha:** segunda reservation conflitante → bug I5
14. **Recuperação:** n/a se idempotente ok

#### 3. Ajuste de quantidade no pedido (opcional)
1. **Comando:** `UpdateSaleItem` em Pedido → recalcular reserva
2. **Autorização:** `sales.edit`
3. **Validações:** delta reserva ≤ disponível + qty já reservada desta sale
4. **Consultadas:** ReservationItem remaining
5. **Criadas:** nenhuma nova reservation (update in-place)
6. **Alteradas:** qty reservada; balances
7. **Locks:** balance + reservation
8. **Auditoria:** ajuste
9. **Eventos:** `InventoryReserved` (adjusted)
10. **Outbox:** nenhum
11. **Derivados:** disponível atualizado
12. **Insight:** nenhum
13. **Falha:** aumento além do disponível
14. **Recuperação:** rejeitar aumento

### Estado final esperado
Sale Pedido; Reservation active com TTL; físico=10, reservado=4, disponível=6; sem InventoryMovement; sem financeiro.

### Invariantes verificadas
I3, I4, I5 (sem reserva duplicada), FD-02, RN-31b; reserva ≠ movimento.

### Inconsistências encontradas
- **CONFLITO SIMULAÇÃO vs RN-34:** sim usa negative FORBIDDEN; RN-34 default recomendado = allow_with_alert. Cenário 07 falha reserva se disponível insuficiente; produção default permitiria com alerta.
- TTL de reserva (**HYPOTHESIS**) referenciado em OQ-02 sem valor default oficial.
- Pedido "tipicamente" reserva (StateMachines) mas não invariante — ok para sim.

### Ajustes recomendados
- OrganizationSettings.negative_stock_policy explícita: block | allow_with_alert.
- Default TTL documentado (ex.: 72h B2B) ou null=sem expiração até cancelamento.

### Classificação
**aprovado com ressalvas**
