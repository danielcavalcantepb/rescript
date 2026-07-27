---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: Documentation portal and authority hierarchy
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Documentation Portal

This is the mandatory entry point for every developer, architect, designer, product manager, and AI agent. No other document is an alternative starting point.

## Overview

Rescript is a multi-tenant Enterprise ERP SaaS organized as a modular monolith. The product prioritizes operational productivity, permanent context, reliable financial and inventory facts, and entity-centered Workspaces. Documentation defines approved intent and constraints; migrations, generated types, and executable tests demonstrate the implemented state. [Module Status](./MODULE_STATUS.md) reconciles both.

## Official reading order

Read before any contribution:

1. [Product Vision](./00_PRODUCT_VISION.md)
2. [Product Design](./03_PRODUCT_DESIGN.md)
3. [Project Architecture](./01_PROJECT_ARCHITECTURE.md)
4. [Engineering Guide](./02_ENGINEERING_GUIDE.md)
5. [UI Guidelines](./04_UI_GUIDELINES.md) for any user-facing work
6. [Module Standards](./05_MODULE_STANDARDS.md)
7. [Domain Guide](./06_DOMAIN_GUIDE.md)
8. [Architecture Decisions](./08_ARCHITECTURE_DECISIONS.md) and applicable detailed ADRs
9. [Development Workflow](./09_DEVELOPMENT_WORKFLOW.md)
10. [Module Status](./MODULE_STATUS.md)
11. The relevant Reference, Runbook, migration, module implementation, and tests
12. [AI Guide](./10_AI_GUIDE.md) when the contributor is an AI agent

Start a local environment with [Quick Start](./QUICK_START.md). Use [Glossary](./GLOSSARY.md) for canonical terminology and [Documentation Governance](./DOCUMENTATION_GOVERNANCE.md) when changing documentation.

## Authority hierarchy

When statements conflict, apply this order:

1. accepted ADR for the specific decision;
2. Canonical document with the narrowest applicable scope;
3. [Module Status](./MODULE_STATUS.md) for implementation maturity;
4. Runbook for an operational procedure;
5. current migration, generated database types, executable tests, and implementation as evidence of actual behavior;
6. Reference document;
7. Proposal;
8. Historical or Archive document.

An implementation discrepancy does not silently rewrite architecture. Record it in Module Status and resolve it through the workflow. Historical, Proposal, and Archive documents never override Canonical documents or accepted ADRs.

## Document classifications

| Type | Meaning | Authority |
|---|---|---|
| Canonical | Normative product, architecture, engineering, or governance rule | Binding |
| ADR | Accepted or explicitly proposed architectural decision with its own status | Binding only when accepted |
| Reference | Detailed explanation supporting Canonical documents and ADRs | Informative; cannot override them |
| Runbook | Repeatable operational procedure | Binding for the described operation while active |
| Proposal | Unapproved option, future design, or open decision | Non-binding |
| Historical | Discovery, validation, or record of a past state | Evidence only |
| Archive | Superseded or obsolete material retained for traceability | No current authority |

## Documentation map

The [complete document index](./DOCUMENT_INDEX.md) lists every governed Markdown document by classification and guarantees a discoverable path to historical and specialized material.

### Canonical foundation

- [Product Vision](./00_PRODUCT_VISION.md)
- [Project Architecture](./01_PROJECT_ARCHITECTURE.md)
- [Engineering Guide](./02_ENGINEERING_GUIDE.md)
- [Product Design](./03_PRODUCT_DESIGN.md)
- [UI Guidelines](./04_UI_GUIDELINES.md)
- [Module Standards](./05_MODULE_STANDARDS.md)
- [Domain Guide](./06_DOMAIN_GUIDE.md)
- [Roadmap](./07_ROADMAP.md)
- [Architecture Decisions](./08_ARCHITECTURE_DECISIONS.md)
- [Development Workflow](./09_DEVELOPMENT_WORKFLOW.md)
- [AI Guide](./10_AI_GUIDE.md)
- [Module Status](./MODULE_STATUS.md)
- [Glossary](./GLOSSARY.md)
- [Quick Start](./QUICK_START.md)
- [Documentation Governance](./DOCUMENTATION_GOVERNANCE.md)
- [Marketing Website](./MARKETING_WEBSITE.md)

### Architecture and decisions

- [ADR index](./architecture/adr/README.md)
- [Architecture references](./architecture/README.md)
- [Domain contracts](./architecture/DomainContracts.md)
- [Dependency rules](./architecture/DependencyRules.md)

### Domain and database

- [Domain references](./domain/README.md)
- [Database references](./database/README.md)
- [Migration runbook](./development/Migrations.md)

### Product and interface

- [Marketing Website](./MARKETING_WEBSITE.md)
- [Design references](./design/README.md)
- [Screen specifications](./screens/README.md)
- [Platform references](./platform/ArchitectureOverview.md)

### Operations and evidence

- [Development runbooks](./development/DatabaseLive.md)
- [Walkthrough evidence](./walkthrough/README.md)
- [Decision records](./decisions/README.md)

## Conventions

- Paths and code identifiers use English; product labels use Brazilian Portuguese.
- Every Markdown document begins with the governance metadata header.
- Relative Markdown links are preferred for internal navigation.
- `Status` describes lifecycle; `Type` describes authority.
- Use `None` when a metadata relationship does not apply.
- New architecture decisions require an ADR; do not hide them in implementation notes.
- New features update Module Status and the affected Canonical or Reference documents in the same delivery.
- Never edit an applied migration or generated file manually.
- Never use Historical, Proposal, or Archive material as an implementation contract.

## Fast paths by role

| Role | Continue after the official reading order with |
|---|---|
| Developer | Quick Start, Module Status, module Reference docs, migrations, tests |
| Product Manager | Product Vision, Product Design, Roadmap, Module Status |
| Designer | Product Design, UI Guidelines, design references, relevant screens |
| Architect | Project Architecture, ADR index, Domain Guide, domain contracts |
| AI agent | AI Guide, Module Status, applicable ADRs, closest implemented module |

## Contribution gate

Do not implement when ownership, lifecycle, invariants, permissions, tenant isolation, audit behavior, atomicity, or Workspace behavior is undefined or contradictory. Register the gap and obtain an approved decision first.
