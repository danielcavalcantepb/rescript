-- Products bounded context (catalog only — no inventory/sales/pricing)
-- Tenant isolation via is_org_member; app enforces products.* permissions.

create table public.product (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  name text not null check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 200
  ),
  description text check (
    description is null or char_length(description) <= 2000
  ),
  sku text not null check (
    char_length(trim(sku)) >= 1
    and char_length(sku) <= 64
  ),
  category text check (
    category is null or char_length(category) <= 120
  ),
  unit text not null check (
    char_length(trim(unit)) >= 1
    and char_length(unit) <= 32
  ),
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint product_archive_status_chk check (
    (status = 'inactive' and archived_at is not null)
    or (status = 'active' and archived_at is null and archived_by is null)
  )
);

create index product_org_status_idx
  on public.product (organization_id, status);

create index product_org_name_idx
  on public.product (organization_id, name);

create index product_org_created_idx
  on public.product (organization_id, created_at desc);

-- SKU unique per organization (normalized uppercase stored by app)
create unique index product_org_sku_uidx
  on public.product (organization_id, sku);

create trigger product_set_updated_at
  before update on public.product
  for each row execute function public.set_updated_at();

comment on table public.product is
  'Product catalog aggregate. Soft-archive via status+archived_at; never hard delete. No stock/price.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.product enable row level security;

create policy product_select_member
  on public.product
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy product_insert_member
  on public.product
  for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy product_update_member
  on public.product
  for update
  to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- No DELETE policy — archive via UPDATE only

grant select, insert, update on public.product to authenticated;
