---
Status: Active
Owner: Domain Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: domain / Entities
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Entidades

> Objetos com **identidade** e **ciclo de vida**. Cada ficha responde às 13 perguntas do briefing.
> Status: Modelagem conceitual (DDD). Agregados e raízes em `Aggregates.md`; estados em `StateMachines.md`.

---

## Como ler a ficha

Cada entidade responde: **Representa · Cria · Altera · Exclui · Consome · Ciclo de vida · Estados · Invariantes · Eventos produzidos · Eventos consumidos · Dependências · Responsabilidades · Nunca deve conhecer.**

"Exclui" quase sempre é **inativação/anonimização**, nunca exclusão física (princípio de não destruir histórico). Onde não há exclusão, dizemos "não se exclui".

---

# Contexto: Identity & Access

## User (Usuário)
- **Representa:** uma pessoa com identidade única na plataforma.
- **Cria:** auto-registro ou convite aceito.
- **Altera:** o próprio usuário (dados de perfil); provedor de identidade (credenciais).
- **Exclui:** não se exclui; pode ser desativado/anonimizado (LGPD).
- **Consome:** Membership, Session, Audit.
- **Ciclo de vida:** registrado → ativo → (desativado/anonimizado).
- **Estados:** ativo, inativo.
- **Invariantes:** e-mail único; não carrega papéis nem organização.
- **Eventos produzidos:** `UserRegistered`, `UserDeactivated`.
- **Eventos consumidos:** —
- **Dependências:** provedor de identidade (via ACL).
- **Responsabilidades:** ser a âncora de identidade da pessoa.
- **Nunca deve conhecer:** vendas, estoque, dinheiro, papéis de uma empresa específica (isso é Membership).

---

# Contexto: Tenancy & Organizations

## Organization (Organização / Empresa)
- **Representa:** a empresa cliente (tenant).
- **Cria:** um User no onboarding (torna-se proprietário).
- **Altera:** Proprietário/Administrador.
- **Exclui:** não se exclui; suspende/cancela; dados retidos e depois anonimizados (`architecture/Privacy.md`).
- **Consome:** todo o núcleo referencia a organização.
- **Ciclo de vida:** criada → ativa → (suspensa) → (cancelada).
- **Estados:** ativa, suspensa, cancelada.
- **Invariantes:** sempre tem exatamente um proprietário; suspensão bloqueia operação sem apagar dados.
- **Eventos produzidos:** `OrganizationCreated`, `OrganizationSuspended`, `OrganizationCanceled`, `OwnershipTransferred`.
- **Eventos consumidos:** `SubscriptionCanceled` (pode levar à suspensão).
- **Dependências:** —
- **Responsabilidades:** ser a fronteira de isolamento de todos os dados.
- **Nunca deve conhecer:** detalhes operacionais internos (vendas específicas).

## Membership (Vínculo)
- **Representa:** a relação de uma pessoa com uma organização, com papéis e status.
- **Cria:** aceite de convite; criação da organização (proprietário).
- **Altera:** Proprietário/Administrador (papéis); o próprio sistema (status).
- **Exclui:** removido (status), nunca apagado (mantém histórico de quem operou).
- **Consome:** Authorization, Audit, todo o núcleo (para saber quem opera).
- **Ciclo de vida:** convidado → ativo → (removido).
- **Estados:** convidado, ativo, suspenso, removido.
- **Invariantes:** papéis existem só aqui; remover revoga acesso imediatamente; não pode haver membership ativa sem organização ativa.
- **Eventos produzidos:** `MemberJoined`, `MemberRoleChanged`, `MemberRemoved`.
- **Eventos consumidos:** `InviteAccepted`.
- **Dependências:** User, Organization, Role.
- **Responsabilidades:** ser a fonte de verdade de "quem pode operar nesta empresa".
- **Nunca deve conhecer:** dados de outras organizações.

