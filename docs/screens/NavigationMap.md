# Mapa de Navegação

---

## 1. Shell

```
Sidebar: Central · Clientes · Produtos · Estoque · Vendas · Financeiro · Importar · Config
Topbar: Busca/⌘K · Org switcher · User menu
```

Itens sem permissão: **ocultos**. Org suspensa: escrita bloqueada, leitura conforme policy.

---

## 2. Fluxo principal (pós-login)

```mermaid
flowchart TD
  Login --> Gate{Onboarding completo?}
  Gate -->|Não| Onb[Onboarding]
  Gate -->|Sim| DC[Central de Decisão]
  Onb --> DC
  DC --> Ops[Módulos operacionais]
  Ops --> DC
```

---

## 3. Fluxo comercial

```mermaid
flowchart LR
  SL[Lista vendas] --> SW[SaleWizard]
  SW --> SD[SaleDetail]
  SD -->|Confirmar| SD
  SD -->|Cancelar| SD
  DC[Central] -->|CTA insight| SD
  CL[Cliente] --> SW
  PD[Produto] --> SW
```

Estados Sale na mesma identidade: Rascunho → Orçamento → Pedido → Confirmada → Cancelada (+ terminais).

---

## 4. Fluxo financeiro

```mermaid
flowchart LR
  FO[FinanceOverview] --> Rec[Receivables]
  Rec --> Pay[PaymentRegister]
  SD[Sale Confirmada] --> Rec
  DC[Central] -->|Vencidos| Rec
```

---

## 5. Fluxo estoque

```mermaid
flowchart LR
  IO[InventoryOverview] --> IM[Movement entrada/ajuste]
  IO --> IR[Reservations]
  SD[Pedido/Confirm] --> IR
  PD[ProductDetail] -->|Ver saldo| IO
```

---

## 6. Fluxo onboarding

```mermaid
flowchart TD
  A[Conta] --> B[Org + Owner]
  B --> C[Checklist]
  C --> D{Importar ou manual}
  D --> E[Primeira venda]
  E --> F[Central com pulso]
```

---

## 7. Deep links (exemplos)

| Link | Destino |
|---|---|
| `/vendas/:id` | SaleDetail |
| `/clientes/:id` | CustomerDetail |
| `/produtos/:id` | ProductDetail |
| `/financeiro/receber?status=vencido` | Receivables filtrado |
| `/insights/:id` | Insights com foco / abre origem |
| `/estoque?variant=:id` | Overview focado |

---

## 8. Atalhos globais

| Atalho | Ação |
|---|---|
| ⌘K / Ctrl+K | Command Palette |
| g then c | Clientes (opcional V1) |
| g then v | Vendas |
| n then v | Nova venda |

MVP: garantir ⌘K; demais atalhos progressivos.
