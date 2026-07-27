-- Sprint 027 — Purchase Order Aggregate (Phase 7A)
-- Intention to buy only. No inventory / ledger / receiving side effects.

-- ---------------------------------------------------------------------------
-- Number allocator (PO-000001 …) per organization
-- ---------------------------------------------------------------------------
create table public.purchase_number_counter (
  organization_id uuid primary key references public.organization (id) on delete restrict,
  last_value bigint not null default 0 check (last_value >= 0)
);

alter table public.purchase_number_counter enable row level security;

create policy purchase_number_counter_select_member
  on public.purchase_number_counter for select to authenticated
  using (public.is_org_member(organization_id));

-- Writes only via SECURITY DEFINER allocator
grant select on public.purchase_number_counter to authenticated;

create or replace function public.allocate_purchase_number(p_organization_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_val bigint;
begin
  if auth.uid() is null or not public.is_org_member(p_organization_id) then
    raise exception 'not_org_member' using errcode = '42501';
  end if;

  insert into public.purchase_number_counter (organization_id, last_value)
  values (p_organization_id, 1)
  on conflict (organization_id) do update
    set last_value = public.purchase_number_counter.last_value + 1
  returning last_value into next_val;

  return 'PO-' || lpad(next_val::text, 6, '0');
end;
$$;

grant execute on function public.allocate_purchase_number(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Purchase order
-- ---------------------------------------------------------------------------
create table public.purchase_order (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  number text not null,
  supplier_id uuid not null references public.supplier (id) on delete restrict,
  supplier_legal_name text not null,
  supplier_document text,
  supplier_email text,
  supplier_phone text,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'cancelled', 'closed', 'archived')),
  previous_status text
    check (
      previous_status is null
      or previous_status in ('draft', 'approved', 'cancelled', 'closed')
    ),
  currency text not null default 'BRL' check (char_length(currency) = 3),
  subtotal numeric(18, 4) not null default 0 check (subtotal >= 0),
  discount_total numeric(18, 4) not null default 0 check (discount_total >= 0),
  grand_total numeric(18, 4) not null default 0 check (grand_total >= 0),
  notes text check (notes is null or char_length(notes) <= 4000),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint purchase_order_archive_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null and archived_by is null)
  ),
  constraint purchase_order_org_number_uidx unique (organization_id, number)
);

create index purchase_order_org_status_idx
  on public.purchase_order (organization_id, status);

create index purchase_order_org_supplier_idx
  on public.purchase_order (organization_id, supplier_id);

create index purchase_order_org_created_idx
  on public.purchase_order (organization_id, created_at desc);

create trigger purchase_order_set_updated_at
  before update on public.purchase_order
  for each row execute function public.set_updated_at();

comment on table public.purchase_order is
  'Purchase intention aggregate. Snapshots frozen; never mutates inventory/ledger.';

-- ---------------------------------------------------------------------------
-- Items
-- ---------------------------------------------------------------------------
create table public.purchase_item (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  purchase_order_id uuid not null references public.purchase_order (id) on delete restrict,
  variant_id uuid not null references public.product_variant (id) on delete restrict,
  variant_sku text,
  variant_name text not null,
  unit_code text not null,
  description text,
  quantity numeric(18, 4) not null check (quantity > 0),
  unit_price numeric(18, 4) not null check (unit_price >= 0),
  currency text not null default 'BRL' check (char_length(currency) = 3),
  discount numeric(18, 4) not null default 0 check (discount >= 0),
  subtotal numeric(18, 4) not null check (subtotal >= 0),
  total numeric(18, 4) not null check (total >= 0),
  price_list_id uuid,
  price_source text not null default 'manual'
    check (price_source in ('price_list', 'manual')),
  sort_order integer not null default 0,
  status text not null default 'active'
    check (status in ('active', 'removed')),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint purchase_item_removed_chk check (
    (status = 'removed' and removed_at is not null)
    or (status = 'active' and removed_at is null)
  )
);

create index purchase_item_org_po_idx
  on public.purchase_item (organization_id, purchase_order_id);

create index purchase_item_org_variant_idx
  on public.purchase_item (organization_id, variant_id);

create trigger purchase_item_set_updated_at
  before update on public.purchase_item
  for each row execute function public.set_updated_at();

comment on table public.purchase_item is
  'PO lines with immutable variant/price snapshots. Soft-remove only.';

