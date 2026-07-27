-- Sprint 023 — Inventory Foundation
-- Stock locations + variant/location inventory items (no ledger / movements).
-- Soft archive only. Reserved qty is a placeholder (always 0 until reservations).

-- ---------------------------------------------------------------------------
-- stock_location
-- ---------------------------------------------------------------------------
create table public.stock_location (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  code text not null check (
    char_length(trim(code)) >= 1
    and char_length(code) <= 32
  ),
  name text not null check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 120
  ),
  description text check (
    description is null
    or (
      char_length(trim(description)) >= 1
      and char_length(description) <= 500
    )
  ),
  is_default boolean not null default false,
  priority integer not null default 0
    check (priority >= 0 and priority <= 1000),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint stock_location_archive_status_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null and archived_by is null)
  )
);

create unique index stock_location_org_code_uidx
  on public.stock_location (organization_id, lower(code));

create unique index stock_location_org_default_uidx
  on public.stock_location (organization_id)
  where is_default = true and status <> 'archived';

create index stock_location_org_status_priority_idx
  on public.stock_location (organization_id, status, priority desc, name);

create trigger stock_location_set_updated_at
  before update on public.stock_location
  for each row execute function public.set_updated_at();

comment on table public.stock_location is
  'Organization stock location. Soft-archive only. One non-archived default per org.';

-- ---------------------------------------------------------------------------
-- inventory_item (variant × location snapshot — foundation, not ledger)
-- ---------------------------------------------------------------------------
create table public.inventory_item (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  location_id uuid not null references public.stock_location (id) on delete restrict,
  variant_id uuid not null references public.product_variant (id) on delete restrict,
  qty_on_hand numeric(18, 6) not null default 0 check (qty_on_hand >= 0),
  qty_reserved numeric(18, 6) not null default 0 check (qty_reserved >= 0),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint inventory_item_reserved_lte_on_hand_chk
    check (qty_reserved <= qty_on_hand),
  constraint inventory_item_archive_status_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null and archived_by is null)
  ),
  constraint inventory_item_org_location_variant_uidx
    unique (organization_id, location_id, variant_id)
);

create index inventory_item_org_variant_idx
  on public.inventory_item (organization_id, variant_id);

create index inventory_item_org_location_idx
  on public.inventory_item (organization_id, location_id);

create index inventory_item_org_status_idx
  on public.inventory_item (organization_id, status);

create trigger inventory_item_set_updated_at
  before update on public.inventory_item
  for each row execute function public.set_updated_at();

comment on table public.inventory_item is
  'Foundation stock snapshot per variant+location. qty_reserved placeholder until reservations. No movements in Sprint 023.';

-- ---------------------------------------------------------------------------
-- inventory_item_history (append-only audit)
-- ---------------------------------------------------------------------------
create table public.inventory_item_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  inventory_item_id uuid not null references public.inventory_item (id) on delete restrict,
  location_id uuid not null references public.stock_location (id) on delete restrict,
  variant_id uuid not null references public.product_variant (id) on delete restrict,
  field_name text not null check (
    field_name in ('qty_on_hand', 'qty_reserved', 'status', 'created')
  ),
  previous_value text,
  new_value text not null,
  reason text check (
    reason is null
    or (
      char_length(trim(reason)) >= 1
      and char_length(reason) <= 500
    )
  ),
  recorded_at timestamptz not null default now(),
  recorded_by uuid not null references auth.users (id)
);

create index inventory_item_history_org_item_idx
  on public.inventory_item_history (organization_id, inventory_item_id, recorded_at desc);

create index inventory_item_history_org_variant_idx
  on public.inventory_item_history (organization_id, variant_id, recorded_at desc);

comment on table public.inventory_item_history is
  'Append-only audit for inventory item changes. No UPDATE/DELETE.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.stock_location enable row level security;
alter table public.inventory_item enable row level security;
alter table public.inventory_item_history enable row level security;

create policy stock_location_select_member on public.stock_location
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy stock_location_insert_member on public.stock_location
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy stock_location_update_member on public.stock_location
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy inventory_item_select_member on public.inventory_item
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy inventory_item_insert_member on public.inventory_item
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy inventory_item_update_member on public.inventory_item
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy inventory_item_history_select_member on public.inventory_item_history
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy inventory_item_history_insert_member on public.inventory_item_history
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and recorded_by = auth.uid()
  );

grant select, insert, update on public.stock_location to authenticated;
grant select, insert, update on public.inventory_item to authenticated;
grant select, insert on public.inventory_item_history to authenticated;