## Invite (Convite)
- **Representa:** oferta pendente para uma pessoa se vincular a uma organização.
- **Cria:** Proprietário/Administrador.
- **Altera:** sistema (estado); quem convida (revogar).
- **Exclui:** não se exclui; expira/revoga/consome.
- **Consome:** Membership (ao aceitar).
- **Ciclo de vida:** pendente → aceito / recusado / expirado / revogado.
- **Estados:** pendente, aceito, recusado, expirado, revogado.
- **Invariantes:** uso único; escopado a uma organização e a papel(is); expira.
- **Eventos produzidos:** `MemberInvited`, `InviteAccepted`, `InviteRevoked`, `InviteExpired`.
- **Eventos consumidos:** —
- **Dependências:** Organization, Role.
- **Responsabilidades:** habilitar a entrada controlada de pessoas.
- **Nunca deve conhecer:** operação comercial.

---

# Contexto: Customers

## Customer (Cliente)
- **Representa:** quem compra da empresa (PF ou PJ).
- **Cria:** Vendedor/Admin/Gerente; importação.
- **Altera:** papéis com permissão de cliente.
- **Exclui:** inativado (com histórico) ou anonimizado (LGPD); nunca apagado se tem vendas.
- **Consome:** Sales, Receivables, Insights, Fiscal, Messaging.
- **Ciclo de vida:** criado → ativo → (inativado/anonimizado).
- **Estados:** ativo, inativo.
- **Invariantes:** documento (quando informado) único por organização; cliente com histórico não é apagado.
- **Eventos produzidos:** `CustomerCreated`, `CustomerUpdated`, `CustomerDeactivated`.
- **Eventos consumidos:** —
- **Dependências:** VOs Document, Contact, Address.
- **Responsabilidades:** representar o comprador e seu histórico.
- **Nunca deve conhecer:** como o estoque baixa, detalhes financeiros internos (só referencia).

---

# Contexto: Catalog

## Product (Produto)
- **Representa:** o item conceitual vendável.
- **Cria:** Admin/Gerente/Estoquista com permissão; importação.
- **Altera:** papéis com permissão de catálogo.
- **Exclui:** inativado (mantém histórico de vendas); nunca apagado se vendido.
- **Consome:** Sales, Inventory, Insights, Fiscal.
- **Ciclo de vida:** criado → ativo → (inativado).
- **Estados:** ativo, inativo.
- **Invariantes:** tem ao menos uma variante (a "variante única" quando não há variações); preço e custo ≥ 0.
- **Eventos produzidos:** `ProductCreated`, `ProductUpdated`, `ProductDeactivated`.
- **Eventos consumidos:** —
- **Dependências:** ProductVariant, VOs Money (preço/custo), Unit.
- **Responsabilidades:** definir o que se vende.
- **Nunca deve conhecer:** saldo de estoque (é do InventoryItem), cliente, venda.

## ProductVariant (Variante)
- **Representa:** a especialização vendável de um produto (ex.: "camisa P azul") e a **unidade que carrega estoque**.
- **Cria:** junto com o Product (ao menos uma).
- **Altera:** papéis de catálogo.
- **Exclui:** inativada; nunca apagada se movimentou estoque/vendeu.
- **Consome:** Inventory (saldo por variante), Sales.
- **Ciclo de vida:** criada → ativa → (inativada).
- **Estados:** ativa, inativa.
- **Invariantes:** SKU único por organização; pertence a exatamente um Product; atributos de variação (`VariantAttribute`) genéricos.
- **Eventos produzidos:** `VariantCreated`, `PriceChanged`.
- **Eventos consumidos:** —
- **Dependências:** Product, VOs SKU, Barcode, Money, VariantAttribute.
- **Responsabilidades:** ser a unidade concreta de venda e de estoque.
- **Nunca deve conhecer:** o próprio saldo (consulta o InventoryItem).

> **Regra oficial (FD-08 / RN-25):** toda unidade estocável é ProductVariant. Produto sem variações visíveis tem **variante padrão**. InventoryItem referencia a variante. UI não expõe complexidade quando há só a variante padrão. Atributos via `VariantAttribute` genérico.

---

# Contexto: Inventory (Core)

