# Decisões Pendentes — Catálogo Consolidado

> Levantamento em: `docs/`, `architecture/`, `domain/`, `design/`, `screens/`, `database/`, `walkthrough/`.  
> Duplicatas unificadas. Recomendações ≠ aprovação.  
> Urgência: **BLOCKER** | **IMPORTANTE** | **PODE SER ADIADA**

---

## 0. Inventário sem duplicidade

| Código canônico | Equivalentes | Título curto | Urgência |
|---|---|---|---|
| **PD-MONEY** | OQ-05, WT-09 | Persistência Money | BLOCKER |
| **PD-AVGCOST** | OQ-09, WT-08, CR-04, WC-02 | Chave custo médio | BLOCKER |
| **PD-CANCEL-PAID** | FQ-01, WT-02, WC-03 | Cancelar venda após pagamento | BLOCKER |
| **PD-REVERSE-PARTIAL** | FQ-02, WT-03, WC-05 | Estorno parcial MVP | BLOCKER |
| **PD-RETURN** | FQ-03, WT-04, WC-04 | Devolução estoque+financeiro | BLOCKER |
| **PD-IDEM-HASH** | WT-14 | Idempotency request_hash | BLOCKER |
| **PD-QTY-PREC** | OQ-01, WT-10 | Precisão por unidade | BLOCKER (defaults) |
| **PD-NEG-STOCK** | OQ-08, WT-01, CR-01, WC-01 | Default estoque negativo | IMPORTANTE |
| **PD-LOCATION** | OQ-10 (+ parte OQ-09) | Locais de estoque no MVP | BLOCKER (modelo) |
| **PD-RES-TTL** | OQ-02 | TTL padrão reserva | IMPORTANTE |
| **PD-QUOTE-RES** | OQ-03 | Orçamento reserva? | IMPORTANTE |
| **PD-DISCOUNT** | OQ-04, WT-23, §8 | Política desconto | IMPORTANTE |
| **PD-PRICE-FREEZE** | FQ-05, WT-06, WC-06 | Freeze preço na Sale | IMPORTANTE |
| **PD-IMPORT-CONFLICT** | FQ-04 (conflito), WT-05 | Skip/update/ask import | IMPORTANTE |
| **PD-IMPORT-ROLLBACK** | FQ-04 expandido (§4 user) | Rollback de importação | IMPORTANTE |
| **PD-ORDER-EXPIRE** | FQ-06, WT-07 | Pedido após reserva expirada | IMPORTANTE |
| **PD-FIN-ENTRY** | CR-03, Ledger, MVP “caixa” | FinancialEntry vs Payment | BLOCKER |
| **PD-UNIT-CONV** | §7 user, FD-06 | Conversão entre unidades | IMPORTANTE |
| **PD-ROUND-MONEY** | ligado OQ-05/01 | Arredondamento Money×Qty | BLOCKER |
| **PD-EXTRACT-ORDER** | OQ-06 | Extrair Order agregado | ADIADA |
| **PD-PROVIDERS** | OQ-07 | Provedores externos | ADIADA |
| **PD-OWNER-TX** | WT-13 | TransferOwnership atômico | IMPORTANTE |
| **PD-CONFIRM-DRAFT** | WT-12 | Confirm sem Reservation row | IMPORTANTE |
| **PD-AVG-ZERO** | WT-15 | Média com físico=0 | IMPORTANTE |
| **PD-ARCHIVE-RES** | WT-16 | Arquivar c/ reserva | IMPORTANTE |
| **PD-ADJUST-RES** | WT-11 | Ajuste vs reserved | IMPORTANTE |
| **PD-ATTR-LOCK** | WT-19 | Attr imutável pós-movimento | IMPORTANTE |
| **PD-SNAP-WHEN** | WT-22 | Quando freeze customer snapshot | PODE ADIAR |
| **PD-SUSPEND-MATRIX** | WT-17 | Capacidades org suspensa | PODE ADIAR |
| **PD-RETURN-PERM** | WT-18 | Permissão return | com PD-RETURN |
| **PD-EXT-REF** | WT-21 | Unique external_ref | PODE ADIAR |
| **PD-ORPHAN-SALE** | WT-20 | Pedidos órfãos | PODE ADIAR |
| **PD-ENTITLE-MAP** | WT-24 | Features→ops | PODE ADIAR |
| **PD-TERM-CONFIRM** | WC-07 | “Concluída” vs Confirmada | PODE ADIAR (docs) |
| **PD-INTEREST** | CR-05, FD-04 | Juros — já fora MVP | ADIADA (fechada por FD-04) |
| **PD-OWNERSHIP-REQ** | DomainValidation | OwnershipTransferRequest entity | PODE ADIAR |

