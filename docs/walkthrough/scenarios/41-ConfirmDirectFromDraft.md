# Cenário 41 — Confirmação Direta do Rascunho (exploratório)

## Cenário

StateMachines permite Rascunho→Confirmada direto; validar reserva implícita.

### Objetivo
Caminho T direto sem Pedido; atomicidade igual ConfirmSale.

### Atores
Vendedor

### Estado inicial
Rascunho com itens controlados; sem Reservation.

### Pré-condições
sales.confirm; disponível suficiente (**HYPOTHESIS** negativo proibido).

### Passos executados

#### 1. ConfirmSale from Draft
3. Validações iguais; **reserva:** criar+consumir na mesma TX **ou** saída direta sem Reservation persistida?
Documentação: Confirm consome reserva se existir; se não existir, deve reservar implicitamente ou baixar direto verificando available.
5–6. Movements exit; Receivable; Sale Confirmada; se Reservation criada transientemente, status Consumed na mesma TX
7. Locks balances
13. Insufficient stock → fail

### Estado final esperado
Confirmada; físico↓; sem Reservation ativa órfã.

### Invariantes verificadas
Atomicidade; disponível.

### Inconsistências encontradas
Caminho “sem Pedido” não detalha se Reservation é obrigatória como registro ou só check de available.

### Ajustes recomendados
Especificar: Confirm sempre faz lock+check available; Reservation row opcional se já existir; não exigir Pedido.

### Classificação
**aprovado com ressalvas**
