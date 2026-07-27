---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / InventoryOverview
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# InventoryOverview

## Objetivo
Ver saldos por variante com ênfase em **disponível**; agir (entrada, ajuste, ver reservas).

## Usuário
Operador estoque, owner.

## Frequência
Alta.

## Dados exibidos
Variante/produto · SKU · **disponível** (P0) · reservado · físico · mínimo · status alerta.  
Helper: “Disponível = físico − reservado”.  
Prioridade: disponível e busca; custo médio em disclosure/detalhe.

## Componentes
Header · Search · Filters (abaixo mínimo, controlados) · Table · Status/Alert Badge · Buttons Entrada · Link Reservas · Link Movimentos · Empty · Metric strip opcional (itens críticos count)

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Entrada | → Movement | inventory.move | não | — |
| Ajuste | → Movement adjust | inventory.adjust | motivo | — |
| Ver reservas | Reservation list | read | não | — |
| Abrir produto | ProductDetail | products.read | não | — |

## Estados
Loading · Empty (sem controlados) · Error · No permission · Offline · Dados insuficientes N/A · Alerta baixo

## Permissões
Leitura inventory; move/adjust conforme ação

## Navegação
Sidebar Estoque · Product “Ver saldo” · Central “Repor” · SaleDetail

## Eventos
Consome balances derivados; não produz ao só ver

## Regras
FD-02 saldos; InventoryModel; RN-34 policy; local padrão MVP

## Casos extremos
100k SKUs · físico < reserved (invariante violada — show error ops) · negativo policy · produto arquivado oculto

## Design QA
- [ ] Disponível em destaque
- [ ] Não parecer WMS
- [ ] Poucas colunas
- [ ] Parece Rescript? Verde = clareza, não “dinheiro”?