---

## 1. BLOCKERS (formato completo)

### PD-MONEY — Persistência de Money (OQ-05)

| | |
|---|---|
| **Contexto** | amount+currency sem tipo físico |
| **Por que** | Define colunas, checks, arredondamento |
| **Docs** | MoneyAndQuantity, OpenQuestions, Attributes |
| **Domínio** | VO Money inalterado |
| **Banco** | NUMERIC vs BIGINT cents |
| **UX** | Display R$ #.## |
| **MVP** | BRL only |
| **Futuro** | multi-currency mais fácil com NUMERIC+currency |
| **Alternativas** | A NUMERIC(19,6) store / scale 2 BRL · B cents INTEGER · C NUMERIC(19,2) only |
| **Prós A** | precisão intermediaária em rateios futuros |
| **Contras A** | disciplina de arredondamento |
| **Prós B** | inteiros simples |
| **Contras B** | multi-currency/fractional units pain |
| **Riscos** | float binário (proibido) |
| **Rec. técnica** | **A** |
| **Rec. produto** | **A** |
| **Decisão sugerida** | NUMERIC(19,6) + money_round half-up scale 2 na linha/total BRL |
| **Urgência** | BLOCKER |

### PD-AVGCOST — Chave custo médio (OQ-09)

| | |
|---|---|
| **Contexto** | FD-01 “por variante” vs multi-local |
| **Por que** | PK de AverageCostCurrent/Ledger |
| **Docs** | FD-01, AverageCostModel, CR-04 |
| **Alternativas** | A (org, variant) · B (org, location, variant) |
| **Rec.** | **B** com 1 local padrão (=A na prática MVP) |
| **Urgência** | BLOCKER |

### PD-LOCATION — Locais no MVP (OQ-10)

| | |
|---|---|
| **Contexto** | StockLocation no modelo; UX single |
| **Decisão sugerida** | Sempre 1 local “Principal” criado no onboarding; **oculto na UI**; saldo/reserva/movimento **sempre** com location_id; sem transferência; sem criar depósitos no MVP |
| **Urgência** | BLOCKER (fecha com PD-AVGCOST) |

### PD-CANCEL-PAID — Cancelar após pagamento (FQ-01)

Ver §4 análise profunda.  
**Decisão sugerida:** Bloquear CancelSale enquanto net payments > 0; exigir ReversePayment(s) totais antes; estoque/receivable só após zero líquido. Atalho UX opcional “Estornar e cancelar” = mesma TX orquestrada (equivale B com pré-condição estorno). Fiscal: cancelamento NF **independente** e V1.  
**Urgência:** BLOCKER

### PD-REVERSE-PARTIAL — Estorno parcial (FQ-02)

Ver §4.  
**Decisão sugerida:** MVP = **estorno total por Payment** apenas; status `partially_reversed` reservado V1 sem UX; múltiplos payments → estornar cada um integralmente.  
**Urgência:** BLOCKER

### PD-RETURN — Devolução (FQ-03)

Ver §4.  
**Decisão sugerida:** MVP mínimo = (1) movement `return` vinculado à Sale + custo FD-01.4; (2) financeiro via ReversePayment / não criar Refund entity; (3) sem troca, sem avariado, sem logistics; (4) devolução parcial de **qty item** ok no estoque; (5) fiscal V1. Emendar MVP.md para deixar explícito.  
**Urgência:** BLOCKER

### PD-FIN-ENTRY — FinancialEntry vs Payment

Ver §5.  
**Decisão sugerida:** **Opção A** — MVP = Receivable+Installment+Payment+Allocation; “caixa” = **projeção derivada** de Payments confirmados − estornos; sem despesas manuais; sem FinancialEntry table no MVP. Esclarecer MVP.md.  
**Urgência:** BLOCKER (promessa vs modelo)

