# Cenário 09 — Duplo Clique na Confirmação

## Cenário

Operador dispara `ConfirmSale` duas vezes rapidamente com a **mesma idempotency_key**; apenas uma confirmação efetiva; segunda chamada retorna resultado idempotente sem duplicar estoque/financeiro.

### Objetivo
Validar S6, I5, RN-44 idempotência e UX de retry seguro.

### Atores
- Vendedor (duplo clique UI)
- Cliente HTTP (retry de rede)

### Estado inicial
Sale Pedido com reserva qty=3; idempotency_key=K1 gerada no client antes do primeiro submit; saldos conhecidos.

### Pré-condições
- Mesma K1 em ambas requisições
- Janela de concorrência < 1s

### Passos executados

#### 1. Primeira ConfirmSale (sucesso)
1. **Comando:** `ConfirmSale`(sale_id, idempotency_key=K1)
2. **Autorização:** `sales.confirm`
3. **Validações:** estado Pedido; estoque ok; K1 não existe → processar
4. **Consultadas:** idempotency store (miss), Sale, Reservation, balances
5. **Criadas:** todos efeitos cenário 08 + registro idempotency (K1 → result_hash/response)
6. **Alteradas:** Confirmada; saída; recebível; etc.
7. **Locks:** variant balance ordered
8. **Auditoria:** uma confirmação
9. **Eventos:** outbox uma vez
10. **Outbox:** 1× SaleConfirmed
11. **Derivados:** normais
12. **Insight:** 1 venda no dia
13. **Falha:** n/a
14. **Recuperação:** n/a

#### 2. Segunda ConfirmSale simultânea (mesma K1)
1. **Comando:** `ConfirmSale`(sale_id, idempotency_key=K1) — paralelo ou imediato
2. **Autorização:** `sales.confirm`
3. **Validações:** unique (org, idempotency_key) ou lock on key; Sale já Confirmada **ou** K1 completed
4. **Consultadas:** idempotency store (hit) **ou** Sale.status=Confirmada
5. **Criadas:** **nenhuma** movimento/recebível/pagamento adicional
6. **Alteradas:** nenhuma
7. **Locks:** idempotency unique constraint previne duplicata; segunda TX aborta cedo ou no-op
8. **Auditoria:** log "idempotent replay" (opcional)
9. **Eventos:** **nenhum novo** no outbox
10. **Outbox:** sem duplicata
11. **Derivados:** contagens inalteradas
12. **Insight:** não infla vendas
13. **Falha:** se duplicar → violação I5 crítica
14. **Recuperação:** compensação manual emergencial (nunca deveria ocorrer)

#### 3. Resposta ao cliente
1. **Comando:** n/a
2. **Autorização:** n/a
3. **Validações:** HTTP 200 com mesmo payload (sale Confirmada, ids estáveis)
4. **Consultadas:** resultado armazenado em K1
5–11. Sem efeitos colaterais
12. **Insight:** n/a
13. **Falha:** 409 divergente confunde UI
14. **Recuperação:** contrato API documentado — sempre 200 idempotente

### Estado final esperado
Exatamente 1 saída por linha; 1 recebível; 1 pagamento se à vista; Sale Confirmada; segunda request retorna resultado anterior.

### Invariantes verificadas
S6, I5, G5, RN-44; unique idempotency_key (PaymentsModel pattern aplicável a ConfirmSale).

### Inconsistências encontradas
- Sem ADR dedicado só a idempotency de ConfirmSale — inferido de ADR-0007 + Invariants; ok mas merece teste de carga.
- Chaves diferentes (K1, K2) no duplo clique **sem** idempotency → cenário 10/concorrência, não este.

### Ajustes recomendados
- UI: desabilitar botão após click; gerar K1 antes do submit.
- Constraint unique (organization_id, idempotency_key, operation=ConfirmSale).

### Classificação
**aprovado**
