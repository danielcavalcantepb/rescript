# Revisão de Consistência — Walkthrough × Fontes Oficiais

> Nada resolvido em silêncio.

---

## WC-01 — Estoque negativo: H-02 vs RN-34

| | |
|---|---|
| **Documentos** | Hipótese walkthrough H-02; `BusinessRules.md` RN-34; `docs/database/OpenQuestions.md` OQ-08; `docs/database/ConsistencyReview.md` CR-01 |
| **Tensão** | Simulação proíbe negativo; BR recomenda allow_with_alert |
| **Precedência** | BusinessRules > hipótese de simulação; FD não redefine |
| **Proposta** | Tratar RN-34 como vigente até fundador mudar; marcar H-02 como **apenas cenário de stress** |
| **Status** | Aberto (OQ-08 / FQ-07) |

---

## WC-02 — Custo médio por local vs FD-01

| | |
|---|---|
| **Documentos** | FD-01; AverageCostModel; OQ-09; CR-04 database |
| **Proposta** | Interpretar FD-01 como por variante **no escopo do local**; 1 local ⇒ equivalente |
| **Status** | Aberto formalmente (OQ-09) |

---

## WC-03 — Cancelamento + pagamento

| | |
|---|---|
| **Documentos** | StateMachines (“estorno explícito”); TransactionalOperations OP-CancelSale; cenário 14 |
| **Tensão** | “Explícito” ≠ orquestrado automaticamente |
| **Status** | FQ-01 |

---

## WC-04 — Devolução no MVP

| | |
|---|---|
| **Documentos** | MVP.md (movimentos incluem devolução); FD-01.4; Commands/UseCases fracos em Return financeiro |
| **Tensão** | Estoque previsto; financeiro não |
| **Status** | FQ-03 |

---

## WC-05 — Estorno parcial

| | |
|---|---|
| **Documentos** | PaymentsModel `partially_reversed`; MVP “estorno”; cenário 17 |
| **Status** | FQ-02 |

---

## WC-06 — Preço de rascunho

| | |
|---|---|
| **Documentos** | PricingModel (cópia ao adicionar); SaleSnapshots (imutável pós-confirm); silêncio no draft |
| **Status** | FQ-05 |

---

## WC-07 — Termo “Concluída” vs “Confirmada”

| | |
|---|---|
| **Nota** | Glossário oficial usa Confirmada; varrer resquícios estratégicos se ainda existirem |
| **Status** | Mitigação contínua (não bloqueante) |

---

## Conclusão

Nenhum conflito exige **remodelar** agregados principais. Conflitos remanescentes são de **política/default/API de operação**, adequados a decisões do fundador antes do schema físico.