### PD-IDEM-HASH — request_hash (WT-14)

**Decisão sugerida:** campo obrigatório em IdempotencyRecord; mismatch → 409.  
**Urgência:** BLOCKER

### PD-QTY-PREC + PD-ROUND-MONEY

**Decisão sugerida:**  
- precision por UnitOfMeasure (seed: un/cx=0; kg/L/m=3); max scale 6 no storage quantity  
- arredondamento Money: half-up scale 2 BRL em line_total e payment amounts  
- **sem conversão de unidades no MVP** (PD-UNIT-CONV = adiada)  
**Urgência:** BLOCKER

---

## 2. IMPORTANTES (resumo + sugestão)

| Código | Decisão sugerida |
|---|---|
| PD-NEG-STOCK | Ratificar **RN-34**: policy `allow_with_alert` default; org pode `block`. Não mudar BR. |
| PD-RES-TTL | Default **72h** em Pedido; configurável OrganizationPolicy; Quote não reserva |
| PD-QUOTE-RES | Default **false** |
| PD-DISCOUNT | Ver §8 — policy org; seed max_without_auth=5%; max_absolute=100%; self_auth=false; motivo acima threshold |
| PD-PRICE-FREEZE | Freeze ao adicionar item; sync manual; confirm usa preços da Sale; catálogo não reescreve |
| PD-IMPORT-CONFLICT | Default **skip** + relatório; update opt-in flag |
| PD-IMPORT-ROLLBACK | **Sem rollback destrutivo** após commit; compensar com correção/arquivo; se job não commitou, discard staging |
| PD-ORDER-EXPIRE | Pedido **permanece**; Reservation expired; confirmar re-reserva ou falha available |
| PD-UNIT-CONV | **Fora MVP**; qty decimal ≠ conversão cx↔un |
| PD-OWNER-TX | TransferOwnership **atômico** se target já member |
| PD-CONFIRM-DRAFT | Confirm pode baixar sem persistir Reservation; lock+check available |
| PD-AVG-ZERO | Se physical_before=0, avg = unit_cost da entrada (ou null se sem custo) |
| PD-ARCHIVE-RES | Bloquear archive se reserved>0 |
| PD-ADJUST-RES | Bloquear adjust se physical resultante < reserved |
| PD-ATTR-LOCK | combination_hash imutável após 1º movement; RN explícita |
| PD-RETURN-PERM | Se PD-RETURN: permissão `inventory.return` ou `sales.return` |

---

## 3. PODE SER ADIADA

PD-EXTRACT-ORDER · PD-PROVIDERS · PD-SNAP-WHEN (recomendar freeze em Orçamento/Pedido) · PD-SUSPEND-MATRIX · PD-EXT-REF · PD-ORPHAN-SALE · PD-ENTITLE-MAP · PD-TERM-CONFIRM · PD-OWNERSHIP-REQ · PD-INTEREST (já FD-04)

---

## 4. Análises profundas obrigatórias

### 4.1 FQ-01 / PD-CANCEL-PAID — Cancelamento após pagamento

#### Conceitos distintos (não sinônimos)

| Ação | Significado |
|---|---|
| Cancelar Sale | Anula venda confirmada (estado Cancelada) + compensações de domínio |
| Cancelar Receivable | Encerra obrigação aberta |
| Estornar Payment | Compensa liquidação (novo Payment reversal) |
| Devolver dinheiro ao cliente | Ato externo (caixa/PIX/cartão); pode ≥ estorno interno |
| Devolver mercadoria | Movement return / entrada compensatória |
| Cancelar doc fiscal | Ação no provedor fiscal (V1); **não** bloqueia núcleo MVP |

#### Cenários

