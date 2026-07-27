---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / Flows
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Fluxos Transversais (Blueprint)

> Detalhe de tela em arquivos individuais. Aqui: orquestração.

---

## 1. Venda (máquina completa)

```
Rascunho ──emitir──► Orçamento ──aceitar──► Pedido ──confirmar──► Confirmada
    │                   │                      │                      │
    descartar           recusar/expirar        cancelar pedido         cancelar
    ▼                   ▼                      ▼                      ▼
 Descarta          Orç.Recusado/Exp.     PedidoCancelado          Cancelada
```

| Estado | Ações UI primárias | Estoque | Financeiro |
|---|---|---|---|
| Rascunho | Salvar · Emitir orçamento · Ir a pedido · Confirmar · Descartar | — | — |
| Orçamento | Converter pedido · Confirmar · Recusar · Reabrir · (expira job) | sem reserva (padrão) | — |
| Pedido | Confirmar · Cancelar pedido | **reserva** | — |
| Confirmada | Registrar pagamento · Cancelar (regras) | saída feita | recebível |
| Cancelada / terminais | Somente leitura (+ links) | compensado se aplicável | tratado |

**Botões (copy):** ver `SaleWizard.md` / `SaleDetail.md` e `docs/design/UXWriting.md`.

**Confirmar:** modal resumo → OP-ConfirmSale (reserva consumida, saída, custo, recebível, pagamento opcional, outbox).

**Mensagens-chave:**
- Insuficiente disponível → bloquear ou alertar (RN-34 / OQ-08)
- Desconto acima do limite → autorização
- Pós-pagamento cancel → bloquear ou orquestrar (FQ-01)

**Timeline:** SaleStatusHistory + movimentos + pagamentos no SaleDetail.

---

## 2. Importação

```
Upload → Mapear → Preview/Validar → Resumo → Commit → Relatório erros
                                      ↑ reexecução idempotente
```

Rollback físico completo: **não** no MVP (documentar “compensa manualmente / não desfaz auto”). Histórico do job permanece.

---

## 3. Onboarding

Conta → Org → seeds (local, unidades, policies) → checklist (cliente, produto, estoque, venda) → Central.

---

## 4. Pagamento

Receivable → selecionar parcela → PaymentRegister → alocação → estados derivados (parcial/quitado).

---

## 5. Insight → ação

Central/Insights → CTA → tela operacional (estoque/receber/venda) → ao resolver, insight status atualiza (job ou optimistic dismiss).
