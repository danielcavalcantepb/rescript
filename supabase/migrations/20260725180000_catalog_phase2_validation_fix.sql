-- Catalog Phase 2 validation fix (Sprint 015.1)
-- Removes product columns not authorized by CatalogImplementationPlan §8.2 / §8.5.
-- Safe on greenfield (columns absent) and on environments that applied 20260725050000.

alter table public.product
  drop column if exists topology,
  drop column if exists default_unit_of_measure_id;

comment on column public.product.brand_id is
  'Catalog Phase 2 nullable FK (ImplementationPlan §8.2/§8.5). Legacy flows ignore.';
comment on column public.product.primary_category_id is
  'Catalog Phase 2 nullable FK (ImplementationPlan §8.5). Legacy category text remains app source.';
comment on column public.product.lifecycle_status is
  'Transitional Catalog lifecycle draft|active|archived (ImplementationPlan §8.2 status draft). Null = legacy status column only.';
