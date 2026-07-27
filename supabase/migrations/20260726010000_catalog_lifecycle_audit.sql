-- Catalog Product lifecycle audit (Sprint 020) — append-only, tenant-scoped.

create table public.catalog_product_lifecycle_event (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  product_id uuid not null references public.product (id) on delete restrict,
  from_status text not null
    check (from_status in ('draft', 'active', 'archived')),
  to_status text not null
    check (to_status in ('draft', 'active', 'archived')),
  action text not null
    check (action in ('publish', 'archive', 'restore', 'deactivate')),
  reason text check (
    reason is null
    or (
      char_length(trim(reason)) >= 1
      and char_length(reason) <= 500
    )
  ),
  actor_user_id uuid not null references auth.users (id),
  occurred_at timestamptz not null default now()
);

create index catalog_product_lifecycle_event_product_occurred_idx
  on public.catalog_product_lifecycle_event (organization_id, product_id, occurred_at desc);

comment on table public.catalog_product_lifecycle_event is
  'Append-only Catalog Product lifecycle audit (publish/archive/restore).';

alter table public.catalog_product_lifecycle_event enable row level security;

create policy catalog_lifecycle_event_select_member
  on public.catalog_product_lifecycle_event
  for select
  to authenticated
  using (
    exists (
      select 1 from public.membership m
      where m.organization_id = catalog_product_lifecycle_event.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

create policy catalog_lifecycle_event_insert_member
  on public.catalog_product_lifecycle_event
  for insert
  to authenticated
  with check (
    actor_user_id = auth.uid()
    and exists (
      select 1 from public.membership m
      where m.organization_id = catalog_product_lifecycle_event.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- No update/delete policies — append-only.

grant select, insert on public.catalog_product_lifecycle_event to authenticated;