## InventoryItem (Item de Estoque)
- **Representa:** a posição de estoque de uma variante numa organização (saldos derivados do ledger).
- **Cria:** ao criar a variante que controla estoque; primeira movimentação.
- **Altera:** somente por **movimentações** (nunca edição direta do saldo).
- **Exclui:** não se exclui (histórico do ledger é permanente); pode ficar inativo com a variante.
- **Consome:** Sales (disponibilidade), Insights (ruptura/parado), Decision Center.
- **Ciclo de vida:** existe enquanto a variante controla estoque.
- **Estados:** (derivados) com saldo, zerado, negativo (se política permite).
- **Invariantes:** saldo = soma do ledger; disponível = físico − reservado; reserva ≠ saída.
- **Eventos produzidos:** `LowStockDetected` (via política).
- **Eventos consumidos:** —
- **Dependências:** ProductVariant, InventoryMovement, Reservation.
- **Responsabilidades:** ser a verdade reconstruível do estoque.
- **Nunca deve conhecer:** preço de venda, cliente, financeiro.

## InventoryMovement (Movimentação do ledger físico)
- **Representa:** lançamento imutável que altera o **saldo físico** (ou o compensa).
- **Tipos:** entrada, saída, ajuste positivo, ajuste negativo, devolução, estorno; transferência futura.
- **Cria:** serviços de domínio (confirmação de venda, ajuste, importação, devolução, estorno).
- **Altera / Exclui:** **nunca**; correção = movimento compensatório. Custo histórico aplicado **não** é editável silenciosamente (FD-01).
- **Consome:** InventoryItem (deriva físico), Audit, Insights.
- **Ciclo de vida:** criado (imutável).
- **Estados:** — (é um fato).
- **Invariantes:** nenhum movimento sem origem; grava custo unitário aplicado nas saídas (média vigente); não editável.
- **Eventos produzidos:** `InventoryMoved`.
- **Eventos consumidos:** —
- **Dependências:** ProductVariant, Quantity, Money (custo aplicado), origem.
- **Responsabilidades:** verdade do físico e do custo aplicado.
- **Nunca deve conhecer:** reserva como se fosse saída — **Reservation é outra entidade**.

## Reservation (Reserva)
- **Representa:** compromisso de estoque (**não** é InventoryMovement / não é saída).
- **Cria:** promoção a Pedido/Orçamento (conforme política) via StockAllocationService — **MVP (FD-02)**.
- **Altera:** consumir (confirmação), liberar, expirar, cancelar.
- **Exclui:** não; estados terminais.
- **Possui:** origem, quantidade, data, situação, expiração opcional, histórico.
- **Consome:** InventoryItem (reservado/disponível), Sale (origem).
- **Ciclo de vida / Estados:** ativa → consumida | liberada | expirada | cancelada.
- **Invariantes:** reserva ≠ saída; afeta reservado, não o físico; na confirmação é consumida e **aí** nasce a saída.
- **Eventos produzidos:** `InventoryReserved`, `InventoryReleased`, `ReservationConsumed`.
- **Eventos consumidos:** transição da Sale (Pedido/Orçamento/Confirmada/cancelamentos pré-confirmação).
- **Dependências:** ProductVariant, Quantity, Sale (id).
- **Responsabilidades:** prevenir venda duplicada do disponível (B2B, separação, pedido em aberto).
- **Nunca deve conhecer:** financeiro; nunca ser tratada como baixa física.

---

# Contexto: Sales (Core) — sem agregado Order no MVP

