---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 06-QuoteWithoutReservation
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 06 — Orçamento sem Reserva

## Cenário

Rascunho promovido a Orçamento **sem reserva de estoque** (política); validade definida; recusa e expiração liberam nada físico; zero efeito financeiro.

### Objetivo
Validar fase Orçamento (RN-43), **HYPOTHESIS:** quote não reserva por default; garantir ausência de efeitos físico/financeiros.

### Atores
- Vendedor
- Cliente (recusa externa)
- Job de expiração (sistema)

### Estado inicial
Sale em Rascunho com itens válidos; OrganizationSettings.quote_reserves=false (**HYPOTHESIS** — ReservationModel OQ-03); estoque disponível conhecido (ex.: 20 un).

### Pré-condições
- `sales.edit` para emitir orçamento
- Itens e cliente conforme política

### Passos executados

#### 1. Emitir orçamento
1. **Comando:** `QuoteSale` (Rascunho → Orçamento, validade=7 dias)
2. **Autorização:** `sales.edit`
3. **Validações:** itens válidos; validade futura; **sem criação de Reservation** se quote_reserves=false
4. **Consultadas:** Sale, OrganizationSettings, saldos (informativo apenas)
5. **Criadas:** campos quote_valid_until; nenhuma Reservation
6. **Alteradas:** Sale.status=Orçamento
7. **Locks:** status gate + version
8. **Auditoria:** emissão de orçamento
9. **Eventos:** `SaleQuoted`
10. **Outbox:** nenhum crítico síncrono
11. **Derivados:** nenhum change em físico/reservado/disponível
12. **Insight:** orçamento pendente (futuro)
13. **Falha:** sem itens
14. **Recuperação:** completar rascunho

#### 2. Verificar ausência de efeitos
1. **Comando:** query saldos e financeiro
2. **Autorização:** read scopes
3. **Validações:** I3 inalterado; nenhum Receivable
4. **Consultadas:** InventoryItem, Receivable por sale_id
5. **Criadas:** nenhuma
6. **Alteradas:** nenhuma
7. **Locks:** nenhum
8. **Auditoria:** n/a
9. **Eventos:** nenhum
10. **Outbox:** n/a
11. **Derivados:** disponível permanece 20
12. **Insight:** nenhum
13. **Falha:** se reserva criada erroneamente → bug grave
14. **Recuperação:** liberar reserva órfã

#### 3. Recusar orçamento
1. **Comando:** `RejectQuote` (Orçamento → OrçamentoRecusado)
2. **Autorização:** `sales.edit`
3. **Validações:** estado=Orçamento ativo
4. **Consultadas:** Sale
5. **Criadas:** nenhuma
6. **Alteradas:** status terminal; libera reserva **se existisse** (n/a aqui)
7. **Locks:** status gate
8. **Auditoria:** motivo recusa
9. **Eventos:** `SaleQuoteRejected`
10. **Outbox:** nenhum
11. **Derivados:** nenhum financeiro
12. **Insight:** nenhum
13. **Falha:** n/a
14. **Recuperação:** n/a

#### 4. Orçamento expirado (caminho alternativo em outra Sale)
1. **Comando:** job `ExpireQuotes` → OrçamentoExpirado
2. **Autorização:** sistema
3. **Validações:** now > valid_until; idempotente
4. **Consultadas:** Sales Orçamento vencidas
5. **Criadas:** nenhuma
6. **Alteradas:** status=OrçamentoExpirado; libera reservas se houver
7. **Locks:** por sale_id
8. **Auditoria:** expiração automática
9. **Eventos:** `SaleQuoteExpired`
10. **Outbox:** notificação opcional
11. **Derivados:** nenhum movimento físico
12. **Insight:** orçamentos expirados
13. **Falha:** reprocessar job → no-op
14. **Recuperação:** novo orçamento = nova Sale ou reabrir se política permitir (T5)

### Estado final esperado
Orçamentos terminais sem Reservation; saldos físico/reservado/disponível idênticos ao inicial; zero Receivable/Payment.

### Invariantes verificadas
I4 (nenhuma reserva criada), S8, G6, RN-43; orçamento não gera financeiro (StateMachines).

### Inconsistências encontradas
- **HYPOTHESIS** quote_reserves=false conflita com StateMachines T3 "reserva conforme política" — ok, mas OQ-03 não fechado oficialmente; default org não documentado em FounderDecisions.
- Orçamento sem reserva permite oversell se outro pedido reserva o mesmo disponível — trade-off B2B consciente.

### Ajustes recomendados
- Fechar OQ-03: default quote_reserves=false para simulação; documentar em OrganizationSettings.
- Insight "orçamento sem estoque garantido" quando quote_reserves=false.

### Classificação
**aprovado com ressalvas**
