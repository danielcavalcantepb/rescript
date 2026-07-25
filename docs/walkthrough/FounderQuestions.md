# Decisões do Fundador — Oriundas do Walkthrough

> Recomendações **não** são decisões aprovadas.
> Inclui OQs herdadas de `docs/database/OpenQuestions.md` + novas FQ do walkthrough.

---

## FQ-01 — Cancelamento após pagamento (WT-02, cenário 14)

**Contexto:** Sale Confirmada com Payment confirmed; usuário cancela.

| Opção | Descrição | Prós | Contras |
|---|---|---|---|
| **A** | CancelSale **bloqueia** até estorno total prévio | Simples; ordem explícita | Dois passos UX |
| **B** | CancelSale **orquestra** estorno total + compensação estoque + cancel receivable numa TX | Uma ação | OP mais complexa |
| **C** | Permite Cancelada financeira “com crédito” sem estornar payment | Flexível | Risco contábil/caixa |

**Recomendação:** **A** no MVP (bloqueio); **B** como atalho UX na mesma OP se todos estornos forem totais e idempotentes.

**Impacto schema:** estados Payment/Sale; possivelmente flag `cancel_requires_zero_net_payments`.

**Impacto MVP:** alto — fluxo crítico.

---

## FQ-02 — Estorno parcial no MVP (WT-03, cenário 17)

| Opção | Prós | Contras |
|---|---|---|
| **A** Só estorno integral no MVP | Simplicidade | Status partially_reversed ocioso |
| **B** Parcial no MVP | Cobre realidade B2B | Mais casos de teste |

**Recomendação:** **A**; manter coluna/status para V1 sem UX parcial.

---

## FQ-03 — Devolução financeira no MVP (WT-04, cenário 21)

| Opção | Prós | Contras |
|---|---|---|
| **A** Devolução = só estoque (movement return) + estorno pagamento manual | Menos acoplamento | Dois fluxos |
| **B** OP-Return atômica (estoque + financeiro) | Integridade | Escopo MVP cresce |
| **C** Adiar devolução para V1 (contradiz MVP.md texto atual) | — | Exige emenda MVP |

**Recomendação:** **A** alinhada a proporcionalidade; emendar docs para deixar financeiro da devolução explícito como passo separado no MVP.

---

## FQ-04 — Conflito de importação (WT-05, cenário 23)

| Opção | Default |
|---|---|
| **A** skip + relatório | **Recomendado MVP** |
| **B** update campos não históricos | Opt-in |
| **C** ask / fila de decisão | V1 |

---

## FQ-05 — Preço em Rascunho (WT-06, cenário 37)

| Opção | |
|---|---|
| **A Freeze** | Mantém preço copiado; botão “atualizar do catálogo” — **recomendado** |
| **B Recalc automático** ao reabrir |
| **C Recalc só no confirm** | **Rejeitar** (surpreendente) |

---

## FQ-06 — Sale após expiração da reserva do Pedido (WT-07, cenário 11)

| Opção | |
|---|---|
| **A** Novo status `PedidoExpirado` (terminal ou reabrível) | |
| **B** Pedido permanece; só Reservation→expired; confirmar exige nova reserva | **Recomendado** (menos estados) |

---

## FQ-07 — Herança OQ (schema)

Reapresentar para fechamento antes do schema físico:

| ID | Tema | Recomendação walkthrough |
|---|---|---|
| OQ-01 | Precisão unidades | un=0; kg/L=3 |
| OQ-02 | TTL reserva default | 72h Pedido |
| OQ-03 | Orçamento reserva? | Não |
| OQ-04 | % desconto sem auth | 5% |
| OQ-05 | Money storage | NUMERIC(19,6) + scale display 2 |
| OQ-08 | Negativo | **Conflito H-02:** ou ratificar RN-34 allow_with_alert **ou** mudar BR para block default |
| OQ-09 | Avg cost key | (org, location, variant) |
| OQ-10 | Multi-local MVP | 1 local padrão, modelo ready |

OQ-06/07 podem permanecer abertas.
