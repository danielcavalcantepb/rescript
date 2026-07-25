# Cenário 47 — Recebível Parcelado (exploratório)

## Cenário

ConfirmSale gera N parcelas; pagamento de uma; demais abertas.

### Objetivo
Receivable + Installments; PaymentAllocation 1:1 típico MVP.

### Atores
Vendedor; Financeiro

### Estado inicial
Sale a confirmar; condição 2× R$ 500.

### Passos executados

#### 1. ConfirmSale
5. Receivable 1000; Installments I1, I2 500 cada
#### 2. Pay I1 500
6. I1 quitado; I2 aberto; Receivable parcialmente liquidado (derivado)
13. Pay I1 600 → rejeita excedente

### Estado final esperado
Estados por parcela; Sale Confirmada independente.

### Invariantes verificadas
Pagamento≠booleano; saldos.

### Inconsistências encontradas
Nomenclatura situação Receivable parcial — DerivedData.

### Ajustes recomendados
—
### Classificação
**aprovado**