## Sale (Venda) — *Aggregate Root*
- **Representa:** o ciclo comercial completo (rascunho, orçamento, pedido, venda confirmada, cancelamento) — **um único agregado** (FD-03 / ADR-0018). UI pode rotular “Orçamento/Pedido”; o domínio permanece Sale.
- **Cria:** Vendedor.
- **Altera:** Vendedor nas fases pré-confirmação; após **Confirmada**, só **Cancelar** (compensação).
- **Exclui:** **nunca**; descarta/cancela conforme estado.
- **Consome:** Inventory (reserva/saída via serviço), Receivables, Fiscal, Insights, Audit.
- **Ciclo de vida / Estados:** Rascunho → Orçamento → Pedido → Confirmada → Cancelada (+ terminais: Descartada, OrçamentoRecusado, OrçamentoExpirado, PedidoCancelado). Ver `StateMachines.md`.
- **Invariantes:** total calculado; desconto sob política (FD-05); confirmação atômica; confirmada não editável; Sale **não** edita ledgers de outros agregados diretamente.
- **Eventos produzidos:** `SaleCreated`, `SaleQuoted`, `SaleOrdered`, `SaleConfirmed`, `SaleCancelled`, `SaleDiscarded`, `SaleQuoteRejected`, `SaleQuoteExpired`, `SaleOrderCancelled`, …
- **Eventos consumidos:** —
- **Dependências:** Customer, SaleItem, ProductVariant; serviços StockAllocation / Receivable / Payment.
- **Responsabilidades:** guardar a intenção e a efetivação comercial; coordenar efeitos via serviços.
- **Nunca deve conhecer:** implementação interna do ledger de estoque/financeiro; complexidade fiscal do provedor.
- **Order separado:** **fora do MVP**; gatilhos de extração em FD-03.

## SaleItem (Item de Venda)
- **Representa:** uma linha da venda (variante, quantidade, preço, desconto).
- **Cria:** dentro da Sale (pela raiz).
- **Altera:** só via a raiz Sale, enquanto rascunho.
- **Exclui:** só via a raiz, enquanto rascunho.
- **Consome:** cálculo do total (Sale), baixa de estoque.
- **Ciclo de vida:** existe enquanto parte da venda.
- **Estados:** segue o da venda.
- **Invariantes:** quantidade > 0; preço ≥ 0; desconto não torna o total negativo; pertence a exatamente uma Sale.
- **Eventos produzidos:** — (a Sale fala pelos itens).
- **Eventos consumidos:** —
- **Dependências:** ProductVariant, VOs Money/Quantity/DiscountLine.
- **Responsabilidades:** representar o que foi vendido e quanto.
- **Nunca deve conhecer:** existir fora de uma Sale (não é acessado diretamente de fora).

---

# Contexto: Receivables & Finance (Core)

## Receivable (Recebível) — *Aggregate Root*
- **Representa:** o direito de receber por uma venda.
- **Cria:** serviço de confirmação da venda.
- **Altera:** sistema (situação derivada); Financeiro (vencimento — auditado).
- **Exclui:** **nunca**; cancela-se (via cancelamento da venda) mantendo histórico.
- **Consome:** Payment, FinancialEntry, Insights, Decision Center.
- **Ciclo de vida:** criado → (parcialmente recebido) → quitado / cancelado. Ver `StateMachines.md`.
- **Estados:** em aberto, parcialmente recebido, quitado, cancelado.
- **Invariantes:** tem origem (venda/importação); situação derivada dos pagamentos; soma das parcelas = total do recebível.
- **Eventos produzidos:** `ReceivableCreated`, `ReceivableSettled`, `ReceivableCanceled`, `ReceivableOverdue`.
- **Eventos consumidos:** `SaleConfirmed`, `SaleCancelled`.
- **Dependências:** Installment, Sale (origem), VO Money.
- **Responsabilidades:** ser a raiz de consistência do direito de recebimento e suas parcelas.
- **Nunca deve conhecer:** estoque; a assinatura do SaaS (Billing).

## Installment (Parcela)
- **Representa:** uma fração do recebível com vencimento próprio.
- **Cria:** com o Receivable (plano de parcelamento).
- **Altera:** situação derivada; vencimento (auditado, via raiz).
- **Exclui:** só via cancelamento do recebível.
- **Consome:** Payment, Insights (vencimentos/inadimplência).
- **Ciclo de vida:** em aberto → (parcialmente paga) → paga / vencida / cancelada. Ver `StateMachines.md`.
- **Estados:** em aberto, parcialmente paga, paga, vencida, cancelada.
- **Invariantes:** saldo aberto = valor − pagamentos válidos; "vencida" é derivado da data; pertence a um Receivable.
- **Eventos produzidos:** — (o Receivable fala pelas parcelas).
- **Eventos consumidos:** —
- **Dependências:** Receivable, VOs Money/DueDate.
- **Responsabilidades:** representar cada vencimento.
- **Nunca deve conhecer:** existir fora de um Receivable.