-- ---------------------------------------------------------------------------
-- History (append-only)
-- ---------------------------------------------------------------------------
create table public.purchase_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  purchase_order_id uuid not null references public.purchase_order (id) on delete restrict,
  action text not null,
  field_name text,
  old_value text,
  new_value text,
  reason text,
  actor_user_id uuid not null references auth.users (id),
  actor_ip text,
  created_at timestamptz not null default now()
);

create index purchase_history_org_po_created_idx
  on public.purchase_history (organization_id, purchase_order_id, created_at desc);

create or replace function public.deny_purchase_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('purchase.allow_history_admin', true) = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'purchase_history_immutable' using errcode = '42501';
end;
$$;

create trigger purchase_history_no_update
  before update on public.purchase_history
  for each row execute function public.deny_purchase_history_mutation();

create trigger purchase_history_no_delete
  before delete on public.purchase_history
  for each row execute function public.deny_purchase_history_mutation();

-- ---------------------------------------------------------------------------
-- Search projection
-- ---------------------------------------------------------------------------
create table public.purchase_search (
  purchase_order_id uuid primary key
    references public.purchase_order (id) on delete cascade,
  organization_id uuid not null references public.organization (id) on delete restrict,
  number text not null,
  supplier_legal_name text not null,
  supplier_document text,
  status text not null,
  currency text not null,
  grand_total numeric(18, 4) not null default 0,
  created_at timestamptz not null,
  search_text text not null default '',
  updated_at timestamptz not null default now()
);

create index purchase_search_org_status_idx
  on public.purchase_search (organization_id, status);

create index purchase_search_org_number_idx
  on public.purchase_search (organization_id, number);

create index purchase_search_org_created_idx
  on public.purchase_search (organization_id, created_at desc);

create index purchase_search_org_search_text_idx
  on public.purchase_search using gin (to_tsvector('simple', search_text));

create or replace function public.refresh_purchase_search(p_purchase_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  po public.purchase_order%rowtype;
begin
  select * into po from public.purchase_order where id = p_purchase_order_id;
  if not found then
    delete from public.purchase_search where purchase_order_id = p_purchase_order_id;
    return;
  end if;

  insert into public.purchase_search (
    purchase_order_id,
    organization_id,
    number,
    supplier_legal_name,
    supplier_document,
    status,
    currency,
    grand_total,
    created_at,
    search_text,
    updated_at
  )
  values (
    po.id,
    po.organization_id,
    po.number,
    po.supplier_legal_name,
    po.supplier_document,
    po.status,
    po.currency,
    po.grand_total,
    po.created_at,
    lower(concat_ws(
      ' ',
      po.number,
      po.supplier_legal_name,
      coalesce(po.supplier_document, ''),
      coalesce(po.supplier_email, ''),
      coalesce(po.notes, '')
    )),
    now()
  )
  on conflict (purchase_order_id) do update set
    organization_id = excluded.organization_id,
    number = excluded.number,
    supplier_legal_name = excluded.supplier_legal_name,
    supplier_document = excluded.supplier_document,
    status = excluded.status,
    currency = excluded.currency,
    grand_total = excluded.grand_total,
    created_at = excluded.created_at,
    search_text = excluded.search_text,
    updated_at = now();
end;
$$;

create or replace function public.trg_refresh_purchase_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_purchase_search(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create trigger purchase_order_search_refresh
  after insert or update on public.purchase_order
  for each row execute function public.trg_refresh_purchase_search();

grant execute on function public.refresh_purchase_search(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.purchase_order enable row level security;
alter table public.purchase_item enable row level security;
alter table public.purchase_history enable row level security;
alter table public.purchase_search enable row level security;

create policy purchase_order_select_member
  on public.purchase_order for select to authenticated
  using (public.is_org_member(organization_id));

create policy purchase_order_insert_member
  on public.purchase_order for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy purchase_order_update_member
  on public.purchase_order for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy purchase_item_select_member
  on public.purchase_item for select to authenticated
  using (public.is_org_member(organization_id));

create policy purchase_item_insert_member
  on public.purchase_item for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy purchase_item_update_member
  on public.purchase_item for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy purchase_history_select_member
  on public.purchase_history for select to authenticated
  using (public.is_org_member(organization_id));

create policy purchase_history_insert_member
  on public.purchase_history for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and actor_user_id = auth.uid()
  );

create policy purchase_search_select_member
  on public.purchase_search for select to authenticated
  using (public.is_org_member(organization_id));

grant select, insert, update on public.purchase_order to authenticated;
grant select, insert, update on public.purchase_item to authenticated;
grant select, insert on public.purchase_history to authenticated;
grant select on public.purchase_search to authenticated;