| Cenário | Estoque já baixado | Pagamento | Política proposta MVP |
|---|---|---|---|
| Não paga (receivable aberto) | sim | 0 | CancelSale OK → reversal stock + cancel receivable |
| Parcial | sim | net > 0 | **Bloquear** cancel até estornar todos payments (totais) |
| Integral | sim | net = total | **Bloquear** até estorno total |
| Dinheiro | sim | confirmed | Estorno = registro interno “devolvido”; responsabilidade do operador devolver físico |
| Cartão / externo | sim | confirmed + external_ref | Estorno interno + flag “pendente gateway” FUT; MVP: operador confirma devolução externa manualmente |
| Recebível vencido | sim | 0 ou parcial | mesma regra net payments |
| NF emitida | sim | qualquer | CancelSale núcleo OK; fiscal request “cancel pending” V1 — **não** impedir cancel comercial no MVP (NF fora MVP) |
| Não entregue / entregue | — | — | MVP **não** modela entrega; cancel comercial = estorno estoque sempre (assumir retorno); logística FUT |

#### Ordem correta (proposta)

1. Estornar **todos** payments (net=0) — permissão `payments.reverse`  
2. CancelSale — `sales.cancel` — reversal inventory + cancel receivable + Sale Cancelada  
3. Fiscal cancel — V1, assíncrono  

**Permissões:** não permitir cancel paid sem reverse. Self-service atalho “Estornar e cancelar” requer ambas permissões.

---

### 4.2 FQ-02 / PD-REVERSE-PARTIAL

| Pergunta | Proposta MVP |
|---|---|
| Estorno total | **Sim** |
| Estorno parcial de um Payment | **Não** (V1) |
| Múltiplos estornos | Não no mesmo payment; N payments → N estornos totais |
| Estorno de pagamento já parcial (parcela) | Estorna o Payment integral |
| Estorno > pago | **Proibido** |
| Após conciliação futura | FUT |
| Cartão | Interno + processo manual externo |
| Admin sem devolução externa | Permitido com motivo + audit (“ajuste/estorno interno”) — distinto de “dinheiro devolvido” |

**Distinções:**  
- Estorno financeiro interno = Payment reversal  
- Devolução real de dinheiro = processo operacional/caixa (não entidade MVP)  
- Ajuste = inventory adjust (não financeiro)  
- Desconto posterior = **proibido** pós-confirm (novo crédito FUT)  
- Crédito cliente = **FUT** (não MVP)

---

### 4.3 FQ-03 / PD-RETURN — Devolução

**Conceito oficial proposto:**  
Devolução MVP = retorno de **quantidade de item** de uma Sale Confirmada ao estoque (movement `return` + custo da venda) **e**, se houver pagamento líquido, tratamento financeiro **separado** via estorno de Payment — não uma entidade `Refund`.

| Capacidade | MVP? |
|---|---|
| Refund entity | Não |
| Refund operação atômica full | Não |
| Crédito cliente | Não |
| Devolução parcial itens (qty) | **Sim** (estoque) |
| Devolução total itens | Sim |
| Sem retorno estoque | Não (ou só cancel financeiro — raro; fora) |
| Item avariado | Não (ajuste inventário separado) |
| Troca produto | Não |
| Pós NF | Fiscal V1 |

**Menor modelo seguro:** `InventoryMovement.type=return` + `source=sale` + ReversePayment manual se necessário + permissão + audit. Sem logistics reversa.

---

### 4.4 FQ-04 — Importação: conflito + rollback

**Conflito (PD-IMPORT-CONFLICT):** default skip; update opt-in; ask = V1.

**Rollback (PD-IMPORT-ROLLBACK):**

| Situação | Reversível? |
|---|---|
| Preview / staging não commitado | Sim — discard job |
| Commit há segundos, nada usado | Soft: arquivar entidades criadas **se** sem dependências; senão relatório |
| Produto já em venda/movimento | **Não** apagar — arquivar/corrigir |
| Estoque inicial já com saídas | **Não** rollback movement — compensar |
| Recebível importado já pago | **Não** apagar |

**Prazo:** sem “undo mágico”; janela operacional = só staging. Histórico válido nunca apagado.

---

### 4.5 FQ-05 — Preço da venda (PD-PRICE-FREEZE)

