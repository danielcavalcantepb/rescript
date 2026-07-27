---
Status: Active
Owner: Domain Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: domain / Terminology
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Terminologia e Convenções

> Decisões de nomenclatura do domínio: o termo oficial, o que evitar, e como nomeamos entidades, eventos, comandos e estados. Resolve as ambiguidades apontadas nas fases anteriores.
> Status: Modelagem conceitual (DDD). Referência rápida em `Glossary.md`; linguagem por contexto em `UbiquitousLanguage.md`.

---

## 1. Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
|---|---|---|
| **Entidade** | Substantivo singular | `Sale`, `Customer`, `InventoryItem` |
| **Value Object** | Substantivo do conceito | `Money`, `Quantity`, `Document` |
| **Agregado** | Nome da raiz | Agregado `Sale` |
| **Comando** | Verbo imperativo | `ConfirmSale`, `RegisterPayment` |
| **Evento** | Fato no passado | `SaleConfirmed`, `PaymentRegistered` |
| **Serviço de domínio** | `...Service` (verbo+objeto) | `SaleConfirmationService` |
| **Política** | `...Policy` | `NegativeStockPolicy` |
| **Estado** | Adjetivo/particípio | `Confirmada`, `Vencida`, `EmAberto` |
| **Permissão** | `recurso.ação` | `sales.confirm`, `inventory.adjust` |

- **Nomes de modelo em inglês** (código); **linguagem de negócio/UX em português** (interface e docs de produto). Ex.: entidade `Sale` ↔ termo de negócio "Venda".
- Nomes **genéricos e agnósticos de segmento** (nada exclusivo de "distribuidora").

---

## 2. Termos Oficiais (decisões que resolvem inconsistências)

| Conceito | Termo OFICIAL | Termos a evitar | Racional |
|---|---|---|---|
| Venda efetivada | **Confirmada** (`Confirmed`) | "Concluída", "Finalizada", "Fechada" | Alinha com o comando `ConfirmSale`; resolve conflito com `docs/BusinessRules.md` RN-43 |
| Unidade de estoque | **ProductVariant** (variante única quando não há variação) | "saldo por produto" | Resolve saldo produto × variante |
| Recebimento | **Payment / Registrar Recebimento** | "baixa de título" | Linguagem do dono, não bancária |
| Direito de receber | **Receivable (Recebível)** | "conta", "título" (evitar como sinônimo solto) | Clareza |
| Situação de pagamento | **derivada** ("em aberto/parcial/paga") | "flag pago" | "Pago" nunca é booleano |
| Anular venda | **Cancelar** (compensação) | "excluir/deletar venda" | Nunca destruímos histórico |
| Corrigir estoque | **Ajustar** (com motivo) | "editar saldo" | Ajuste é auditável e rastreável |
| Empresa cliente | **Organization (Organização)** | "conta", "tenant" (uso interno técnico apenas) | Termo de negócio |
| Interpretação | **Insight** | "alerta genérico", "notificação" | Insight tem rastreabilidade; notificação é entrega |

---

## 3. Tipos de Movimento de Estoque (vocabulário ampliado)

Ampliação consciente de `docs/BusinessRules.md` RN-31 (que citava só entrada/saída/ajuste):

| Movimento (InventoryMovement — físico) | Significado |
|---|---|
| **Entrada** | Aumenta o físico |
| **Saída** | Reduz o físico (venda confirmada, perda) |
| **Ajuste +/−** | Corrige o físico com motivo |
| **Devolução** | Entrada rastreável de cliente |
| **Estorno** | Compensa movimento anterior |

> **Reserva / liberação** não são tipos de InventoryMovement — pertencem à entidade **Reservation**.

---

## 4. Naming de Estados por Entidade (oficial)

| Entidade | Estados oficiais |
|---|---|
| Sale | Rascunho · Confirmada · Cancelada |
| Sale | Rascunho · Orçamento · Pedido · Confirmada · Cancelada · Descartada · OrçamentoRecusado · OrçamentoExpirado · PedidoCancelado |
| Receivable | EmAberto · ParcialmenteRecebido · Quitado · Cancelado |
| Reservation | Ativa · Consumida · Liberada · Expirada · Cancelada |
| Installment | EmAberto · ParcialmentePaga · Paga · Vencida · Cancelada |
| Payment | Registrado · Estornado |
| Insight | Ativo · Dispensado · Resolvido · Expirado |
| ImportJob | Enviado · Validado · Processando · Concluído · Parcial · Falho · Revertido |
| Invite | Pendente · Aceito · Recusado · Expirado · Revogado |
| Subscription | Trial · Ativa · Inadimplente · Suspensa · Cancelada |
| Organization | Ativa · Suspensa · Cancelada · Anonimizada |
| FiscalDocument | Pendente · Processando · Autorizado · Rejeitado · Cancelado |

---

## 5. Palavras proibidas no domínio

| Não usar | Usar | Motivo |
|---|---|---|
| deletar / excluir (venda/recebível/movimento) | cancelar / estornar / inativar | Histórico é permanente (G2) |
| flag / booleano "pago" | situação derivada | "Pago" é calculado |
| tabela / coluna / registro do banco | entidade / value object | Modelamos negócio, não banco |
| título / boleto (como sinônimo de recebível) | recebível / parcela | Boleto é forma; recebível é o direito |
| venda concluída/finalizada | venda **confirmada** | Termo oficial |
| dashboard (como produto) | Central de Decisão | Não é BI |

---

## 6. Regra de evolução da terminologia

Ao descobrir um conceito novo: **nomeá-lo**, adicionar em `Glossary.md` e `UbiquitousLanguage.md`, e — se resolver/gerar ambiguidade — registrar a decisão aqui. Um termo sem definição compartilhada é uma fonte de bug de comunicação.
