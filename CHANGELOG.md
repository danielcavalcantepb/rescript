# Changelog

## Unreleased

### Analytics

- Added read-only projections and server-side KPIs, rankings, and time-series APIs derived from operational facts.
- Rebuilt the Executive Dashboard as a responsive command center consuming Analytics read models only.

### Changed

- Formalizado o Finance Domain operacional: PaymentAllocation, Branch obrigatória, CashLedger imutável, transferências debit/credit e fórmulas de fluxo de caixa.
- Mantidos fora de escopo: conciliação, bancos, encargos financeiros, descontos, abatimentos e abertura/fechamento de caixa.

### Added

- Foundation Sprint: aggregates organizacionais `Branch`, `PaymentTerm` e `InventoryPolicy`, com RLS, RBAC, auditoria e commands transacionais.
- Sales Domain: Sales Orders passam a persistir filial e condição de pagamento, confirmar com geração idempotente de parcelas em Contas a Receber e aplicar reserva conforme a InventoryPolicy.