| Momento | Preço |
|---|---|
| Add item (Rascunho) | Copia catálogo → **congela** na linha |
| Orçamento / Pedido | Mantém freeze; botão “Atualizar do catálogo” (editável pré-confirm) |
| Confirmação | Usa preços da Sale (imutáveis depois) |
| Catálogo muda depois | Não altera Sales |
| Promoção futura | FUT — na cópia se existir |
| Desconto | Sobre preço da linha; auth policy |
| Margem | Estimativa com custo médio vigente no confirm (custo aplicado no movement) |
| Histórico | SaleItem snapshots + PriceHistory no catálogo |

---

## 5. FinancialEntry — reavaliação formal

### Respostas diretas

| # | Pergunta | Resposta proposta |
|---|---|---|
| 1 | Só contas a receber? | **Sim** no MVP (+ liquidações Payment). Sem AP/despesas. |
| 2 | Terá caixa? | **Visão de caixa recebimentos** derivada de Payments — não conta caixa bancária completa |
| 3 | Despesas manuais? | **Não** MVP |
| 4 | Payment gera FinancialEntry separada? | **Não** na Opção A |
| 5 | Saldo caixa confiável sem Entry? | **Sim** para “recebido líquido no período” = sum(payments)−sum(reversals). Não para caixa banco multi-conta |
| 6 | FinanceOverview depende de Entry? | **Não** se usar Payments |
| 7 | Central promete projeção financeira? | “A vencer / vencidos / recebido hoje” — **sim** via Receivable+Payment; não DRE |
| 8 | “Financeiro Básico” | AR + parcelas + pagamentos + estorno + visão a receber/recebido; sem GL, sem despesas, sem juros |

### Opções

| Opção | Descrição | Prós | Contras |
|---|---|---|---|
| **A** | Só Receivable+Payment | Simples; suficiente beachhead | “Caixa” limitado a recebimentos |
| **B** | FinancialEntry mínimo espelhando Payment (+ ajustes manuais caixa) | Expansão despesas fácil | Duplicação; risco divergência Payment↔Entry |
| **C** | Ledger financeiro completo | Contábil | Fora obsessão simplicidade; overkill MVP |

**Recomendação: A.** Esclarecer linguagem em MVP/DecisionCenter: “Recebido” / “A receber”, evitar “saldo de caixa bancário”.

---

## 6. Localização e estoque (PD-LOCATION)

| Pergunta | Proposta |
|---|---|
| Local padrão? | **Sim**, criado no onboarding |
| Escondido na UI? | **Sim** no MVP |
| Um estoque operacional? | **Sim** (um local) |
| Criar depósitos? | **Não** MVP |
| Transferências? | **Não** MVP |
| Saldo por variante+local? | **Sim** no modelo |
| Reservas por local? | **Sim** |
| Movements exigem local? | **Sim** (default preenchido) |

---

## 7. Unidades (PD-QTY-PREC + PD-UNIT-CONV)

| Tema | Proposta |
|---|---|
| Precisão máxima storage | 6 casas |
| Seeds | un=0, cx=0, kg=3, L=3, m=3 |
| Arredondamento qty | reject se exceder precision da unidade (não round silencioso na entrada) |
| Unidade base vs comercial | **Uma unidade por produto/variante no MVP** |
| Conversão cx↔un | **Fora MVP** |
| Venda kg | qty decimal com precision 3 |
| Caixa com múltiplas un | modelar como unidade “cx” **ou** vender un — sem fator automático MVP |

---

## 8. Descontos (PD-DISCOUNT)

| Tema | Proposta |
|---|---|
| % máx sem auth | **Policy** `max_percent_without_authorization` seed **5%** (não lei universal) |
| % máx absoluto | Policy `max_percent_absolute` seed 100% ou 50% (recomendar **50%** beachhead) |
| Exceder | requer `sales.discount.authorize` |
| Self-auth | `allow_self_authorization=false` |
| Motivo | obrigatório se > threshold policy |
| Item e/ou venda | ambos; invariante soma coerente no confirm |
| Arredondamento | half-up money scale 2 |
| Margem | estimativa informativa |
| Pós-confirm | **imutável** |
| Auditoria | DiscountAuthorization + AuditEvent |

---

## 9. Matriz cancelamento × estorno × devolução

Ver `CancellationMatrix.md`.

---

## 10. Máquinas de estado

Ver `StateMachineClosure.md` (transições sob propostas; sem novos estados sem significado — **sem PedidoExpirado**).
