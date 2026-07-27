-- Inventory Picking Foundation.
-- Picking represents physical separation of already reserved items.
-- It never writes stock balance, inventory ledger, shipment, invoice,
-- accounts receivable, payments, cash flow or finance records.

create table public.inventory_picking_number_counter (
  organization_id uuid not null references public.organization (id) on delete restrict,
  last_value bigint not null default 0 check (last_value >= 0),
  primary key (organization_id)
);

create table public.inventory_picking (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  number text not null,
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
    check (status in ('draft', 'in_progress', 'partially_picked', 'completed', 'cancelled')),
  total_quantity_reserved numeric(19, 6) not null default 0
    check (total_quantity_reserved >= 0),
  total_quantity_picked numeric(19, 6) not null default 0
    check (total_quantity_picked >= 0 and total_quantity_picked <= total_quantity_reserved),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  unique (organization_id, number),
  unique (organization_id, reservation_id)
);

create table public.inventory_picking_item (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  picking_id uuid not null references public.inventory_picking (id) on delete restrict,
  reservation_item_id uuid not null references public.inventory_reservation_item (id) on delete restrict,
  product_id uuid not null,
  variant_id uuid not null,
  product_name text not null,
  variant_description text,
  sku text not null,
  unit_code text not null,
  location_id uuid not null references public.stock_location (id) on delete restrict,
  quantity_reserved numeric(19, 6) not null check (quantity_reserved > 0),
  quantity_picked numeric(19, 6) not null default 0 check (quantity_picked >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'partially_picked', 'completed', 'cancelled')),
  sort_order integer not null,
  created_at timestamptz not null default now(),
  check (quantity_picked <= quantity_reserved),
  unique (picking_id, reservation_item_id),
  unique (picking_id, sort_order)
);

create table public.inventory_picking_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  picking_id uuid not null references public.inventory_picking (id) on delete restrict,
  action text not null,
  old_value text,
  new_value text,
  reason text check (reason is null or char_length(reason) <= 500),
  actor_user_id uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.inventory_picking_search (
  picking_id uuid primary key references public.inventory_picking (id) on delete cascade,
  organization_id uuid not null,
  number text not null,
  reservation_id uuid not null,
  reservation_number text not null,
  source_type text not null,
  source_id uuid not null,
  source_number text not null,
  customer_name text not null,
  customer_document text,
  status text not null,
  total_quantity_reserved numeric(19, 6) not null,
  total_quantity_picked numeric(19, 6) not null,
  picking_date date not null,
  created_at timestamptz not null,
  search_text text not null,
  updated_at timestamptz not null default now()
);

create index inventory_picking_org_status_created_idx
  on public.inventory_picking (organization_id, status, created_at desc);
create index inventory_picking_org_reservation_idx
  on public.inventory_picking (organization_id, reservation_id);
create index inventory_picking_org_source_idx
  on public.inventory_picking (organization_id, source_type, source_id);
create index inventory_picking_item_org_variant_idx
  on public.inventory_picking_item (organization_id, variant_id, status);
create index inventory_picking_item_org_reservation_item_idx
  on public.inventory_picking_item (organization_id, reservation_item_id);
create index inventory_picking_history_org_picking_idx
  on public.inventory_picking_history (organization_id, picking_id, created_at desc);
create index inventory_picking_search_filters_idx
  on public.inventory_picking_search (organization_id, status, created_at desc);
create index inventory_picking_search_text_idx
  on public.inventory_picking_search using gin (to_tsvector('simple', search_text));

create trigger inventory_picking_updated
  before update on public.inventory_picking
  for each row execute function public.set_updated_at();

create or replace function public.deny_inventory_picking_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'inventory_picking_history_immutable' using errcode = '42501';
end;
$$;

create trigger inventory_picking_history_no_update
  before update on public.inventory_picking_history
  for each row execute function public.deny_inventory_picking_history_mutation();

create trigger inventory_picking_history_no_delete
  before delete on public.inventory_picking_history
  for each row execute function public.deny_inventory_picking_history_mutation();