## Payment (Pagamento / Recebimento)
- **Representa:** um evento de recebimento (total ou parcial) aplicado a parcela(s).
- **Cria:** Financeiro/Vendedor com permissão.
- **Altera:** **nunca** (é um fato); corrige-se por estorno.
- **Exclui:** **nunca**; estorna-se.
- **Consome:** FinancialEntry, Receivable (recalcula), Audit.
- **Ciclo de vida:** registrado → (estornado). Ver `StateMachines.md`.
- **Estados:** registrado, estornado.
- **Invariantes:** idempotente (sem duplicidade de recebimento); não excede o saldo aberto sem tratamento explícito; tem forma de pagamento.
- **Eventos produzidos:** `PaymentRegistered`, `PaymentReversed`.
- **Eventos consumidos:** —
- **Dependências:** Installment/Receivable, VOs Money/PaymentMethod.
- **Responsabilidades:** reconhecer o dinheiro que entrou.
- **Nunca deve conhecer:** estoque.

## FinancialEntry (Lançamento Financeiro)
- **Representa:** um movimento imutável no razão de caixa (entrada/saída efetivada).
- **Cria:** serviço financeiro (a partir de pagamento/estorno).
- **Altera:** **nunca** (append-only).
- **Exclui:** **nunca**; compensa-se.
- **Consome:** projeção de caixa, Insights, Decision Center.
- **Ciclo de vida:** criado (imutável).
- **Estados:** — (é um fato).
- **Invariantes:** tem origem; compõe o caixa reconstruível; não editável.
- **Eventos produzidos:** —
- **Eventos consumidos:** —
- **Dependências:** origem (Payment), VO Money.
- **Responsabilidades:** ser a verdade reconstruível do caixa.
- **Nunca deve conhecer:** o motivo comercial completo (só a referência).

---

# Contexto: Intelligence

## Insight
- **Representa:** uma conclusão gerada (fato/projeção/recomendação) sobre a operação.
- **Cria:** motor de regras (determinístico).
- **Altera:** sistema (recomputo/expiração); usuário (dispensar/marcar resolvido).
- **Exclui:** não se apaga; expira/resolve/dispensa.
- **Consome:** Decision Center, Notifications.
- **Ciclo de vida:** gerado → ativo → dispensado / resolvido / expirado. Ver `StateMachines.md`.
- **Estados:** ativo, dispensado, resolvido, expirado.
- **Invariantes:** rastreável (regra, registros, período, natureza); sem dados suficientes não é gerado; deduplicado.
- **Eventos produzidos:** `InsightGenerated`, `InsightDismissed`, `InsightResolved`.
- **Eventos consumidos:** eventos do núcleo (gatilho de recomputo).
- **Dependências:** leitura do núcleo, Rule, VOs Severity/InsightNature/Period.
- **Responsabilidades:** interpretar e priorizar a atenção do dono.
- **Nunca deve conhecer:** escrever no núcleo; inventar dados.

---

# Contexto: Imports / Fiscal / Billing / Audit

## ImportJob (Importação)
- **Representa:** um processo de trazer dados externos com validação.
- **Cria:** usuário com permissão de importar.
- **Altera:** sistema (progresso/estado).
- **Exclui:** não se exclui; pode ser revertido (rollback do job).
- **Consome:** Customers/Catalog/Inventory/Finance (destino), Audit.
- **Ciclo de vida:** enviado → validado → em processamento → concluído / parcial / falho / revertido. Ver `StateMachines.md`.
- **Estados:** enviado, validado, processando, concluído, parcial, falho, revertido.
- **Invariantes:** idempotente; não corrompe dados existentes; registros criados marcam a origem.
- **Eventos produzidos:** `ImportCompleted`, `ImportFailed`, `ImportReverted`.
- **Eventos consumidos:** —
- **Dependências:** VO ColumnMapping, arquivos temporários.
- **Responsabilidades:** reduzir o medo da tela em branco com segurança.
- **Nunca deve conhecer:** burlar invariantes do domínio (escreve via serviços).

