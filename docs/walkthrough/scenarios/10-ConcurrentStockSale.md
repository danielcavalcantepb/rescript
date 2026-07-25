# Cenário 10 — Venda Concorrente de Estoque

## Cenário

Disponível=5; Vendedor A confirma venda de 4 e Vendedor B confirma venda de 3 **simultaneamente**; com **HYPOTHESIS** negative stock FORBIDDEN, uma operação falha; locks ordenados por variant_id; conflito explícito com RN-34.

### Objetivo
Validar ConcurrencyModel, ordered locks, e política de estoque negativo na simulação vs. RN-34.

### Atores
- Vendedor A (Sale A, qty=4)
- Vendedor B (Sale B, qty=3)
- Sistema (locks de balance)

### Estado inicial
Variante Y: físico=5, reservado=0, disponível=5.
OrganizationSettings.negative_stock_policy=**block** (**HYPOTHESIS simulação**).
Sale A e B em Pedido **sem reserva prévia** ou reservas que somam >5 — cenário pior: confirmação direta concorrente.

### Pré-condições
- Duas Sales distintas, mesma variante Y
- ConfirmSale paralelo, idempotency_keys distintas

### Passos executados

#### 1. Disparo simultâneo ConfirmSale
1. **Comando:** `ConfirmSale` A (4) || `ConfirmSale` B (3)
2. **Autorização:** ambos `sales.confirm`
3. **Validações:** recheck available após lock; A: 5≥4 ok; B: após A, disponível=1 < 3 → **falha**
4. **Consultadas:** balances, reservations (consumir ou baixa direta)
5. **Criadas:** efeitos completos só para **vencedor** (ex.: A)
6. **Alteradas:** A→Confirmada, físico 5→1; B permanece Pedido/Rascunho
7. **Locks:** **ordered by variant_id** — mesma ordem evita deadlock; pessimista row lock (ConcurrencyModel)
8. **Auditoria:** A confirmada; B falha com motivo estoque
9. **Eventos:** outbox só A
10. **Outbox:** SaleConfirmed ×1
11. **Derivados:** disponível=1 pós-A
12. **Insight:** estoque baixo
13. **Falha:** B — `InsufficientStock` / política block
14. **Recuperação:** B reduz qty ou aguarda reposição

#### 2. Variante com reservas prévias (Pedido A reserva 4, Pedido B reserva 3)
1. **Comando:** OrderSale A + OrderSale B concorrentes
2. **Autorização:** sales.edit
3. **Validações:** soma reservas ≤ disponível com locks
4. **Consultadas:** balances
5. **Criadas:** primeira reserva ok (4); segunda falha (1 restante < 3) se block
6. **Alteradas:** reservado parcial
7. **Locks:** ordered variant_id
8. **Auditoria:** tentativa B
9. **Eventos:** InventoryReserved ×1
10. **Outbox:** n/a
11. **Derivados:** disponível=1
12. **Insight:** risco ruptura
13. **Falha:** B na reserva ou na confirmação
14. **Recuperação:** fila B

#### 3. Contraste RN-34 (allow_with_alert — produção default)
1. **Comando:** mesma concorrência com policy=allow_with_alert
2. **Autorização:** idem
3. **Validações:** ambas **passariam** com alerta; físico poderia ir a −2 disponível conceitualmente se permitido negativo
4. **Consultadas:** RN-34, RN-90
5–14. **Simulação atual NÃO usa este caminho** — registrado como conflito

### Estado final esperado
Exatamente uma venda confirmada de 4 un (cenário A vence); saldo físico=1, reservado=0, disponível=1; B não confirmada; **nenhum estoque negativo**.

### Invariantes verificadas
I2, I3, I5, S3, RN-06 (correção > velocidade); ordered locks anti-deadlock.

### Inconsistências encontradas
- **CONFLITO CRÍTICO SIMULAÇÃO vs RN-34:** sim FORBIDDEN; RN-34 default recomendado = allow_with_alert. Cenários 07, 08, 10 assumem block — classificação "aprovado com ressalvas" obrigatória.
- RN-34 é política configurável (RN-90) — não viola invariante, mas simulação ≠ default produto.
- Sem reserva prévia, oversell risk maior — Pedido+reserva mitiga (FD-02).

### Ajustes recomendados
- Executar matriz de testes: block vs allow_with_alert.
- Documentar alerta obrigatório quando allow (auditoria + insight).
- Founder decision: default org block ou allow para beachhead atacado?

### Classificação
**aprovado com ressalvas**
