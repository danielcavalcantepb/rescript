---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: Official implementation and maturity registry
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Module Status

This is the official reference for what exists today. `Implemented` means production code and persistence exist in the repository; it does not claim production deployment. `Partial` means a usable foundation exists but the documented enterprise capability is incomplete. `Planned` means there is no complete operational implementation.

## Status scale

| Maturity | Meaning |
|---|---|
| Foundation | Cross-cutting base exists; operational coverage is limited |
| Functional | Main flow exists with persistence, permissions, and tests |
| Partial enterprise | Main flow exists; Workspace, scale, or lifecycle depth remains incomplete |
| Planned | Approved direction without complete implementation |
| Mock | Demonstration surface without authoritative domain flow |

## Official registry

| Module | Status | Maturity | Workspace | RPC | Database | Audit | Permissions | Tests | Next step |
|---|---|---|---|---|---|---|---|---|---|
| Organizations / Memberships | Implemented | Foundation | Partial | `create_organization` | Implemented | Partial | Implemented | Implemented | Complete administration, invitations, role management, and support flows |
| Authentication / Session | Implemented | Foundation | N/A | Server functions/Supabase Auth | Supabase Auth | Partial | Session boundary | Implemented | Complete recovery and remove unavailable authentication options |
| App Shell / Navigation | Partial | Foundation | Central partial | N/A | N/A | N/A | Permission-aware partial | Partial | Canonicalize URLs and operational labels; remove duplicate navigation |
| Central | Partial | Foundation | Partial | No cross-domain read model | No canonical projection | No | Partial | Partial | Replace placeholder blocks with prioritized operational facts |
| Search / Command Palette | Partial | Foundation | N/A | Partial | Catalog/customer/supplier projections | N/A | Partial | Partial | Deliver universal permission-aware search and exact quick actions |
| Catalog / Products / Variants | Implemented | Partial enterprise | Implemented | Implemented server functions | Implemented | Lifecycle history implemented | Implemented | Broad unit/integration coverage | Finish categories, brands, attributes, images, fiscal context, and route cutover |
| Pricing | Implemented | Functional | Partial inside Product | Implemented | Implemented | Partial | Implemented | Implemented | Add scale workflows, simulation, bulk changes, and complete Workspace context |
| Inventory Foundation | Implemented | Partial enterprise | Partial | Implemented | Implemented | Ledger/history implemented | Implemented | Broad coverage | Complete variant cutover, consolidate legacy routes, add bulk/barcode workbench |
| Inventory Ledger | Implemented | Functional | Partial | Atomic registration/transfer RPCs | Append-only ledger implemented | Implemented | Implemented | Unit, integration, and RLS coverage | Add reversal UX, reconciliation, valuation, and operational control center |
| Customers | Implemented | Functional | Partial | Server functions | Aggregate, children, history, search | Implemented | Implemented | Unit/integration/client-boundary coverage | Replace complex modals and add commercial/financial Customer Workspace context |
| Suppliers | Implemented | Functional | Partial | Server functions | Aggregate, children, history, search | Implemented | Implemented | Unit/integration/client-boundary coverage | Add procurement and financial context; replace complex modals |
| Purchase Orders | Implemented | Functional | Partial | Server functions | Aggregate, items, snapshots, history, search | Implemented | Implemented | Unit/integration coverage | Move creation to page/workbench and deepen approval/exception handling |
| Goods Receiving | Implemented | Functional | Partial | Server functions plus atomic posting RPC | Aggregate, items, history, search | Implemented | Implemented | Unit/integration coverage | Add receiving workbench, barcode, divergences, reversals, and returns |
| Accounts Payable | Implemented | Functional | Partial | Server functions | Payable, installments, history, search | Implemented | Implemented | Unit/integration coverage | Add payment settlement only after Payments decisions are approved |
| Payments / Allocations / Reversals | Planned | Planned | Not implemented | Not defined | Logical proposal only | Required, not implemented | Keys reserved; contract incomplete | Scenario documents only | Resolve scope, ledger, bank/cash accounts, allocation, reversal, and RPC decisions |
| Accounts Receivable | Planned | Planned | Not implemented | Not defined | Logical proposal only | Required, not implemented | Not complete | Scenario documents only | Implement after canonical Sales flow and approve Finance transactional design |
| Sales | Partial | Mock | Not an operational Workspace | Mock/absent | No canonical implemented aggregate | No complete flow | Keys exist | Limited/mock | Implement the approved Sale aggregate and atomic confirmation flow |
| Finance Workspace | Partial | Foundation | Hub only | No consolidated read model | Accounts Payable only | Partial | Partial | Partial | Complete transactional finance before dashboards and cash projections |
| Permissions | Implemented | Foundation | No administration Workspace | Context/service | Membership role presets | Partial | Canonical permission keys | Implemented | Add custom roles, scopes, SoD, and administration UX when prioritized |
| Audit Center | Planned | Planned | Not implemented | Not defined | Domain histories exist; global center absent | Module-local only | `audit.view` reserved | Not implemented | Define global audit projection, retention, and investigation UX |
| Imports / Exports | Planned | Planned | Not implemented | Not defined | Proposal only | Required | `imports.run` reserved | Not implemented | Define async jobs, validation reports, and tenant-safe file handling |
| Fiscal | Planned | Planned | Not implemented | Adapter boundary documented | Boundary only | Required | Not complete | Not implemented | Implement only after provider and market scope decisions |
| SaaS Billing / Entitlements | Planned | Planned | Not implemented | Not defined | Proposal only | Required | Partial concepts | Not implemented | Keep separate from customer financial Payments |
| Reporting / Analytics | Planned | Planned | Not implemented | Not defined | Projection proposals only | N/A | Not complete | Not implemented | Build only from reconciled operational facts |

## Known cross-cutting divergences

- Legacy and canonical routes coexist for Products, Customers, and Inventory.
- Sidebar labels `CRM`, `Procurement`, and `Catalog` do not yet fully match Product Design.
- Some complex creation/edit flows still use dialogs.
- Several historical documents describe pre-implementation states; their metadata classification removes normative authority.
- Payments is intentionally blocked until the unresolved decisions recorded above become an accepted ADR or Canonical specification.

## Update rule

Every feature delivery that changes runtime capability must update the affected row, including tests, persistence, permissions, audit, Workspace maturity, and next step. See [Documentation Governance](./DOCUMENTATION_GOVERNANCE.md).
