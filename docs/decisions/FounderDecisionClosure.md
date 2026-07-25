# Fechamento de Decisões do Fundador

> Status nesta etapa: **todas PROPOSTA**.  
> Não marcar APROVADA sem voto explícito do fundador.  
> IDs estáveis para referência cruzada.

---

## Como usar

Para cada item abaixo, o fundador responde: **APROVAR** / **REJEITAR** / **ALTERAR** / **ADIAR**.

---

## BLOQUEADORES DO SCHEMA

### FDC-01 — Money storage
- **Status:** PROPOSTA  
- **Decisão:** Persistir Money como **NUMERIC decimal** (recom. precisão interna até 6; display/round BRL scale 2 half-up). Proibido float.  
- **Justificativa:** evolução multi-moeda; rateios; alinhado FD-07.  
- **Rejeitadas:** cents-only como única representação.  
- **Impacto:** colunas amount; checks; PD-ROUND-MONEY.  
- **Trade-off:** disciplina de arredondamento.  
- **Gatilho revisão:** multi-currency FX.

### FDC-02 — Custo médio por local
- **Status:** PROPOSTA  
- **Decisão:** Average cost key = `(organization_id, stock_location_id, variant_id)`. Esclarecer FD-01 como “por variante no escopo do local”.  
- **Rejeitadas:** só (org, variant) se multi-local existir no modelo.  
- **Gatilho:** PEPS / método alternativo.

### FDC-03 — Localização MVP
- **Status:** PROPOSTA  
- **Decisão:** 1 StockLocation “Principal” automático; **oculto na UI**; todos saldos/reservas/movimentos com location_id; sem criar depósitos; sem transferência.  
- **Trade-off:** modelo pronto; UX simples.

### FDC-04 — Cancelamento após pagamento
- **Status:** PROPOSTA  
- **Decisão:** CancelSale **bloqueado** enquanto pagamento líquido > 0. Exigir estorno(s) total(is) antes. Opcional: comando composto “Estornar e cancelar” atômico. Fiscal independente (V1). Entrega não modelada.  
- **Rejeitadas:** cancelar deixando payment “crédito” sem estorno (opção C).  
- **Gatilho:** gateway automático de chargeback.

### FDC-05 — Estorno parcial
- **Status:** PROPOSTA  
- **Decisão:** MVP permite apenas **estorno integral por Payment**. `partially_reversed` sem UX (V1). Proibido estorno > líquido.  
- **Rejeitadas:** parcial no MVP.

### FDC-06 — Devolução MVP
- **Status:** PROPOSTA  
- **Decisão:** Devolução de item = `InventoryMovement` tipo return ligado à Sale (FD-01.4). Financeiro = ReversePayment separado. Sem entidade Refund, crédito, troca, avariado. Permissão `sales.return` ou `inventory.return`. Emendar MVP.md.  
- **Rejeitadas:** OP-Return monólito; adiar devolução estoque (contradiz MVP).

### FDC-07 — FinancialEntry / Caixa
- **Status:** PROPOSTA  
- **Decisão:** **Opção A** — sem tabela FinancialEntry no MVP. Caixa/recebido = derivado de Payment±reversal. Sem despesas manuais. Esclarecer copy “Financeiro básico” / Central.  
- **Rejeitadas:** B (Entry mínimo) e C (GL) para MVP.  
- **Gatilho:** módulo despesas / contas bancárias.

### FDC-08 — Idempotency request_hash
- **Status:** PROPOSTA  
- **Decisão:** IdempotencyRecord inclui `request_hash` obrigatório; mismatch → rejeita.

### FDC-09 — Precisão Quantity + arredondamento
- **Status:** PROPOSTA  
- **Decisão:** precision por UnitOfMeasure (seeds: un/cx=0; kg/L/m=3); storage até 6; input rejeita excesso de casas; Money line/total half-up scale 2 BRL.  
- **Sem** conversão de unidades no MVP (FDC-16).

---

## IMPORTANTES

### FDC-10 — Estoque negativo default
- **Status:** PROPOSTA  
- **Decisão:** Ratificar RN-34 — default `allow_with_alert`; configurável `block`.

### FDC-11 — TTL reserva
- **Status:** PROPOSTA  
- **Decisão:** Default 72h para reservas de Pedido; OrganizationPolicy; não reescreve reservas existentes (RN-92).

### FDC-12 — Orçamento não reserva
- **Status:** PROPOSTA  
- **Decisão:** Default quote_reserves=false.

