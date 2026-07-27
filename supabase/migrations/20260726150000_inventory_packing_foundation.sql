-- Inventory Packing Foundation.
-- Packing represents physical packaging of already picked items.
-- It never writes stock balance, inventory ledger, shipment, invoice,
-- accounts receivable, payments, cash flow or finance records.

create table public.inventory_packing_number_counter (
  organization_id uuid not null references public.organization (id) on delete restrict,
  last_value bigint not null default 0 check (last_value >= 0),
  primary key (organization_id)
);

create table public.inventory_packing (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  number text not null,
  picking_id uuid not null references public.inventory_picking (id) on delete restrict,
  picking_number text not null,
  reservation_id uuid not null references public.inventory_reservation (id) on delete restrict,
  reservation_number text not null,
  source_type text not null check (source_type in ('sales_order')),
  source_id uuid not null,
  source_number text not null,
  customer_id uuid,
  customer_name text not null,
  customer_document text,
  customer_email text,
  customer_phone text,
  location_id uuid not null references public.stock_location (id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'completed', 'cancelled')),
  total_quantity_picked numeric(19, 6) not null default 0
    check (total_quantity_picked >= 0),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  unique (organization_id, number),
  unique (organization_id, picking_id)
);

create table public.inventory_packing_item (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  packing_id uuid not null references public.inventory_packing (id) on delete restrict,
  picking_item_id uuid not null references public.inventory_picking_item (id) on delete restrict,
  reservation_item_id uuid not null references public.inventory_reservation_item (id) on delete restrict,
  product_id uuid not null,
  variant_id uuid not null,
  product_name text not null,
  variant_description text,
  sku text not null,
  unit_code text not null,
  location_id uuid not null references public.stock_location (id) on delete restrict,
  quantity_picked numeric(19, 6) not null check (quantity_picked > 0),
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'completed', 'cancelled')),
  sort_order integer not null,
  created_at timestamptz not null default now(),
  unique (packing_id, picking_item_id),
  unique (packing_id, sort_order)
);

create table public.inventory_packing_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  packing_id uuid not null references public.inventory_packing (id) on delete restrict,
  action text not null,
  old_value text,
  new_value text,
  reason text check (reason is null or char_length(reason) <= 500),
  actor_user_id uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.inventory_packing_search (
  packing_id uuid primary key references public.inventory_packing (id) on delete cascade,
  organization_id uuid not null,
  number text not null,
  picking_id uuid not null,
  picking_number text not null,
  reservation_id uuid not null,
  reservation_number text not null,
  source_type text not null,
  source_id uuid not null,
  source_number text not null,
  customer_name text not null,
  customer_document text,
  status text not null,
  total_quantity_picked numeric(19, 6) not null,
  packing_date date not null,
  created_at timestamptz not null,
  search_text text not null,
  updated_at timestamptz not null default now()
);

create index inventory_packing_org_status_created_idx
  on public.inventory_packing (organization_id, status, created_at desc);
create index inventory_packing_org_picking_idx
  on public.inventory_packing (organization_id, picking_id);
create index inventory_packing_org_source_idx
  on public.inventory_packing (organization_id, source_type, source_id);
create index inventory_packing_item_org_variant_idx
  on public.inventory_packing_item (organization_id, variant_id, status);
create index inventory_packing_item_org_picking_item_idx
  on public.inventory_packing_item (organization_id, picking_item_id);
create index inventory_packing_history_org_packing_idx
  on public.inventory_packing_history (organization_id, packing_id, created_at desc);
create index inventory_packing_search_filters_idx
  on public.inventory_packing_search (organization_id, status, created_at desc);
create index inventory_packing_search_text_idx
  on public.inventory_packing_search using gin (to_tsvector('simple', search_text));

create trigger inventory_packing_updated
  before update on public.inventory_packing
  for each row execute function public.set_updated_at();

create or replace function public.deny_inventory_packing_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'inventory_packing_history_immutable' using errcode = '42501';
end;
$$;

