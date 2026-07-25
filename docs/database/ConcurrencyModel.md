# Modelo de Concorrência

---

## 1. Cenários e defesas

| Cenário | Defesa |
|---|---|
| Dois ConfirmSale mesmo item | Row lock balance/variant ordenado; recheck available |
| Duas reservas simultâneas | Lock balance; soma reserved ≤ on_hand (ou policy) |
| Pagamento duplicado | idempotency_key unique |
| Webhook duplicado | external_event_id unique |
| Cancel vs payment | lock receivable/sale; estados |
| Edit sale vs confirm | version / status check (optimistic + status gate) |
| Preço muda durante venda | snapshot no confirm; edit draft usa preço atual |
| Member removed mid-op | recheck membership at start of TX |
| Import vs cadastro manual | natural keys + unique constraints |
| Adjust vs sale | mesmos locks de balance |
| Insight durante write | eventual; read committed ok |

---

## 2. Técnicas

| Técnica | Uso |
|---|---|
| **Pessimistic row lock** | estoque na confirmação/reserva |
| **Optimistic version** | Sale pré-confirmação |
| **Unique constraints** | idempotency, fingerprints |
| **Ordered locks** | evitar deadlock (ordenar variant_ids) |
| **Advisory locks** | opcional por (org, variant) se necessário |
| **Isolation** | **Read Committed** padrão Postgres suficiente com locks explícitos; não exigir Serializable sem prova |

---

## 3. Retries
- Cliente: retry com mesma idempotency key
- Workers: backoff + idempotent handlers
- Deadlock: retry limitado da TX

---

## 4. Recomendação de isolamento
Começar com **READ COMMITTED** + locks pessimistas nos pontos críticos. Avaliar SSI só com evidência de anomalias.
