# Changelog

## Unreleased

### Real data readiness

- Removed the legacy runtime mock dataset and the unused insight/pulse components that depended on fictional customers, products, sales, receivables and operational insights.
- Analytics now discards incomplete persisted records instead of assigning artificial epoch dates, and the Command Center no longer formats absent primary KPI values as zero.
- The local Supabase database was rebuilt successfully and all migrations were applied; schema lint findings in legacy SQL routines remain tracked separately.

### Customer Workspace

- Expanded customer persistence with Company/Branch scope, abbreviated name, additional contact and registration fields.
- Added tenant-aware acquisition sources and dependents, plus additive search indexing for abbreviated name and Instagram.

### Documentation

- Formalizado o Customer Domain: ownership obrigatório por Organization, Company e Branch; lifecycle `draft/active/inactive/archived`; dados principais, pessoa/documentos, address principal, AcquisitionSource e Child/Dependent.
- Esclarecido o lifecycle: `draft` representa cadastro iniciado com informações incompletas e não é elegível para operações; somente `active` é operacional.
- Definidos eventos, permissões, auditoria, integrações com Sales/Finance/Analytics e indicadores derivados de Customer. Esta alteração não inclui código, migrations ou telas.

### Analytics

- Added read-only projections and server-side KPIs, rankings, and time-series APIs derived from operational facts.
- Rebuilt the Executive Dashboard as a responsive command center consuming Analytics read models only.

### Changed

- Formalizado o Finance Domain operacional: PaymentAllocation, Branch obrigatória, CashLedger imutável, transferências debit/credit e fórmulas de fluxo de caixa.
- Mantidos fora de escopo: conciliação, bancos, encargos financeiros, descontos, abatimentos e abertura/fechamento de caixa.

### Added

- Foundation Sprint: aggregates organizacionais `Branch`, `PaymentTerm` e `InventoryPolicy`, com RLS, RBAC, auditoria e commands transacionais.
- Sales Domain: Sales Orders passam a persistir filial e condição de pagamento, confirmar com geração idempotente de parcelas em Contas a Receber e aplicar reserva conforme a InventoryPolicy.