## FiscalDocument (Documento Fiscal)
- **Representa:** um documento fiscal solicitado ao provedor a partir de uma venda.
- **Cria:** usuário com permissão fiscal (a partir de uma venda).
- **Altera:** sistema (status via webhook do provedor).
- **Exclui:** não se exclui; cancela-se via provedor (evento fiscal).
- **Consome:** Sales (dados), Files (XML/PDF), Audit.
- **Ciclo de vida:** solicitado → processando → autorizado / rejeitado → (cancelado). Ver `StateMachines.md`.
- **Estados:** pendente, processando, autorizado, rejeitado, cancelado.
- **Invariantes:** idempotente (sem nota duplicada); não altera estoque/financeiro; via adapter (sem lock-in).
- **Eventos produzidos:** `FiscalDocumentIssued`, `FiscalDocumentRejected`, `FiscalDocumentCanceled`.
- **Eventos consumidos:** `SaleConfirmed` (oferece emissão).
- **Dependências:** Sale, provedor fiscal (via ACL).
- **Responsabilidades:** representar o documento fiscal e seu status.
- **Nunca deve conhecer:** a complexidade tributária (delegada ao provedor).

## Subscription (Assinatura)
- **Representa:** o contrato ativo da organização com o Rescript.
- **Cria:** onboarding/billing.
- **Altera:** billing (plano/estado); sistema (inadimplência).
- **Exclui:** não se exclui; cancela-se.
- **Consome:** Entitlements (resolve direitos/limites), Organization (pode suspender).
- **Ciclo de vida:** trial → ativa → (inadimplente) → (suspensa) → (cancelada). Ver `StateMachines.md`.
- **Estados:** trial, ativa, inadimplente, suspensa, cancelada.
- **Invariantes:** um plano vigente por vez; mudança de estado reflete em entitlements; **não se confunde com os recebíveis do cliente**.
- **Eventos produzidos:** `SubscriptionCreated`, `SubscriptionChanged`, `SubscriptionCanceled`, `PaymentFailed`.
- **Eventos consumidos:** eventos do gateway de billing (via ACL).
- **Dependências:** Plan, gateway de billing.
- **Responsabilidades:** controlar o acesso comercial da organização.
- **Nunca deve conhecer:** as vendas/recebíveis do cliente (domínio Finance).

## AuditEntry (Registro de Auditoria)
- **Representa:** a trilha imutável de uma ação sensível.
- **Cria:** os serviços de domínio ao executar ações sensíveis.
- **Altera:** **nunca** (append-only).
- **Exclui:** **nunca**.
- **Consome:** consultas de auditoria (Proprietário/Admin).
- **Ciclo de vida:** criado (imutável).
- **Estados:** —
- **Invariantes:** quem/quando/organização/ação/entidade/estados/contexto; imutável; isolado por organização.
- **Eventos produzidos:** —
- **Eventos consumidos:** todos os eventos sensíveis.
- **Dependências:** correlação com evento/uso.
- **Responsabilidades:** responsabilização e confiança.
- **Nunca deve conhecer:** ser alvo de regra de negócio (só registra).

---

## Resumo — Entidades por Contexto

| Contexto | Entidades |
|---|---|
| Identity & Access | User |
| Tenancy & Organizations | Organization, Membership, Invite |
| Customers | Customer |
| Catalog | Product, ProductVariant |
| Inventory | InventoryItem, InventoryMovement, Reservation |
| Sales | Sale (root), SaleItem — **sem Order no MVP** |
| Receivables & Finance | Receivable (root), Installment, Payment, FinancialEntry |
| Intelligence | Insight |
| Imports | ImportJob |
| Fiscal | FiscalDocument |
| Subscriptions | Subscription |
| Audit | AuditEntry |

> Entidades que são **raízes de agregado** estão marcadas e detalhadas em `Aggregates.md`. `Message` (mensageria) é entidade futura, descrita brevemente em `DomainEvents.md`/arquitetura.
