# Cenário 32 — Falha HTTP Após Commit da Venda

## Cenário

Transação confirma; resposta HTTP falha; cliente repete; idempotência devolve resultado anterior.

### Objetivo
Separar commit DB de entrega HTTP; mesma idempotency_key.

### Atores
Vendedor; API

### Estado inicial
Pedido pronto; key=K-CONF-1.

### Pré-condições
sales.confirm.

### Passos executados

#### 1. Primeira tentativa
1. ConfirmSale(K-CONF-1) → TX commit OK → processo crash antes do response
6. Sale Confirmada; movements; receivable; IdempotencyRecord salva response body

#### 2. Retry cliente
1. ConfirmSale(K-CONF-1) mesmo payload
3. Idempotency hit → retorna Sale confirmada **sem** novo movement
5. Zero criações

### Estado final esperado
Uma confirmação; cliente eventualmente consistente.

### Invariantes verificadas
Idempotência; ledger único.

### Inconsistências encontradas
Nenhuma se IdempotencyRecord persistir resultado completo.

### Ajustes recomendados
SLA: gravar IdempotencyRecord **antes** de considerar sucesso externo; incluir sale_id no stored result.

### Classificação
**aprovado**
