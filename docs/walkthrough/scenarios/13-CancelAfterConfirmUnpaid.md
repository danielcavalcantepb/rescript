# Cenário 13 — Cancelar Após Confirmar (Não Pago)

## Cenário

Venda confirmada a prazo, sem pagamentos; cancelamento gera estorno compensatório de estoque, cancela recebível, preserva histórico; custo da saída original permanece imutável.

### Objetivo
Validar T9, RN-33, RN-46, I6, I7, R8, X2.

### Atores
- Gerente (`sales.cancel`)
- SaleCancellationService

### Estado inicial
Sale Confirmada total R$ 1.000; Receivable EmAberto 1 parcela; saída qty=10 com custo aplicado R$ 6/un gravado; físico pós-venda=40.

### Pré-condições
- Nenhum Payment registrado
- Permissão cancelamento + motivo obrigatório

### Passos executados

#### 1. CancelSale
1. **Comando:** `CancelSale` (Confirmada → Cancelada)
2. **Autorização:** `sales.cancel`
3. **Validações:** Confirmada; recebível sem pagamentos confirmados; motivo informado
4. **Consultadas:** Sale, SaleItems, movimentos saída originais, Receivable, Payments (empty)
5. **Criadas:** InventoryMovement tipo **estorno/compensação** (+10 qty); AuditEntry; outbox events
6. **Alteradas:** Sale→Cancelada; Receivable→Cancelado; físico 40→50; **saída original intacta** (I6)
7. **Locks:** sale row; receivable; balance variant
8. **Auditoria:** quem, quando, motivo (RN-46)
9. **Eventos:** `SaleCancelled`, movimento estorno, `ReceivableCanceled`
10. **Outbox:** insights atualizados (assíncrono)
11. **Derivados:** margem histórica preservada nos movimentos; caixa inalterado (sem pagamento)
12. **Insight:** venda cancelada no período (relatório)
13. **Falha:** tentar editar custo da saída original → proibido FD-01
14. **Recuperação:** n/a — cancelamento irreversível

#### 2. Verificar imutabilidade de custo histórico
1. **Comando:** query movimentos
2. **Autorização:** audit.read
3. **Validações:** saída original custo_unit=6 imutável; estorno referencia movimento origem (FD-01 regra 5)
4. **Consultadas:** InventoryMovement ledger
5. **Criadas:** nenhuma
6. **Alteradas:** nenhuma
7–14. Pass se compensação traz custo coerente (mesmo custo aplicado ou política explícita de estorno)

#### 3. Histórico comercial preservado
1. **Comando:** listar vendas do cliente
2. **Autorização:** sales.read
3. **Validações:** G2 — Sale Cancelada visível no histórico; não apagada (RN-04)
4. **Consultadas:** Sale history
5–14. Cliente histórico intacto (RN-12)

### Estado final esperado
Sale Cancelada; recebível Cancelado; físico restaurado; ledger com saída + estorno; nenhum pagamento; histórico completo.

### Invariantes verificadas
G2, I6, I7, R8, X2, RN-33, RN-46; "pago" derivado permanece falso.

### Inconsistências encontradas
- Custo no movimento compensatório: FD-01 regra 5 diz custo do original — detalhe de sinal/quantidade no ledger deve estar fechado em ADR-0005.
- Cancelamento fiscal desacoplado (StateMachines) — ok MVP.

### Ajustes recomendados
- Teste de cancelamento parcial (não no MVP?) — fora escopo; cancelamento é total da Sale.
- Relatório de margem deve excluir ou marcar vendas canceladas (RN-64).

### Classificação
**aprovado**
