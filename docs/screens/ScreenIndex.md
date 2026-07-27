---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / ScreenIndex
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Índice de Telas e Revisão Final

---

## 0. Identidade visual (obrigatório)

Toda tela deve passar no checklist de marca em `docs/design/DesignQA.md` §1 e `BrandIdentity.md` §12.

- Logo oficial imutável  
- Degradê só institucional (login/onboarding/splash)  
- Primary sólido no app  
- Loading/empty preferem Mark / BrandLoader  

---

## 1. Todas as telas

| # | Arquivo | Rota | Desktop-first? |
|---|---|---|---|
| 1 | Login.md | `/login` | — |
| 2 | Onboarding.md | `/onboarding` | — |
| 3 | CentralDecision.md | `/` | — |
| 4 | CustomersList.md | `/clientes` | — |
| 5 | CustomerDetail.md | `/clientes/:id` | — |
| 6 | CustomerCreate.md | `/clientes/novo` | — |
| 7 | ProductsList.md | `/produtos` | — |
| 8 | ProductDetail.md | `/produtos/:id` | variantes muitas: sim |
| 9 | ProductCreate.md | `/produtos/novo` | variantes: **sim** |
| 10 | InventoryOverview.md | `/estoque` | — |
| 11 | InventoryMovement.md | `/estoque/movimentos` | — |
| 12 | InventoryReservation.md | `/estoque/reservas` | — |
| 13 | SalesList.md | `/vendas` | — |
| 14 | SaleWizard.md | `/vendas/nova|:id/editar` | mobile limitado |
| 15 | SaleDetail.md | `/vendas/:id` | — |
| 16 | FinanceOverview.md | `/financeiro` | — |
| 17 | Receivables.md | `/financeiro/receber` | — |
| 18 | PaymentRegister.md | drawer/modal | — |
| 19 | Insights.md | `/insights` | — |
| 20 | ImportWizard.md | `/importacoes` | **sim** |
| 21 | Settings.md | `/config` | — |
| 22 | Profile.md | `/perfil` | — |
| 23 | Organization.md | `/config/empresa` | — |
| 24 | Users.md | `/config/membros` | — |
| 25 | RolesPermissions.md | `/config/permissoes` | — |
| 26 | Subscription.md | `/config/assinatura` | — |
| 27 | Audit.md | `/config/auditoria` | — |

Infra: README · NavigationMap · Flows · Permissions · SearchBehavior · ResponsiveBehavior · ScreenIndex.

---

## 2. Telas redundantes?

| Par | Veredito |
|---|---|
| FinanceOverview vs Receivables | Manter: overview = pulso; receivables = trabalho |
| Central vs Insights | Manter: teto vs lista completa |
| SaleWizard vs SaleDetail | Manter: edição vs leitura/timeline |
| InventoryOverview vs Movement | Manter: saldo vs ledger/ação |
| RolesPermissions vs Users | Manter: papéis vs pessoas |

Nenhuma tela sobra óbvia para apagar.

---

## 3. Unificações possíveis

| Ideia | Recomendação |
|---|---|
| CustomerCreate embutido em modal | OK se ≤ campos; full page também válido |
| PaymentRegister sempre drawer do Receivables/Sale | **Preferir** (já especificado) — não rota top-level obrigatória |
| Insights sem item nav | **Preferir** acesso via Central “Ver todos” para reduzir nav |
| Movement form como drawer do Overview | Opcional V1; MVP pode ser página |

---

## 4. Fluxos desnecessários

- Wizard fiscal no onboarding — fora  
- “Módulo Orçamentos” separado — proibido (FD-03)  
- Configuração de impostos — fora MVP  
- Dashboard builder — nunca  

---

## 5. Excesso de cliques (mitigações)

| Fluxo | Mitigação |
|---|---|
| Nova venda | ⌘K · botão lista · from cliente |
| Pagamento | CTA na row vencida · default valor=saldo |
| Repor estoque | CTA insight → Overview filtrado → Entrada |
| Confirmar | Um modal, não 3 checkboxes |

---

## 6. Confusões potenciais do usuário

| Risco | Mitigação UX |
|---|---|
| Três saldos | Destacar **disponível** |
| Orçamento vs Pedido | Chip + uma linha de ajuda + reserva só no Pedido |
| Snapshot cliente ≠ atual | Label “Na venda” vs “Cadastro atual” |
| Cancelar pago | Mensagem bloqueio/estorno (FQ-01) |
| Variante padrão | Esconder jargão se produto simples |

---

## 7. Inconsistências UX × domínio × arquitetura

| Item | Status |
|---|---|
| Termo Confirmada | Alinhado |
| Reserva ≠ movimento | Alinhado nas telas estoque/venda |
| Payment não boolean | Alinhado Receivables |
| Cancel+pagamento | **Depende FQ-01** |
| Estorno parcial | **FQ-02** |
| Devolução UI | **FQ-03** — tela dedicada não criada; se A, usar Movement tipo return |
| Preço rascunho | **FQ-05** — Wizard documenta freeze+sync |
| Negativo estoque | RN-34 vs H walkthrough — Organization policy UI |
| Money storage | OQ-05 — irrelevante à UX copy |

---

## 8. Simplificações propostas

1. Insights fora da sidebar (só Central).  
2. PaymentRegister sem rota própria.  
3. RolesPermissions read-only no MVP.  
4. Um local de estoque: ocultar seletor.  
5. Produto simples: zero UI de “variante”.  
6. Visão geral na Central colapsável default.

---

## 9. Telas que dependem de decisões futuras

| Decisão | Telas impactadas |
|---|---|
| FQ-01 Cancel após pago | SaleDetail |
| FQ-02 Estorno parcial | Receivables / Payment |
| FQ-03 Devolução | Movement (+ talvez Return futura) |
| FQ-04 Import conflito | ImportWizard |
| FQ-05 Preço rascunho | SaleWizard |
| FQ-06 Pedido sem reserva pós-TTL | SaleDetail / Reservation |
| OQ-08 Negativo default | Organization · SaleWizard |
| OQ-02 TTL default | Organization · Reservation |
| Billing provider | Subscription |

---

## Veredito

Blueprint **completo o suficiente para implementação de UI** alinhada ao domínio Quiet Instrument, desde que FQs críticos de venda/financeiro sejam respeitados como branches de UI documentados.
