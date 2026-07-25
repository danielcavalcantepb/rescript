# Cenário 16 — Pagamento Duplicado

## Cenário

Mesmo pagamento enviado duas vezes com a mesma chave de idempotência e/ou mesma referência externa; apenas um pagamento válido deve existir.

### Objetivo
Validar idempotência de `OP-RegisterPayment` e unicidade `(organization_id, idempotency_key)` / política de `external_ref`.

### Atores
- Operador financeiro (`finance.payment.register`)
- Sistema (retry de cliente / gateway)

### Estado inicial
- Org A ativa; Receivable R1 de R$ 1.000,00; Installment I1 saldo R$ 1.000,00.
- Hipótese: Money com scale 2 BRL (OQ-05 aberto).

### Pré-condições
- Membership ativa; entitlement financeiro; org não suspensa.

### Passos executados

#### 1. Primeiro RegisterPayment
1. **Comando:** `RegisterPayment` (amount=1000, installment=I1, idempotency_key=K1, external_ref=EXT-9)
2. **Autorização:** `finance.payment.register`; tenant via membership server-side
3. **Validações:** amount > 0; amount ≤ saldo; receivable não cancelado; key ausente
4. **Consultadas:** Installment, Receivable, IdempotencyRecord
5. **Criadas:** Payment (confirmed), PaymentAllocation, AuditEvent, Outbox `PaymentRegistered`, IdempotencyRecord→resultado
6. **Alteradas:** saldo installment 0; status Quitado (derivado)
7. **Locks:** Installment FOR UPDATE; Idempotency gate
8. **Auditoria:** valor, método, ator, correlation_id
9. **Eventos:** PaymentRegistered
10. **Outbox:** na mesma TX
11. **Derivados:** saldo recebível; caixa do dia
12. **Insight:** possível remoção de “vencido” se aplicável
13. **Falha:** saldo insuficiente → rejeita
14. **Recuperação:** N/A

#### 2. Segunda chamada idêntica (K1)
1. **Comando:** mesmo payload + K1
2. **Autorização:** revalidada
3. **Validações:** IdempotencyRecord hit → **não** cria novo Payment
4. **Consultadas:** IdempotencyRecord
5. **Criadas:** nenhuma
6. **Alteradas:** nenhuma
7. **Locks:** leitura da key
8–10. Sem novos audit/outbox de negócio (opcional audit de retry)
11–12. Inalterados
13. **Falha:** se payload diferir com mesma key → rejeitar (cenário 49)
14. **Recuperação:** retorna Payment id da primeira execução

#### 3. Tentativa só com external_ref duplicado (sem key)
1. **Comando:** RegisterPayment sem key, external_ref=EXT-9
2–3. Política deve bloquear ou exigir key — **lacuna se só unique parcial**
4–14. Se constraint `(org, provider, external_ref)` existir → único; senão risco de duplicata

### Estado final esperado
Um Payment; installment quitado; segunda chamada retorna o mesmo resultado.

### Invariantes verificadas
Idempotência; saldo ≥ 0; tenant ownership; Payment não booleano.

### Inconsistências encontradas
- Unicidade de `external_ref` sem provider pode ser frágil.
- OQ-05 Money não fecha precisão de comparação.

### Ajustes recomendados
Documentar: unique `(org, source, external_ref)` quando ref presente; key obrigatória em API/gateway.

### Classificação
**aprovado com ressalvas**