create or replace function public.picking_has_permission(
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
  if p_permission = 'picking.read' then
    return v_role in ('manager', 'seller', 'inventory', 'viewer');
  end if;
  if p_permission in (
    'picking.create',
    'picking.edit',
    'picking.start',
    'picking.complete',
    'picking.cancel',
    'picking.archive'
  ) then
    return v_role in ('manager', 'seller', 'inventory');
  end if;
  return false;
end;
$$;

create or replace function public.picking_require_permission(
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
  if not public.picking_has_permission(p_org, p_permission) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.picking_record_audit(
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
      using p_org, auth.uid(), 'inventory_picking', p_id, p_action, p_payload;
  end if;
exception when undefined_table or undefined_column then
  null;
end;
$$;

create or replace function public.allocate_inventory_picking_number(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v bigint;
begin
  insert into public.inventory_picking_number_counter (organization_id, last_value)
  values (p_org, 1)
  on conflict (organization_id)
  do update set last_value = public.inventory_picking_number_counter.last_value + 1
  returning last_value into v;

  return 'PCK-' || lpad(v::text, 6, '0');
end;
$$;

create or replace function public.refresh_inventory_picking_search(p_picking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory_picking_search (
    picking_id,
    organization_id,
    number,
    reservation_id,
    reservation_number,
    source_type,
    source_id,
    source_number,
    customer_name,
    customer_document,
    status,
    total_quantity_reserved,
    total_quantity_picked,
    picking_date,
    created_at,
    search_text
  )
  select
    p.id,
    p.organization_id,
    p.number,
    p.reservation_id,
    p.reservation_number,
    p.source_type,
    p.source_id,
    p.source_number,
    p.customer_name,
    p.customer_document,
    p.status,
    p.total_quantity_reserved,
    p.total_quantity_picked,
    p.created_at::date,
    p.created_at,
    lower(concat_ws(
      ' ',
      p.number,
      p.reservation_number,
      p.source_number,
      p.customer_name,
      p.customer_document,
      p.status,
      p.created_at::date::text,
      p.total_quantity_reserved::text,
      p.total_quantity_picked::text,
      (
        select string_agg(concat_ws(' ', i.product_name, i.variant_description, i.sku, i.unit_code), ' ')
        from public.inventory_picking_item i
        where i.picking_id = p.id
      )
    ))
  from public.inventory_picking p
  where p.id = p_picking_id
  on conflict (picking_id) do update set
    reservation_number = excluded.reservation_number,
    source_number = excluded.source_number,
    customer_name = excluded.customer_name,
    customer_document = excluded.customer_document,
    status = excluded.status,
    total_quantity_reserved = excluded.total_quantity_reserved,
    total_quantity_picked = excluded.total_quantity_picked,
    search_text = excluded.search_text,
    updated_at = now();
end;
$$;

create or replace function public.trg_inventory_picking_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_inventory_picking_search(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_inventory_picking_item_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_inventory_picking_search(coalesce(new.picking_id, old.picking_id));
  return coalesce(new, old);
end;
$$;

create trigger inventory_picking_search_refresh
  after insert or update on public.inventory_picking
  for each row execute function public.trg_inventory_picking_search();

create trigger inventory_picking_item_search_refresh
  after insert or update or delete on public.inventory_picking_item
  for each row execute function public.trg_inventory_picking_item_search();

create or replace function public.create_inventory_picking(
  p_org uuid,
  p_reservation_id uuid,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reservation public.inventory_reservation%rowtype;
  v_id uuid;
  v_existing_id uuid;
  v_number text;
  v_total numeric;
begin
  perform public.picking_require_permission(p_org, 'picking.create');

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select id
  into v_existing_id
  from public.inventory_picking
  where organization_id = p_org
    and reservation_id = p_reservation_id;
  if found then
    return v_existing_id;
  end if;

  select *
  into v_reservation
  from public.inventory_reservation
  where id = p_reservation_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'reservation_not_found' using errcode = 'P0002';
  end if;
  if v_reservation.status <> 'active' then
    raise exception 'reservation_not_active' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.inventory_reservation_item i
    where i.reservation_id = v_reservation.id
      and i.organization_id = p_org
      and i.status = 'active'
  ) then
    raise exception 'picking_requires_active_reservation_items' using errcode = '22023';
  end if;

  v_id := gen_random_uuid();
  v_number := public.allocate_inventory_picking_number(p_org);

  insert into public.inventory_picking (
    id,
    organization_id,
    number,
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
    v_reservation.id,
    v_reservation.number,
    v_reservation.source_type,
    v_reservation.source_id,
    v_reservation.source_number,
    v_reservation.customer_id,
    v_reservation.customer_name,
    v_reservation.customer_document,
    v_reservation.customer_email,
    v_reservation.customer_phone,
    v_reservation.location_id,
    'draft',
    nullif(trim(coalesce(p_notes, '')), ''),
    v_uid,
    v_uid
  );

  insert into public.inventory_picking_item (
    organization_id,
    picking_id,
    reservation_item_id,
    product_id,
    variant_id,
    product_name,
    variant_description,
    sku,
    unit_code,
    location_id,
    quantity_reserved,
    quantity_picked,
    status,
    sort_order
  )
  select
    p_org,
    v_id,
    i.id,
    i.product_id,
    i.variant_id,
    i.product_name,
    i.variant_description,
    i.sku,
    i.unit_code,
    i.location_id,
    i.quantity_reserved,
    0,
    'draft',
    i.sort_order
  from public.inventory_reservation_item i
  where i.reservation_id = v_reservation.id
    and i.organization_id = p_org
    and i.status = 'active'
  order by i.sort_order;

  select sum(quantity_reserved)
  into v_total
  from public.inventory_picking_item
  where picking_id = v_id
    and organization_id = p_org;

  update public.inventory_picking
  set total_quantity_reserved = coalesce(v_total, 0),
      updated_by = v_uid
  where id = v_id
    and organization_id = p_org;

  insert into public.inventory_picking_history (
    organization_id,
    picking_id,
    action,
    new_value,
    actor_user_id
  ) values (
    p_org,
    v_id,
    'PickingCreated',
    v_number,
    v_uid
  );

  perform public.picking_record_audit(
    p_org,
    v_id,
    'PickingCreated',
    jsonb_build_object(
      'number', v_number,
      'reservationId', v_reservation.id,
      'reservationNumber', v_reservation.number,
      'salesOrderId', v_reservation.source_id,
      'salesOrderNumber', v_reservation.source_number
    )
  );

  return v_id;
end;
$$;

create or replace function public.start_inventory_picking(
  p_org uuid,
  p_picking_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_picking public.inventory_picking%rowtype;
begin
  perform public.picking_require_permission(p_org, 'picking.start');

  select *
  into v_picking
  from public.inventory_picking
  where id = p_picking_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'picking_not_found' using errcode = 'P0002';
  end if;
  if v_picking.status = 'in_progress' then
    return p_picking_id;
  end if;
  if v_picking.status <> 'draft' then
    raise exception 'picking_not_startable' using errcode = '22023';
  end if;

  update public.inventory_picking_item
  set status = 'in_progress'
  where picking_id = p_picking_id
    and organization_id = p_org;

  update public.inventory_picking
  set status = 'in_progress',
      updated_by = v_uid
  where id = p_picking_id
    and organization_id = p_org;

  insert into public.inventory_picking_history (
    organization_id,
    picking_id,
    action,
    old_value,
    new_value,
    actor_user_id
  ) values (
    p_org,
    p_picking_id,
    'PickingStarted',
    v_picking.status,
    'in_progress',
    v_uid
  );

  perform public.picking_record_audit(
    p_org,
    p_picking_id,
    'PickingStarted',
    jsonb_build_object('from', v_picking.status, 'to', 'in_progress')
  );

  return p_picking_id;
end;
$$;

create or replace function public.update_inventory_picking_items(
  p_org uuid,
  p_picking_id uuid,
  p_items jsonb,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_picking public.inventory_picking%rowtype;
  v_payload record;
  v_update record;
  v_quantity numeric;
  v_total_reserved numeric;
  v_total_picked numeric;
  v_status text;
  v_expected int := 0;
  v_matched int := 0;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_uuid_rx text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
begin
  perform public.picking_require_permission(p_org, 'picking.edit');

  select *
  into v_picking
  from public.inventory_picking
  where id = p_picking_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'picking_not_found' using errcode = 'P0002';
  end if;
  if v_picking.status not in ('in_progress', 'partially_picked') then
    raise exception 'picking_not_editable' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid_picking_items' using errcode = '22023';
  end if;

  for v_payload in select value as x from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_payload.x) <> 'object'
      or coalesce(v_payload.x ->> 'itemId', '') !~ v_uuid_rx
      or coalesce(v_payload.x ->> 'quantity', '') !~ '^[0-9]+(\.[0-9]{1,6})?$'
    then
      raise exception 'invalid_picking_items' using errcode = '22023';
    end if;
  end loop;

  if exists (
    select 1
    from (
      select value ->> 'itemId' as item_id
      from jsonb_array_elements(p_items)
      group by value ->> 'itemId'
      having count(*) > 1
    ) d
  ) then
    raise exception 'invalid_picking_items' using errcode = '22023';
  end if;

  v_expected := jsonb_array_length(p_items);

  for v_update in
    select
      i.id,
      i.quantity_reserved,
      x.value ->> 'quantity' as quantity
    from public.inventory_picking_item i
    join lateral jsonb_array_elements(p_items) x(value)
      on (x.value ->> 'itemId')::uuid = i.id
    where i.picking_id = p_picking_id
      and i.organization_id = p_org
    order by i.variant_id, i.id
    for update of i
  loop
    v_matched := v_matched + 1;
    v_quantity := v_update.quantity::numeric;

    if v_quantity < 0 then
      raise exception 'invalid_picking_quantity' using errcode = '22023';
    end if;
    if v_quantity > v_update.quantity_reserved then
      raise exception 'picked_quantity_exceeds_reserved' using errcode = '22023';
    end if;

    update public.inventory_picking_item
    set quantity_picked = v_quantity,
        status = case
          when v_quantity = 0 then 'in_progress'
          when v_quantity = v_update.quantity_reserved then 'completed'
          else 'partially_picked'
        end
    where id = v_update.id
      and organization_id = p_org;
  end loop;

  if v_matched <> v_expected then
    raise exception 'picking_item_not_found' using errcode = 'P0002';
  end if;

  select
    coalesce(sum(quantity_reserved), 0),
    coalesce(sum(quantity_picked), 0)
  into v_total_reserved, v_total_picked
  from public.inventory_picking_item
  where picking_id = p_picking_id
    and organization_id = p_org;

  v_status := case
    when v_total_picked > 0 then 'partially_picked'
    else 'in_progress'
  end;

  update public.inventory_picking
  set status = v_status,
      total_quantity_picked = v_total_picked,
      updated_by = v_uid
  where id = p_picking_id
    and organization_id = p_org;

  insert into public.inventory_picking_history (
    organization_id,
    picking_id,
    action,
    old_value,
    new_value,
    reason,
    actor_user_id
  ) values (
    p_org,
    p_picking_id,
    'PickingUpdated',
    v_picking.status,
    v_status,
    v_reason,
    v_uid
  );

  perform public.picking_record_audit(
    p_org,
    p_picking_id,
    'PickingUpdated',
    jsonb_build_object(
      'from', v_picking.status,
      'to', v_status,
      'totalQuantityPicked', v_total_picked,
      'reason', v_reason
    )
  );

  return p_picking_id;
end;
$$;

create or replace function public.complete_inventory_picking(
  p_org uuid,
  p_picking_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_picking public.inventory_picking%rowtype;
begin
  perform public.picking_require_permission(p_org, 'picking.complete');

  select *
  into v_picking
  from public.inventory_picking
  where id = p_picking_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'picking_not_found' using errcode = 'P0002';
  end if;
  if v_picking.status = 'completed' then
    return p_picking_id;
  end if;
  if v_picking.status not in ('in_progress', 'partially_picked') then
    raise exception 'picking_not_completable' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.inventory_picking_item i
    where i.picking_id = p_picking_id
      and i.organization_id = p_org
      and i.quantity_picked <> i.quantity_reserved
  ) then
    raise exception 'picking_not_fully_picked' using errcode = '22023';
  end if;

  update public.inventory_picking_item
  set status = 'completed'
  where picking_id = p_picking_id
    and organization_id = p_org;

  update public.inventory_picking
  set status = 'completed',
      total_quantity_picked = total_quantity_reserved,
      updated_by = v_uid
  where id = p_picking_id
    and organization_id = p_org;

  insert into public.inventory_picking_history (
    organization_id,
    picking_id,
    action,
    old_value,
    new_value,
    actor_user_id
  ) values (
    p_org,
    p_picking_id,
    'PickingCompleted',
    v_picking.status,
    'completed',
    v_uid
  );

  perform public.picking_record_audit(
    p_org,
    p_picking_id,
    'PickingCompleted',
    jsonb_build_object('from', v_picking.status, 'to', 'completed')
  );

  return p_picking_id;
end;
$$;

create or replace function public.cancel_inventory_picking(
  p_org uuid,
  p_picking_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_picking public.inventory_picking%rowtype;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  perform public.picking_require_permission(p_org, 'picking.cancel');

  select *
  into v_picking
  from public.inventory_picking
  where id = p_picking_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'picking_not_found' using errcode = 'P0002';
  end if;
  if v_picking.status = 'cancelled' then
    return p_picking_id;
  end if;
  if v_picking.status = 'completed' then
    raise exception 'picking_not_cancellable' using errcode = '22023';
  end if;

  update public.inventory_picking_item
  set status = 'cancelled'
  where picking_id = p_picking_id
    and organization_id = p_org;

  update public.inventory_picking
  set status = 'cancelled',
      updated_by = v_uid
  where id = p_picking_id
    and organization_id = p_org;

  insert into public.inventory_picking_history (
    organization_id,
    picking_id,
    action,
    old_value,
    new_value,
    reason,
    actor_user_id
  ) values (
    p_org,
    p_picking_id,
    'PickingCancelled',
    v_picking.status,
    'cancelled',
    v_reason,
    v_uid
  );

  perform public.picking_record_audit(
    p_org,
    p_picking_id,
    'PickingCancelled',
    jsonb_build_object('from', v_picking.status, 'to', 'cancelled', 'reason', v_reason)
  );

  return p_picking_id;
end;
$$;

create or replace function public.get_inventory_picking(
  p_org uuid,
  p_picking_id uuid
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
  perform public.picking_require_permission(p_org, 'picking.read');

  select jsonb_build_object(
    'document', to_jsonb(p),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.sort_order)
      from public.inventory_picking_item i
      where i.picking_id = p.id
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(to_jsonb(h) order by h.created_at desc)
      from public.inventory_picking_history h
      where h.picking_id = p.id
    ), '[]'::jsonb)
  )
  into v
  from public.inventory_picking p
  where p.id = p_picking_id
    and p.organization_id = p_org;

  return v;
end;
$$;

create or replace function public.list_inventory_pickings(
  p_org uuid,
  p_query text default null,
  p_status text default null,
  p_limit int default 50
)
returns setof public.inventory_picking_search
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.inventory_picking_search
  where organization_id = p_org
    and public.picking_has_permission(p_org, 'picking.read')
    and (p_status is null or status = p_status)
    and (
      nullif(trim(p_query), '') is null
      or to_tsvector('simple', search_text) @@ plainto_tsquery('simple', lower(trim(p_query)))
      or search_text like '%' || lower(trim(p_query)) || '%'
    )
  order by created_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

alter table public.inventory_picking_number_counter enable row level security;
alter table public.inventory_picking enable row level security;
alter table public.inventory_picking_item enable row level security;
alter table public.inventory_picking_history enable row level security;
alter table public.inventory_picking_search enable row level security;

create policy inventory_picking_number_counter_read
  on public.inventory_picking_number_counter
  for select to authenticated
  using (public.picking_has_permission(organization_id, 'picking.read'));

create policy inventory_picking_read
  on public.inventory_picking
  for select to authenticated
  using (public.picking_has_permission(organization_id, 'picking.read'));

create policy inventory_picking_item_read
  on public.inventory_picking_item
  for select to authenticated
  using (public.picking_has_permission(organization_id, 'picking.read'));

create policy inventory_picking_history_read
  on public.inventory_picking_history
  for select to authenticated
  using (public.picking_has_permission(organization_id, 'picking.read'));

create policy inventory_picking_search_read
  on public.inventory_picking_search
  for select to authenticated
  using (public.picking_has_permission(organization_id, 'picking.read'));

grant select on public.inventory_picking_number_counter to authenticated;
grant select on public.inventory_picking to authenticated;
grant select on public.inventory_picking_item to authenticated;
grant select on public.inventory_picking_history to authenticated;
grant select on public.inventory_picking_search to authenticated;

revoke all on function public.picking_has_permission(uuid, text) from public;
revoke all on function public.picking_require_permission(uuid, text) from public;
revoke all on function public.picking_record_audit(uuid, uuid, text, jsonb) from public;
revoke all on function public.allocate_inventory_picking_number(uuid) from public;
revoke all on function public.refresh_inventory_picking_search(uuid) from public;
revoke all on function public.create_inventory_picking(uuid, uuid, text) from public;
revoke all on function public.start_inventory_picking(uuid, uuid) from public;
revoke all on function public.update_inventory_picking_items(uuid, uuid, jsonb, text) from public;
revoke all on function public.complete_inventory_picking(uuid, uuid) from public;
revoke all on function public.cancel_inventory_picking(uuid, uuid, text) from public;
revoke all on function public.get_inventory_picking(uuid, uuid) from public;
revoke all on function public.list_inventory_pickings(uuid, text, text, int) from public;

grant execute on function public.picking_has_permission(uuid, text) to authenticated;
grant execute on function public.create_inventory_picking(uuid, uuid, text) to authenticated;
grant execute on function public.start_inventory_picking(uuid, uuid) to authenticated;
grant execute on function public.update_inventory_picking_items(uuid, uuid, jsonb, text) to authenticated;
grant execute on function public.complete_inventory_picking(uuid, uuid) to authenticated;
grant execute on function public.cancel_inventory_picking(uuid, uuid, text) to authenticated;
grant execute on function public.get_inventory_picking(uuid, uuid) to authenticated;
grant execute on function public.list_inventory_pickings(uuid, text, text, int) to authenticated;
