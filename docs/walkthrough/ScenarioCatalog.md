---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / ScenarioCatalog
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Catálogo de Cenários

| # | Arquivo | Título | Tipo | Classificação |
|---|---|---|---|---|
| 01 | `01-Onboarding.md` | Primeiro acesso e onboarding | obrigatório | aprovado com ressalvas |
| 02 | `02-SellerInvitation.md` | Convite e entrada de vendedor | obrigatório | aprovado com ressalvas |
| 03 | `03-SimpleProduct.md` | Produto simples / variante padrão | obrigatório | aprovado |
| 04 | `04-ProductWithVariants.md` | Produto com variantes | obrigatório | aprovado com ressalvas |
| 05 | `05-DraftSale.md` | Venda em rascunho | obrigatório | aprovado |
| 06 | `06-QuoteWithoutReservation.md` | Orçamento sem reserva | obrigatório | aprovado com ressalvas |
| 07 | `07-OrderWithReservation.md` | Pedido com reserva | obrigatório | aprovado com ressalvas |
| 08 | `08-ConfirmSale.md` | Confirmação atômica | obrigatório | aprovado com ressalvas |
| 09 | `09-DoubleClickConfirm.md` | Clique duplo confirmar | obrigatório | aprovado |
| 10 | `10-ConcurrentStockSale.md` | Dois vendedores / mesmo estoque | obrigatório | aprovado com ressalvas |
| 11 | `11-ExpiredReservation.md` | Reserva expirada | obrigatório | aprovado com ressalvas |
| 12 | `12-CancelBeforeConfirm.md` | Cancelamento pré-confirmação | obrigatório | aprovado |
| 13 | `13-CancelAfterConfirmUnpaid.md` | Cancelamento pós-confirmação sem pagamento | obrigatório | aprovado |
| 14 | `14-CancelAfterPayment.md` | Cancelamento após pagamento | obrigatório | **decisão do fundador** |
| 15 | `15-PartialPayment.md` | Pagamento parcial | obrigatório | aprovado com ressalvas |
| 16 | `16-DuplicatePayment.md` | Pagamento duplicado | obrigatório | aprovado com ressalvas |
| 17 | `17-PaymentReversal.md` | Estorno de pagamento | obrigatório | **decisão do fundador** |
| 18 | `18-StockEntryWithCost.md` | Entrada com custo (média 15) | obrigatório | aprovado com ressalvas |
| 19 | `19-StockEntryWithoutCost.md` | Entrada sem custo | obrigatório | aprovado |
| 20 | `20-InventoryAdjustment.md` | Ajuste de inventário | obrigatório | aprovado com ressalvas |
| 21 | `21-Return.md` | Devolução | obrigatório | **decisão do fundador** |
| 22 | `22-ProductImport.md` | Importação de produtos | obrigatório | aprovado com ressalvas |
| 23 | `23-DuplicateImport.md` | Importação duplicada | obrigatório | **decisão do fundador** |
| 24 | `24-ImportVsManualConcurrency.md` | Import × cadastro manual | obrigatório | aprovado |
| 25 | `25-UserRemovedDuringSale.md` | Usuário removido durante op | obrigatório | aprovado com ressalvas |
| 26 | `26-PermissionChangedDuringOp.md` | Permissão removida durante op | obrigatório | aprovado |
| 27 | `27-SuspendedOrganization.md` | Organização suspensa | obrigatório | aprovado com ressalvas |
| 28 | `28-LowStockInsight.md` | Insight estoque baixo | obrigatório | aprovado |
| 29 | `29-InsufficientDataInsight.md` | Insight dados insuficientes | obrigatório | aprovado |
| 30 | `30-DuplicateWebhookFuture.md` | Webhook duplicado (futuro) | obrigatório | aprovado com ressalvas |
| 31 | `31-FiscalProviderFailure.md` | Falha provedor fiscal | obrigatório | aprovado |
| 32 | `32-ConfirmHttpFailure.md` | Falha HTTP pós-commit | obrigatório | aprovado |
| 33 | `33-OutboxWorkerFailure.md` | Falha worker outbox | obrigatório | aprovado |
| 34 | `34-CrossTenantAttacks.md` | Ataques cross-tenant | obrigatório | aprovado |
| 35 | `35-ArchiveUsedProduct.md` | Arquivar produto usado | obrigatório | aprovado |
| 36 | `36-EditCustomerAfterSale.md` | Editar cliente após venda | obrigatório | aprovado com ressalvas |
| 37 | `37-PriceChangeAfterSale.md` | Preço após venda/rascunho | obrigatório | **decisão do fundador** |
| 38 | `38-FractionalUnit.md` | Unidade fracionada kg | obrigatório | aprovado com ressalvas |
| 39 | `39-DiscountAboveLimit.md` | Desconto acima do limite | obrigatório | aprovado com ressalvas |
| 40 | `40-OwnershipTransfer.md` | Transferência de propriedade | obrigatório | aprovado com ressalvas |
| 41 | `41-ConfirmDirectFromDraft.md` | Confirm direto do rascunho | exploratório | aprovado com ressalvas |
| 42 | `42-ReopenQuoteToDraft.md` | Reabrir orçamento | exploratório | aprovado |
| 43 | `43-MultiOrgSameUserSale.md` | Multi-org mesmo user | exploratório | aprovado |
| 44 | `44-SupportImpersonation.md` | Suporte / impersonação | exploratório | aprovado com ressalvas |
| 45 | `45-ReservationTTLConfigChange.md` | Mudança TTL reserva | exploratório | aprovado |
| 46 | `46-VariantArchiveWithActiveReservation.md` | Arquivar com reserva | exploratório | aprovado com ressalvas |
| 47 | `47-ReceivableMultiInstallment.md` | Parcelas | exploratório | aprovado |
| 48 | `48-SaleWithoutCustomer.md` | Venda sem cliente | exploratório | aprovado com ressalvas |
| 49 | `49-IdempotencyKeyCollisionDifferentPayload.md` | Key idempotência ≠ payload | exploratório | aprovado com ressalvas |
| 50 | `50-AverageCostZeroStockEdge.md` | Média com físico zero | exploratório | aprovado com ressalvas |
| 51 | `51-ConcurrentExpireAndConfirm.md` | Expire × Confirm | exploratório | aprovado |
| 52 | `52-ExportAfterMemberRemoval.md` | Export pós-remoção | exploratório | aprovado com ressalvas |
| 53 | `53-InsightFalsePositiveFeedback.md` | Falso positivo insight | exploratório | aprovado com ressalvas |
| 54 | `54-FileIsolationCrossOrg.md` | Isolamento de arquivos | exploratório | aprovado |
| 55 | `55-BillingEntitlementBlocksConfirm.md` | Entitlement bloqueia confirm | exploratório | aprovado com ressalvas |
