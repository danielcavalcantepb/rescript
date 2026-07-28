# ADR-0027 — Fiscal Source Metadata

Status: Accepted

Fiscal context is stored in an independent, tenant-scoped metadata aggregate. Sales Orders, Goods Receipts and Purchase Returns are referenced by source type and source ID; their aggregates do not receive fiscal columns.

Metadata is explicit: operation, tax profile, UFs, fiscal date and responsible user are required. No defaults are inferred. `INVENTORY_TRANSFER` remains registered but persistence is rejected until a canonical transfer aggregate exists.

The lifecycle is `Draft → Valid → Archived`. Valid records are immutable; a new context requires archiving the previous version and creating a new record. Active uniqueness is enforced per organization, source type and source ID.