create trigger inventory_packing_history_no_update
  before update on public.inventory_packing_history
  for each row execute function public.deny_inventory_packing_history_mutation();

create trigger inventory_packing_history_no_delete
  before delete on public.inventory_packing_history
  for each row execute function public.deny_inventory_packing_history_mutation();

create or replace function public.packing_has_permission(
  p_org uuid,
  p_permission text
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select role
  into v_role
  from public.membership
  where organization_id = p_org
    and user_id = auth.uid()
    and status = 'active';

  if v_role is null then
    return false;
  end if;
  if v_role in ('owner', 'admin') then
    return true;
  end if;
  if p_permission = 'packing.read' then
    return v_role in ('manager', 'seller', 'inventory', 'viewer');
  end if;
  if p_permission in (
    'packing.create',
    'packing.edit',
    'packing.complete',
    'packing.cancel',
    'packing.archive'
  ) then
    return v_role in ('manager', 'seller', 'inventory');
  end if;
  return false;
end;
$$;

create or replace function public.packing_require_permission(
  p_org uuid,
  p_permission text
)
returns void
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.packing_has_permission(p_org, p_permission) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.packing_record_audit(
  p_org uuid,
  p_id uuid,
  p_action text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_regclass('public.audit_event') is not null then
    execute 'insert into public.audit_event(organization_id, actor_user_id, aggregate_type, aggregate_id, action, payload, created_at) values($1,$2,$3,$4,$5,$6,now())'
      using p_org, auth.uid(), 'inventory_packing', p_id, p_action, p_payload;
  end if;
exception when undefined_table or undefined_column then
  null;
end;
$$;

create or replace function public.allocate_inventory_packing_number(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v bigint;
begin
  insert into public.inventory_packing_number_counter (organization_id, last_value)
  values (p_org, 1)
  on conflict (organization_id)
  do update set last_value = public.inventory_packing_number_counter.last_value + 1
  returning last_value into v;

  return 'PKG-' || lpad(v::text, 6, '0');
end;
$$;

create or replace function public.refresh_inventory_packing_search(p_packing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory_packing_search (
    packing_id,
    organization_id,
    number,
    picking_id,
    picking_number,
    reservation_id,
    reservation_number,
    source_type,
    source_id,
    source_number,
    customer_name,
    customer_document,
    status,
    total_quantity_picked,
    packing_date,
    created_at,
    search_text
  )
  select
    p.id,
    p.organization_id,
    p.number,
    p.picking_id,
    p.picking_number,
    p.reservation_id,
    p.reservation_number,
    p.source_type,
    p.source_id,
    p.source_number,
    p.customer_name,
    p.customer_document,
    p.status,
    p.total_quantity_picked,
    p.created_at::date,
    p.created_at,
    lower(concat_ws(
      ' ',
      p.number,
      p.picking_number,
      p.reservation_number,
      p.source_number,
      p.customer_name,
      p.customer_document,
      p.status,
      p.created_at::date::text,
      p.total_quantity_picked::text,
      (
        select string_agg(concat_ws(' ', i.product_name, i.variant_description, i.sku, i.unit_code), ' ')
        from public.inventory_packing_item i
        where i.packing_id = p.id
      )
    ))
  from public.inventory_packing p
  where p.id = p_packing_id
  on conflict (packing_id) do update set
    picking_number = excluded.picking_number,
    reservation_number = excluded.reservation_number,
    source_number = excluded.source_number,
    customer_name = excluded.customer_name,
    customer_document = excluded.customer_document,
    status = excluded.status,
    total_quantity_picked = excluded.total_quantity_picked,
    search_text = excluded.search_text,
    updated_at = now();
end;
$$;

create or replace function public.trg_inventory_packing_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_inventory_packing_search(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_inventory_packing_item_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_inventory_packing_search(coalesce(new.packing_id, old.packing_id));
  return coalesce(new, old);
end;
$$;

create trigger inventory_packing_search_refresh
  after insert or update on public.inventory_packing
  for each row execute function public.trg_inventory_packing_search();

create trigger inventory_packing_item_search_refresh
  after insert or update or delete on public.inventory_packing_item
  for each row execute function public.trg_inventory_packing_item_search();

create or replace function public.create_inventory_packing(
  p_org uuid,
  p_picking_id uuid,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_picking public.inventory_picking%rowtype;
  v_id uuid;
  v_existing_id uuid;
  v_number text;
  v_total numeric;
begin
  perform public.packing_require_permission(p_org, 'packing.create');

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select id
  into v_existing_id
  from public.inventory_packing
  where organization_id = p_org
    and picking_id = p_picking_id;
  if found then
    return v_existing_id;
  end if;

  select *
  into v_picking
  from public.inventory_picking
  where id = p_picking_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'picking_not_found' using errcode = 'P0002';
  end if;
  if v_picking.status <> 'completed' then
    raise exception 'picking_not_completed' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.inventory_picking_item i
    where i.picking_id = v_picking.id
      and i.organization_id = p_org
      and i.status = 'completed'
      and i.quantity_picked > 0
  ) then
    raise exception 'packing_requires_completed_picking_items' using errcode = '22023';
  end if;

  v_id := gen_random_uuid();
  v_number := public.allocate_inventory_packing_number(p_org);

  insert into public.inventory_packing (
    id,
    organization_id,
    number,
    picking_id,
    picking_number,
    reservation_id,
    reservation_number,
    source_type,
    source_id,
    source_number,
    customer_id,
    customer_name,
    customer_document,
    customer_email,
    customer_phone,
    location_id,
    status,
    notes,
    created_by,
    updated_by
  ) values (
    v_id,
    p_org,
    v_number,
    v_picking.id,
    v_picking.number,
    v_picking.reservation_id,
    v_picking.reservation_number,
    v_picking.source_type,
    v_picking.source_id,
    v_picking.source_number,
    v_picking.customer_id,
    v_picking.customer_name,
    v_picking.customer_document,
    v_picking.customer_email,
    v_picking.customer_phone,
    v_picking.location_id,
    'draft',
    nullif(trim(coalesce(p_notes, '')), ''),
    v_uid,
    v_uid
  );

  insert into public.inventory_packing_item (
    organization_id,
    packing_id,
    picking_item_id,
    reservation_item_id,
    product_id,
    variant_id,
    product_name,
    variant_description,
    sku,
    unit_code,
    location_id,
    quantity_picked,
    status,
    sort_order
  )
  select
    p_org,
    v_id,
    i.id,
    i.reservation_item_id,
    i.product_id,
    i.variant_id,
    i.product_name,
    i.variant_description,
    i.sku,
    i.unit_code,
    i.location_id,
    i.quantity_picked,
    'draft',
    i.sort_order
  from public.inventory_picking_item i
  where i.picking_id = v_picking.id
    and i.organization_id = p_org
    and i.status = 'completed'
  order by i.sort_order;

  select sum(quantity_picked)
  into v_total
  from public.inventory_packing_item
  where packing_id = v_id
    and organization_id = p_org;

  update public.inventory_packing
  set total_quantity_picked = coalesce(v_total, 0),
      updated_by = v_uid
  where id = v_id
    and organization_id = p_org;

  insert into public.inventory_packing_history (
    organization_id,
    packing_id,
    action,
    new_value,
    actor_user_id
  ) values (
    p_org,
    v_id,
    'PackingCreated',
    v_number,
    v_uid
  );

  perform public.packing_record_audit(
    p_org,
    v_id,
    'PackingCreated',
    jsonb_build_object(
      'number', v_number,
      'pickingId', v_picking.id,
      'pickingNumber', v_picking.number,
      'reservationId', v_picking.reservation_id,
      'reservationNumber', v_picking.reservation_number,
      'salesOrderId', v_picking.source_id,
      'salesOrderNumber', v_picking.source_number
    )
  );

  return v_id;
end;
$$;

create or replace function public.start_inventory_packing(
  p_org uuid,
  p_packing_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_packing public.inventory_packing%rowtype;
begin
  perform public.packing_require_permission(p_org, 'packing.edit');

  select *
  into v_packing
  from public.inventory_packing
  where id = p_packing_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'packing_not_found' using errcode = 'P0002';
  end if;
  if v_packing.status = 'in_progress' then
    return p_packing_id;
  end if;
  if v_packing.status <> 'draft' then
    raise exception 'packing_not_startable' using errcode = '22023';
  end if;

  update public.inventory_packing_item
  set status = 'in_progress'
  where packing_id = p_packing_id
    and organization_id = p_org;

  update public.inventory_packing
  set status = 'in_progress',
      updated_by = v_uid
  where id = p_packing_id
    and organization_id = p_org;

  insert into public.inventory_packing_history (
    organization_id,
    packing_id,
    action,
    old_value,
    new_value,
    actor_user_id
  ) values (
    p_org,
    p_packing_id,
    'PackingStarted',
    v_packing.status,
    'in_progress',
    v_uid
  );

  perform public.packing_record_audit(
    p_org,
    p_packing_id,
    'PackingStarted',
    jsonb_build_object('from', v_packing.status, 'to', 'in_progress')
  );

  return p_packing_id;
end;
$$;

create or replace function public.complete_inventory_packing(
  p_org uuid,
  p_packing_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_packing public.inventory_packing%rowtype;
begin
  perform public.packing_require_permission(p_org, 'packing.complete');

  select *
  into v_packing
  from public.inventory_packing
  where id = p_packing_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'packing_not_found' using errcode = 'P0002';
  end if;
  if v_packing.status = 'completed' then
    return p_packing_id;
  end if;
  if v_packing.status <> 'in_progress' then
    raise exception 'packing_not_completable' using errcode = '22023';
  end if;

  update public.inventory_packing_item
  set status = 'completed'
  where packing_id = p_packing_id
    and organization_id = p_org;

  update public.inventory_packing
  set status = 'completed',
      updated_by = v_uid
  where id = p_packing_id
    and organization_id = p_org;

  insert into public.inventory_packing_history (
    organization_id,
    packing_id,
    action,
    old_value,
    new_value,
    actor_user_id
  ) values (
    p_org,
    p_packing_id,
    'PackingCompleted',
    v_packing.status,
    'completed',
    v_uid
  );

  perform public.packing_record_audit(
    p_org,
    p_packing_id,
    'PackingCompleted',
    jsonb_build_object('from', v_packing.status, 'to', 'completed')
  );

  return p_packing_id;
end;
$$;

create or replace function public.cancel_inventory_packing(
  p_org uuid,
  p_packing_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_packing public.inventory_packing%rowtype;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  perform public.packing_require_permission(p_org, 'packing.cancel');

  select *
  into v_packing
  from public.inventory_packing
  where id = p_packing_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'packing_not_found' using errcode = 'P0002';
  end if;
  if v_packing.status = 'cancelled' then
    return p_packing_id;
  end if;
  if v_packing.status = 'completed' then
    raise exception 'packing_not_cancellable' using errcode = '22023';
  end if;

  update public.inventory_packing_item
  set status = 'cancelled'
  where packing_id = p_packing_id
    and organization_id = p_org;

  update public.inventory_packing
  set status = 'cancelled',
      updated_by = v_uid
  where id = p_packing_id
    and organization_id = p_org;

  insert into public.inventory_packing_history (
    organization_id,
    packing_id,
    action,
    old_value,
    new_value,
    reason,
    actor_user_id
  ) values (
    p_org,
    p_packing_id,
    'PackingCancelled',
    v_packing.status,
    'cancelled',
    v_reason,
    v_uid
  );

  perform public.packing_record_audit(
    p_org,
    p_packing_id,
    'PackingCancelled',
    jsonb_build_object('from', v_packing.status, 'to', 'cancelled', 'reason', v_reason)
  );

  return p_packing_id;
end;
$$;

create or replace function public.get_inventory_packing(
  p_org uuid,
  p_packing_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v jsonb;
begin
  perform public.packing_require_permission(p_org, 'packing.read');

  select jsonb_build_object(
    'document', to_jsonb(p),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.sort_order)
      from public.inventory_packing_item i
      where i.packing_id = p.id
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(to_jsonb(h) order by h.created_at desc)
      from public.inventory_packing_history h
      where h.packing_id = p.id
    ), '[]'::jsonb)
  )
  into v
  from public.inventory_packing p
  where p.id = p_packing_id
    and p.organization_id = p_org;

  return v;
end;
$$;

create or replace function public.list_inventory_packings(
  p_org uuid,
  p_query text default null,
  p_status text default null,
  p_limit int default 50
)
returns setof public.inventory_packing_search
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.inventory_packing_search
  where organization_id = p_org
    and public.packing_has_permission(p_org, 'packing.read')
    and (p_status is null or status = p_status)
    and (
      nullif(trim(p_query), '') is null
      or to_tsvector('simple', search_text) @@ plainto_tsquery('simple', lower(trim(p_query)))
      or search_text like '%' || lower(trim(p_query)) || '%'
    )
  order by created_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

alter table public.inventory_packing_number_counter enable row level security;
alter table public.inventory_packing enable row level security;
alter table public.inventory_packing_item enable row level security;
alter table public.inventory_packing_history enable row level security;
alter table public.inventory_packing_search enable row level security;

create policy inventory_packing_number_counter_read
  on public.inventory_packing_number_counter
  for select to authenticated
  using (public.packing_has_permission(organization_id, 'packing.read'));

create policy inventory_packing_read
  on public.inventory_packing
  for select to authenticated
  using (public.packing_has_permission(organization_id, 'packing.read'));

create policy inventory_packing_item_read
  on public.inventory_packing_item
  for select to authenticated
  using (public.packing_has_permission(organization_id, 'packing.read'));

create policy inventory_packing_history_read
  on public.inventory_packing_history
  for select to authenticated
  using (public.packing_has_permission(organization_id, 'packing.read'));

create policy inventory_packing_search_read
  on public.inventory_packing_search
  for select to authenticated
  using (public.packing_has_permission(organization_id, 'packing.read'));

grant select on public.inventory_packing_number_counter to authenticated;
grant select on public.inventory_packing to authenticated;
grant select on public.inventory_packing_item to authenticated;
grant select on public.inventory_packing_history to authenticated;
grant select on public.inventory_packing_search to authenticated;

revoke all on function public.packing_has_permission(uuid, text) from public;
revoke all on function public.packing_require_permission(uuid, text) from public;
revoke all on function public.packing_record_audit(uuid, uuid, text, jsonb) from public;
revoke all on function public.allocate_inventory_packing_number(uuid) from public;
revoke all on function public.refresh_inventory_packing_search(uuid) from public;
revoke all on function public.create_inventory_packing(uuid, uuid, text) from public;
revoke all on function public.start_inventory_packing(uuid, uuid) from public;
revoke all on function public.complete_inventory_packing(uuid, uuid) from public;
revoke all on function public.cancel_inventory_packing(uuid, uuid, text) from public;
revoke all on function public.get_inventory_packing(uuid, uuid) from public;
revoke all on function public.list_inventory_packings(uuid, text, text, int) from public;

grant execute on function public.packing_has_permission(uuid, text) to authenticated;
grant execute on function public.create_inventory_packing(uuid, uuid, text) to authenticated;
grant execute on function public.start_inventory_packing(uuid, uuid) to authenticated;
grant execute on function public.complete_inventory_packing(uuid, uuid) to authenticated;
grant execute on function public.cancel_inventory_packing(uuid, uuid, text) to authenticated;
grant execute on function public.get_inventory_packing(uuid, uuid) to authenticated;
grant execute on function public.list_inventory_packings(uuid, text, text, int) to authenticated;
