---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: Documentation lifecycle, authority, ownership, and drift control
Supersedes: Informal documentation practices
Superseded-By: None
Related-Modules: All
---

# Documentation Governance

## Purpose

Documentation is a maintained product surface. It must let a contributor distinguish approved architecture, actual implementation, planned work, and historical evidence without tribal knowledge.

## Mandatory metadata

Every Markdown document begins with:

```yaml
---
Status: Active | Draft | Superseded | Archived
Owner: accountable team or role
Last-Reviewed: YYYY-MM-DD
Version: semantic document version
Type: Canonical | Reference | Historical | Proposal | ADR | Runbook | Archive
Scope: bounded responsibility
Supersedes: document path or None
Superseded-By: document path or None
Related-Modules: comma-separated modules or All
---
```

`Status` and `Type` are independent. An ADR additionally keeps its decision status in the body. Accepted ADRs are binding; proposed or rejected ADRs are not.

## Authority

The hierarchy in [Documentation Portal](./README.md) is mandatory. A summary may simplify a detailed document but cannot change its decision. The summary must link to the detail; the detail must link back when it is important to onboarding.

## Ownership

| Content | Accountable owner |
|---|---|
| Product vision, design principles, roadmap | Product Architecture |
| Architecture, ADRs, domain boundaries | Architecture |
| Engineering standards and workflow | Engineering |
| UI guidelines and design system | Product Design |
| Module reference and status | Module owner plus Architecture |
| Runbooks | Team operating the procedure |
| Security, permissions, audit, tenancy | Security/Architecture |

The author is not automatically the owner. Ownership remains assigned to a durable team or role.

## When documentation must change

Update documentation in the same delivery when changing:

- product behavior, lifecycle, permissions, audit, tenant rules, or user workflow;
- public module contract, RPC, event, projection, or port;
- schema, migration strategy, retention, or data ownership;
- architecture or dependency direction;
- setup, build, testing, deployment, or incident procedure;
- module implementation or maturity;
- canonical terminology or navigation.

Every completed feature updates [Module Status](./MODULE_STATUS.md). A new architectural decision updates the ADR index and relevant Canonical summary.

## Creating documents

Before creating a document:

1. search for the existing owner and subject;
2. extend the existing Canonical or Reference document when responsibility matches;
3. create an ADR for an architectural choice;
4. create a Runbook for a repeatable operation;
5. create a Proposal for an unapproved design;
6. link it from the nearest index and from at least one owning document.

Do not create a second vision, roadmap, glossary, module status registry, or onboarding entry point.

## Replacing and archiving

When replacing a document:

1. set the old document to `Status: Superseded`;
2. set its type to `Archive` when it has no continuing reference value, otherwise `Historical`;
3. populate `Superseded-By` with the new relative path;
4. populate the new document's `Supersedes` field;
5. update inbound links and indexes;
6. preserve the old document unless legal/security policy requires removal.

Archive sprint plans, completed validations, resolved inconsistency reports, obsolete screen blueprints, and pre-implementation discovery when they no longer describe current behavior.

## Resolving divergence

When documentation and implementation disagree:

1. do not silently choose either side;
2. determine whether the implementation is a defect, approved but undocumented behavior, or incomplete migration;
3. record the discrepancy in Module Status;
4. consult the accepted ADR and Canonical owner;
5. correct implementation or documentation through normal review;
6. add an ADR if resolving the conflict changes an architectural decision.

Historical evidence never legitimizes an architectural violation.

## Review cadence

- Canonical documents: review at least quarterly and after every relevant architectural change.
- Module Status: update with every feature delivery and review monthly.
- Runbooks: execute/review at least quarterly and after tooling/environment changes.
- References: review when their owner module changes.
- Proposals: close, accept, or archive when the decision is made.
- Historical/Archive: no periodic content refresh; verify links and metadata only.

Increment the major document version for changed authority or meaning, minor for added guidance, and patch for clarification without semantic change.

## Review checklist

- classification and lifecycle status are correct;
- owner, review date, version, and scope are present;
- terminology matches [Glossary](./GLOSSARY.md);
- current implementation maturity matches [Module Status](./MODULE_STATUS.md);
- Canonical and ADR statements do not conflict;
- internal links resolve;
- no secrets, personal credentials, or production identifiers are exposed;
- commands are safe and identify local versus remote effects;
- Proposal/Historical/Archive content is not presented as current instruction;
- important documents have inbound and outbound links.

## Drift detection

Documentation review must include:

- link validation;
- metadata validation for every Markdown file;
- duplicate title and duplicate responsibility detection;
- stale markers such as “pre-implementation”, “future”, and obsolete phase names;
- comparison of Module Status with routes, modules, migrations, permission keys, RPCs, and tests;
- comparison of ADR index with ADR files;
- verification that every migration-related change updates generated types and relevant references.

Automated checks may detect drift but do not decide architectural meaning. Owners resolve semantic conflicts.

## Pull request requirements

A documentation change is ready only when:

- the responsible owner can identify its authority and audience;
- links and metadata pass validation;
- replaced content is marked and linked;
- Module Status is updated when runtime capability changed;
- no unrelated architectural decision was introduced;
- the portal remains the single starting point.
