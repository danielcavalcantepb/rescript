# Checklist de Validação do Modelo Lógico

---

## Respostas

### 1. Entidades redundantes?
**Não estruturais.** `FinancialEntry` vs `Payment`: Entry é FUT — não duplicar no MVP. `OrganizationSetting` vs `OrganizationPolicy`: namespaces diferentes (ok). Decision Center sem tabela própria (ok).

### 2. Atributos redundantes?
Totais Sale materializados + recalculáveis: aceitável se regra clara. `available` materializado + fórmula: reconciliação necessária (`DerivedData`). Evitar `paid boolean`.

### 3. Relacionamentos desnecessários?
Sale→Insight só por referência opaca em source_refs — sem FK rígida obrigatória. Ok.

### 4. Acoplamento excessivo?
Sale não compõe Movements (referência por source) — **bom**. Fiscal desacoplado — **bom**. Risco: CancelSale orquestrar Payment (FQ-01) aumenta acoplamento de OP, não de schema.

### 5. Entidade grande demais?
Sale raiz com snapshots/json — monitorar; itens e descontos separados mitiga. Evitar god-table com colunas fiscais/financeiras densas.

### 6. Agregados violando fronteiras?
Reservation no inventory referenciando Sale — aceitável. Confirm coordena 2–3 agregados na mesma TX (padrão arquitetural ADR sale atomicity) — documentado, não é violação silenciosa.

### 7. Consultas críticas sem índice?
Cobertas em `Indexes.md` (vendas, vencidos, saldo, outbox, expire). Search full-text: FUT.

### 8. Decisão que dificulta escala?
Append-only movements/audit crescem — partição futura prevista. RLS por org escala com índices compostos. JSON snapshots: ok MVP.

### 9. Regra de negócio depende de SQL específico?
**Não.** Regras são de domínio; PG é alvo, funções são opcionais.

### 10. Decisão impede evolução?
FD-03 Sale único: Order extraiível depois (OQ-06). Avg cost por local (OQ-09) evita migração dolorosa se multi-local. Money OQ-05 deve fechar antes do físico.

---

## Inconsistências ainda abertas (não silenciadas)

| ID | Tema | Docs |
|---|---|---|
| OQ-05 | Money storage | OpenQuestions |
| OQ-09 / CR-04 | Avg cost key | FD-01 wording |
| OQ-08 / CR-01 | Negativo default | RN-34 |
| FQ-01 | Cancel após pago | walkthrough |
| FQ-02 | Estorno parcial | PaymentsModel status |
| FQ-03 | Devolução financeira | MVP vs Commands |
| WT-14 | request_hash idempotency | Idempotency.md |

---

## Veredito

Modelo lógico **válido para avançar a schema físico após fechar OQs/FQs bloqueantes**. Sem remodelagem de agregados.
