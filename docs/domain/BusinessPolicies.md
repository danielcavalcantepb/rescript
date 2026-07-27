---
Status: Active
Owner: Domain Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: domain / BusinessPolicies
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Políticas e Regras de Negócio

> Política = regra configurável. Invariante = verdade não negociável (`Invariants.md`).
> Status: Alinhado a `FounderDecisions.md` (FD-01…FD-08).

---

## 1. Política × Invariante

- **Invariante:** nunca violável (ex.: reserva ≠ saída).
- **Política:** pode variar por organização (ex.: teto de desconto, expiração de reserva).

---

## 2. Catálogo de Políticas (MVP)

| Política | Decisão oficial | Padrão MVP | Escopo |
|---|---|---|---|
| **CostingPolicy** | **Custo médio ponderado** (FD-01). PEPS fora. | Médio ponderado | Global no MVP (método fixo) |
| **ReservationPolicy** | **Reserva no MVP** (FD-02). Ativa tipicamente em Pedido; opcional em Orçamento. | Reservar ao promover a Pedido; expiração configurável | Por organização |
| **NegativeStockPolicy** | Bloquear ou permitir com alerta | Permitir com alerta (RN-34) | Por organização |
| **StockControlPolicy** | Variante controla estoque? | Por variante | Por variante |
| **DiscountAuthorizationPolicy** | Teto + autorização por **permissão** (FD-05) | Teto configurável; motivo em desconto sensível | Por organização |
| **InstallmentPolicy** | Parcelamento, nº máx., intervalos | Configurável simples | Por organização |
| **InterestPolicy** | Juros/multa | **Desligada — fora do MVP** (FD-04); V1 | — |
| **OverduePolicy** | Quando marcar vencida | No vencimento | Por organização |
| **RoundingPolicy** | Arredondamento Money/Quantity | Regra única por unidade/moeda | Global |
| **CurrencyPolicy** | Moeda operacional | **BRL**; sem FX (FD-07) | Organização (padrão BRL) |
| **UnitPrecisionPolicy** | Precisão por unidade (FD-06) | Inteiras: 0 casas; fracionadas: precisão definida | Catálogo de unidades |
| **InsightRelevancePolicy** | Limiares / teto de itens | Conservador | Global |
| **DismissalPolicy** | Reaparecimento de insight | Só mudança material | Global |

---

## 3. Políticas oficiais em detalhe

### 3.1. CostingPolicy — custo médio ponderado (FD-01 / ADR-0016)
- Recalcula a cada **entrada com custo**.
- Saída grava custo médio vigente no movimento.
- Entrada sem custo: não altera média.
- Devolução/estorno/ajuste: compensação rastreável; **proibida** edição silenciosa de custo histórico.
- PEPS: não.

### 3.2. ReservationPolicy (FD-02 / ADR-0017)
- Reserva **entra no MVP**.
- Tipicamente criada ao entrar em **Pedido**; Orçamento pode reservar se configurado.
- Expiração opcional; liberação em cancelamento pré-confirmação / expiração / recusa.
- Confirmação: reserva → **Consumida** + **saída** física.
- Reserva **nunca** é InventoryMovement.

### 3.3. DiscountAuthorizationPolicy (FD-05 / ADR-0019)
- Organização define: desconto máximo sem autorização; permissões para conceder/autorizar acima; motivo obrigatório em sensíveis.
- Registro: % , valor, usuário, autorização, motivo, data, efeito na margem.
- Checagem por `sales.discount` / `sales.discount.authorize` — **não** por nome de papel fixo.

### 3.4. InterestPolicy
- **Fora do MVP.** Fronteira V1: encargos como lançamentos adicionais sem quebrar Receivable/Payment.

### 3.5. CurrencyPolicy
- MVP: BRL via moeda da organização. Money carrega currency. Sem conversão/FX/relatórios multi-moeda.

### 3.6. UnitPrecisionPolicy (FD-06)
- Unidades inteiras e fracionadas. Precisão e arredondamento por unidade. Quantity nunca float binário. Mínimo e múltiplo de venda opcionais.

---

## 4. Regras-chave (BusinessRules) mapeadas

| # | Onde |
|---|---|
| RN-25…27 | Variante, atributos, unidades |
| RN-30…38 | Saldos, movimentos, reserva, custeio |
| RN-40…48 | Sale, confirmação, desconto |
| RN-50…57 | Recebível/pagamento; sem juros MVP |
| RN-80 | Atomicidade da confirmação |

---

## 5. Invariantes sobre políticas

1. Padrões sensatos (RN-90).
2. Política nunca viola invariante (ex.: NegativeStock ainda exige origem no movimento).
3. Mudança sensível de política é auditada.
4. Políticas explícitas e nomeadas.
