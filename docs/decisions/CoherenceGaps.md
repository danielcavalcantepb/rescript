---
Status: Active
Owner: Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: decisions / CoherenceGaps
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Divergências e Promessas Incompatíveis

> Levantadas na revisão pré-schema. Resolução proposta via FDC — **não** aplicadas silenciosamente.

| ID | Divergência | Docs | Risco | Resolução proposta |
|---|---|---|---|---|
| CG-01 | “Fluxo de caixa simples” / “saldo financeiro” vs FinancialEntry=FUT | MVP.md, DecisionCenter, Ledger, walkthrough c/ FinancialEntry | Expectativa de caixa bancário | FDC-07: caixa = recebido líquido derivado; emendar copy; limpar walkthrough |
| CG-02 | Projeção financeira na Central vs só AR | DecisionCenter, InsightCatalog | Overpromise | Limitar a a vencer/vencidos/recebido; sem DRE |
| CG-03 | Cancel Sale sem política de estorno/devolução fechada | StateMachines, FQ-01/03 | Cancel incompleto | FDC-04 + FDC-06 |
| CG-04 | Estoque por location no modelo vs UX sem location | database, screens | Confusão dev | FDC-03: location hidden |
| CG-05 | Qty fracionada sem precision seed | FD-06, OQ-01 | Checks impossíveis | FDC-09 |
| CG-06 | Rollback import após uso | ImportWizard “rollback”, ImportModel | Apagar histórico | FDC-15: sem rollback destrutivo |
| CG-07 | Desconto auth sem workflow claro | DiscountModel, UX | Self-auth / pending UI | FDC-13 + screens já esboçam pending |
| CG-08 | Refund/gateway sem integração | FQ-02 cartão | Estorno “fake” | MVP estorno interno + processo manual; gateway FUT |
| CG-09 | Fiscal desacoplado mas cancel “depende” de NF em alguns textos | FiscalBoundary, FQ-01 | Bloqueio indevido MVP | FDC-04: NF não bloqueia cancel comercial MVP |
| CG-10 | Walkthrough cria FinancialEntry na ConfirmSale | scenarios 08,14,15 | Modelo A vs simulação | Alinhar à FDC-07 após aprovação |
| CG-11 | H-02 negativo forbidden vs RN-34 | walkthrough | Mensagens | FDC-10 |
| CG-12 | FD-01 “por variante” vs key com location | FD-01, OQ-09 | Chave schema | FDC-02 esclarecimento |
| CG-13 | partially_reversed no modelo vs MVP sem parcial | PaymentsModel, FQ-02 | Enum morto | FDC-05: status V1 |
| CG-14 | MVP lista devolução em estoque sem fluxo financeiro | MVP.md, FQ-03 | Gap | FDC-06 + emenda MVP |
| CG-15 | Importação no Roadmap V1 vs screens/MVP onboarding import | Roadmap, MVP, screens | Escopo | Manter import no MVP ativação (já em MVP.md §3) — Roadmap “aprofundar” ≠ ausência MVP |

Nenhuma divergência exige novo agregado além do já modelado; exigem **fechamento de política** (FDC).