### FDC-13 — Política de desconto
- **Status:** PROPOSTA  
- **Decisão:** Tudo via OrganizationPolicy + permissions. Seeds: max_without_auth=5%; max_absolute=50%; allow_self_authorization=false; motivo obrigatório acima do threshold. Item e header permitidos; pós-confirm imutável.

### FDC-14 — Freeze de preço
- **Status:** PROPOSTA  
- **Decisão:** Preço congela ao adicionar item; “Atualizar do catálogo” manual; confirm usa Sale; histórico em snapshots.

### FDC-15 — Import conflito + rollback
- **Status:** PROPOSTA  
- **Decisão:** Conflito default **skip** + relatório; update opt-in. **Sem rollback destrutivo** pós-commit; staging descartável; registros em uso → arquivar/compensar, nunca apagar histórico.

### FDC-16 — Conversão de unidades
- **Status:** PROPOSTA  
- **Decisão:** **Fora do MVP.** Qty decimal ≠ conversão. Uma unidade por produto/variante.

### FDC-17 — Pedido após expire reserva
- **Status:** PROPOSTA  
- **Decisão:** Sem status PedidoExpirado. Pedido permanece; Reservation expired; Confirm revalida/cria reserva ou falha.

### FDC-18 — TransferOwnership
- **Status:** PROPOSTA  
- **Decisão:** Atômico se destino já é member; nunca 0 owners.

### FDC-19 — Confirm sem reservation row
- **Status:** PROPOSTA  
- **Decisão:** Permitido: lock balance + check available + exit; Reservation só se já existia (Pedido).

### FDC-20 — Avg cost physical=0
- **Status:** PROPOSTA  
- **Decisão:** qty_before=0 ⇒ novo avg = custo da entrada (null se entrada sem custo).

### FDC-21 — Archive / Adjust vs reserva
- **Status:** PROPOSTA  
- **Decisão:** Bloquear archive variant se reserved>0; bloquear adjust se physical′ < reserved.

### FDC-22 — Attr imutável pós-movimento
- **Status:** PROPOSTA  
- **Decisão:** Formalizar RN: combination_hash/atributos da variante imutáveis após primeiro InventoryMovement.

---

## ADIADAS (explícitas)

### FDC-A01 — Extrair Order (OQ-06)
- **Status:** PROPOSTA (adiada)  
- **Decisão:** Manter Sale único até gatilhos FD-03.

### FDC-A02 — Provedores (OQ-07)
- **Status:** PROPOSTA (adiada)  
- **Decisão:** Não escolher agora.

### FDC-A03 — Juros/multa
- **Status:** PROPOSTA (confirmada por FD-04 — manter fora MVP)  
- **Decisão:** Fora MVP; V1.

### FDC-A04 — Crédito cliente / Refund entity / Troca / Avariado / Despesas / GL
- **Status:** PROPOSTA (adiada)  
- **Decisão:** Fora MVP.

---

## Lista objetiva para o fundador votar

| # | ID | Pergunta em uma linha | Sugestão |
|---|---|---|---|
| 1 | FDC-01 | Money = NUMERIC decimal? | Sim |
| 2 | FDC-02 | Custo médio por local+variante? | Sim |
| 3 | FDC-03 | 1 local oculto no MVP? | Sim |
| 4 | FDC-04 | Cancel pago só após estorno total? | Sim |
| 5 | FDC-05 | Sem estorno parcial no MVP? | Sim |
| 6 | FDC-06 | Devolução = return stock + estorno manual? | Sim |
| 7 | FDC-07 | Sem FinancialEntry; caixa derivado de Payment? | Sim |
| 8 | FDC-08 | request_hash obrigatório? | Sim |
| 9 | FDC-09 | Precisions seed un=0 kg=3 + round money 2? | Sim |
| 10 | FDC-10 | Default negativo = allow_with_alert (RN-34)? | Sim |
| 11 | FDC-11 | TTL reserva 72h? | Sim |
| 12 | FDC-12 | Orçamento não reserva? | Sim |
| 13 | FDC-13 | Desconto seed 5%/50%/no self-auth? | Sim |
| 14 | FDC-14 | Freeze preço + sync manual? | Sim |
| 15 | FDC-15 | Import skip; sem rollback destrutivo? | Sim |
| 16 | FDC-16 | Sem conversão unidades MVP? | Sim |
| 17 | FDC-17 | Sem PedidoExpirado? | Sim |
| 18 | FDC-18–22 | Pacote invariantes (ownership, confirm, avg0, archive, attr)? | Sim |
| 19 | FDC-A01–A04 | Adiar Order/providers/crédito/GL? | Sim |
