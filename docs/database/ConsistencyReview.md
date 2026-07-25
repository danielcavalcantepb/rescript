# Revisão Cruzada de Consistência

> Conflitos e lacunas encontrados na modelagem lógica. **Nada resolvido em silêncio.**

---

## 1. Conflitos / tensões

### CR-01 — Estoque negativo “aberto” vs RN-34
- **Documentos:** briefing OQ-08; `BusinessRules.md` RN-34; `FounderDecisions` não reabre.
- **Tensão:** OQ lista como aberta; RN-34 já define padrão allow_with_alert.
- **Proposta:** Tratar **política configurável** como decidida (RN-34); OQ-08 só se fundador quiser mudar o default. Precedência: BusinessRules < FounderDecisions — FD não contradiz RN-34.
- **Status:** Aguardando confirmação se OQ-08 ainda precisa de voto ou está fechada por RN-34.

### CR-02 — “Pago” / situações financeiras em docs antigos
- **Documentos:** alguns textos estratégicos ainda podem dizer “pendente/pago” simplificado.
- **Proposta:** Modelo lógico usa Receivable/Installment/Payment; glossários oficiais prevalecem.
- **Status:** Mitigado nos docs principais; varrer resquícios em fase contínua.

### CR-03 — Financial ledger completo vs Payments
- **Documentos:** architecture FinancialArchitecture (ledger) vs proporcionalidade MVP.
- **Proposta:** MVP = Payment + Allocation como liquidação; ledger GL opcional futuro. Não contradiz entidades separadas.
- **Status:** Resolução proposta adotada no modelo lógico; validar com fundador se quiser GL já no MVP (não recomendado).

### CR-04 — Average cost por local vs “por variante” (FD-01)
- **Documentos:** FD-01 diz “por variante”; multi-local introduz dimensão location.
- **Proposta:** Interpretar como por variante **dentro do local** (com 1 local = equivalente). Registrar em OQ-09.
- **Status:** Aberto formalmente.

### CR-05 — InterestPolicy V1 vs campos no receivable
- **Proposta:** Não criar colunas de juros no MVP; fronteira documentada.
- **Status:** Alinhado FD-04.

---

## 2. Requisitos sem representação? (checklist)

| Requisito | Representado? |
|---|---|
| Multi-org / multi-membership | sim Identity |
| Reserva MVP | sim Reservation |
| Sale sem Order | sim SaleModel |
| Custo médio | sim AverageCost |
| Desconto auth | sim Discount |
| Insights rastreáveis | sim Insight |
| Outbox | sim |
| Idempotência | IdempotencyRecord + keys |
| Variante padrão | sim Variant |
| BRL + currency | Money + Org.currency |
| Fiscal substituível | FiscalBoundary V1 |
| Suporte controlado | SupportAccessGrant |

---

## 3. Entidades sem requisito forte (candidatas a não prematurar)

| Estrutura | Ação |
|---|---|
| InventoryCount | FUT — só fronteira |
| FinancialCashMovement GL | FUT |
| PriceList | FUT |
| Custom Role | FUT (system roles MVP) |
| SaleAdjustment genérico | evitar; usar cancel/discount |

---

## 4. Riscos apontados

| Risco | Mitigação no modelo |
|---|---|
| Vazamento multi-tenant | organization_id + C-TENANT-01 + RLSMatrix |
| Movimento mutável | append-only |
| Derivado como FT | DerivedData + reconcile |
| Tabela EAV settings | OrganizationPolicy tipada |
| Sale god-table | snapshots + serviços; inventory/receivable separados |
| Enum demais / de menos | StateCatalog |
| Dependência circular Sale↔Inventory | coordenação via ops; FKs sale←reservation |

---

## 5. Abstrações evitadas
- Event sourcing universal
- Order aggregate
- Contabilidade completa
- Multi-currency FX
- Soft delete universal

---

## 6. Conclusão da revisão
Modelo lógico **coerente** com FD-01…08 e ADRs, com **OQs explícitas** e tensões CR-01/CR-04 abertas para o fundador. Pronto para schema físico **após** fechar OQs prioritárias.

---

## 7. Revisão cruzada — pacote de validação (pós UX Blueprint)

Validado contra DDD, Architecture, BusinessRules, UX screens, FounderDecisions, ADRs, walkthrough FQs.

| Checagem | Resultado |
|---|---|
| UX “Confirmada” / saldos / Sale único | alinhado ao modelo |
| FinancialEntry no briefing Sale | esclarecido como **FUT**; MVP = Payment (`Ledger.md`) |
| Idempotency request_hash | exigido em `Idempotency.md` (WT-14) |
| Devolução / cancel pago / estorno parcial | ainda FQ — não modelar como decidido |
| Checklist 10 perguntas | `ValidationChecklist.md` |

Nenhuma correção silenciosa de FD/ADR. Documentos novos do pacote de validação **complementam** os `*Model.md` aprovados.
