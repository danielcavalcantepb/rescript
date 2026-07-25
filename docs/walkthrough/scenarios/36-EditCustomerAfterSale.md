# Cenário 36 — Edição de Cliente Após Venda

## Cenário

Cliente muda nome/endereço; venda anterior mantém snapshot; cadastro atual mostra novos dados.

### Objetivo
SaleSnapshots vs referência Customer.

### Atores
Vendedor; Admin CRM

### Estado inicial
Sale Confirmada com customer_snapshot nome “ACME Ltda”, doc X.

### Pré-condições
customers.update

### Passos executados

#### 1. UpdateCustomer nome/endereço
6. Customer atual muda; Sales antigas **não**
#### 2. Abrir Sale histórica
4. UI lê snapshot da Sale (+ ref id para navegação ao cadastro atual)

### Estado final esperado
Histórico congelado; cadastro vivo atualizado.

### Invariantes verificadas
Snapshots imutáveis pós-confirmação (e tipicamente desde emissão de orçamento — ver 37).

### Inconsistências encontradas
Momento exato do freeze do customer_snapshot (draft vs quote vs confirm) pode variar na doc — alinhar SaleSnapshots.

### Ajustes recomendados
Congelar customer_snapshot no primeiro estado “externo” (Orçamento/Pedido) e reforçar no Confirm.

### Classificação
**aprovado com ressalvas**
