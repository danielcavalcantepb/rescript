-- Inventory Reservation Foundation.
-- Reservation is an inventory commitment. It is not a physical movement and
-- never writes inventory_ledger_movement, shipment, invoice, receivable or finance.

create table public.inventory_reservation_number_counter (
  organization_id uuid not null references public.organization (id) on delete restrict,
  last_value bigint not null default 0 check (last_value >= 0),
  primary key (organization_id)
);

create table public.inventory_reservation (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  number text not null,
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
    check (status in ('draft', 'active', 'partially_released', 'released', 'cancelled')),
  total_quantity_reserved numeric(19, 6) not null default 0
    check (total_quantity_reserved >= 0),
  total_quantity_released numeric(19, 6) not null default 0
    check (total_quantity_released >= 0 and total_quantity_released <= total_quantity_reserved),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  unique (organization_id, number),
  unique (organization_id, source_type, source_id)
);

create table public.inventory_reservation_item (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  reservation_id uuid not null references public.inventory_reservation (id) on delete restrict,
  sales_order_item_id uuid references public.sales_order_item (id) on delete restrict,
  product_id uuid not null,
  variant_id uuid not null,
  product_name text not null,
  variant_description text,
  sku text not null,
  unit_code text not null,
  location_id uuid not null references public.stock_location (id) on delete restrict,
  quantity_reserved numeric(19, 6) not null check (quantity_reserved > 0),
  quantity_released numeric(19, 6) not null default 0
    check (quantity_released >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'partially_released', 'released', 'cancelled')),
  sort_order integer not null,
  created_at timestamptz not null default now(),
  check (quantity_released <= quantity_reserved),
  unique (reservation_id, sort_order)
);

create table public.inventory_reservation_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  reservation_id uuid not null references public.inventory_reservation (id) on delete restrict,
  action text not null,
  old_value text,
  new_value text,
  reason text check (reason is null or char_length(reason) <= 500),
  actor_user_id uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.inventory_reservation_search (
  reservation_id uuid primary key references public.inventory_reservation (id) on delete cascade,
  organization_id uuid not null,
  number text not null,
  source_type text not null,
  source_id uuid not null,
  source_number text not null,
  customer_name text not null,
  customer_document text,
  status text not null,
  total_quantity_reserved numeric(19, 6) not null,
  total_quantity_released numeric(19, 6) not null,
  reservation_date date not null,
  created_at timestamptz not null,
  search_text text not null,
  updated_at timestamptz not null default now()
);

create index inventory_reservation_org_status_created_idx
  on public.inventory_reservation (organization_id, status, created_at desc);
create index inventory_reservation_org_source_idx
  on public.inventory_reservation (organization_id, source_type, source_id);
create index inventory_reservation_item_org_variant_idx
  on public.inventory_reservation_item (organization_id, variant_id, status);
create index inventory_reservation_item_org_location_idx
  on public.inventory_reservation_item (organization_id, location_id, status);
create index inventory_reservation_history_org_reservation_idx
  on public.inventory_reservation_history (organization_id, reservation_id, created_at desc);
create index inventory_reservation_search_filters_idx
  on public.inventory_reservation_search (organization_id, status, created_at desc);
create index inventory_reservation_search_text_idx
  on public.inventory_reservation_search using gin (to_tsvector('simple', search_text));

create trigger inventory_reservation_updated
  before update on public.inventory_reservation
  for each row execute function public.set_updated_at();

create or replace function public.deny_inventory_reservation_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'inventory_reservation_history_immutable' using errcode = '42501';
end;
$$;

create trigger inventory_reservation_history_no_update
  before update on public.inventory_reservation_history
  for each row execute function public.deny_inventory_reservation_history_mutation();

create trigger inventory_reservation_history_no_delete
  before delete on public.inventory_reservation_history
  for each row execute function public.deny_inventory_reservation_history_mutation();

create or replace function public.reservation_has_permission(
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
  if p_permission = 'reservation.read' then
    return v_role in ('manager', 'seller', 'inventory', 'viewer');
  end if;
  if p_permission in (
    'reservation.create',
    'reservation.edit',
    'reservation.activate',
    'reservation.release',
    'reservation.cancel',
    'reservation.archive'
  ) then
    return v_role in ('manager', 'seller', 'inventory');
  end if;
  return false;
end;
$$;

create or replace function public.reservation_require_permission(
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
  if not public.reservation_has_permission(p_org, p_permission) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.reservation_record_audit(
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
      using p_org, auth.uid(), 'inventory_reservation', p_id, p_action, p_payload;
  end if;
exception when undefined_table or undefined_column then
  null;
end;
$$;

create or replace function public.allocate_inventory_reservation_number(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v bigint;
begin
  insert into public.inventory_reservation_number_counter (organization_id, last_value)
  values (p_org, 1)
  on conflict (organization_id)
  do update set last_value = public.inventory_reservation_number_counter.last_value + 1
  returning last_value into v;

  return 'RSV-' || lpad(v::text, 6, '0');
end;
$$;

create or replace function public.refresh_inventory_reservation_search(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory_reservation_search (
    reservation_id,
    organization_id,
    number,
    source_type,
    source_id,
    source_number,
    customer_name,
    customer_document,
    status,
    total_quantity_reserved,
    total_quantity_released,
    reservation_date,
    created_at,
    search_text
  )
  select
    r.id,
    r.organization_id,
    r.number,
    r.source_type,
    r.source_id,
    r.source_number,
    r.customer_name,
    r.customer_document,
    r.status,
    r.total_quantity_reserved,
    r.total_quantity_released,
    r.created_at::date,
    r.created_at,
    lower(concat_ws(
      ' ',
      r.number,
      r.source_number,
      r.customer_name,
      r.customer_document,
      r.status,
      r.created_at::date::text,
      (
        select string_agg(concat_ws(' ', i.product_name, i.variant_description, i.sku, i.unit_code), ' ')
        from public.inventory_reservation_item i
        where i.reservation_id = r.id
      )
    ))
  from public.inventory_reservation r
  where r.id = p_reservation_id
  on conflict (reservation_id) do update set
    source_number = excluded.source_number,
    customer_name = excluded.customer_name,
    customer_document = excluded.customer_document,
    status = excluded.status,
    total_quantity_reserved = excluded.total_quantity_reserved,
    total_quantity_released = excluded.total_quantity_released,
    search_text = excluded.search_text,
    updated_at = now();
end;
$$;

create or replace function public.trg_inventory_reservation_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_inventory_reservation_search(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_inventory_reservation_item_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_inventory_reservation_search(coalesce(new.reservation_id, old.reservation_id));
  return coalesce(new, old);
end;
$$;

create trigger inventory_reservation_search_refresh
  after insert or update on public.inventory_reservation
  for each row execute function public.trg_inventory_reservation_search();

create trigger inventory_reservation_item_search_refresh
  after insert or update or delete on public.inventory_reservation_item
  for each row execute function public.trg_inventory_reservation_item_search();

create or replace function public.create_inventory_reservation_from_sales_order(
  p_org uuid,
  p_sales_order_id uuid,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.sales_order%rowtype;
  v_id uuid;
  v_number text;
  v_location public.stock_location%rowtype;
  v_total numeric;
begin
  perform public.reservation_require_permission(p_org, 'reservation.create');

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select id
  into v_id
  from public.inventory_reservation
  where organization_id = p_org
    and source_type = 'sales_order'
    and source_id = p_sales_order_id;
  if found then
    return v_id;
  end if;

  select *
  into v_order
  from public.sales_order
  where id = p_sales_order_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'sales_order_not_found' using errcode = 'P0002';
  end if;
  if v_order.status <> 'confirmed' then
    raise exception 'sales_order_not_confirmed' using errcode = '22023';
  end if;

  select *
  into v_location
  from public.stock_location
  where organization_id = p_org
    and is_default = true
    and status = 'active'
  for update;

  if not found then
    raise exception 'default_location_not_found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.sales_order_item i
    where i.sales_order_id = v_order.id
      and i.organization_id = p_org
  ) then
    raise exception 'reservation_requires_items' using errcode = '22023';
  end if;

  v_id := gen_random_uuid();
  v_number := public.allocate_inventory_reservation_number(p_org);

  insert into public.inventory_reservation (
    id,
    organization_id,
    number,
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
    'sales_order',
    v_order.id,
    v_order.number,
    v_order.customer_id,
    v_order.customer_name,
    v_order.customer_document,
    v_order.customer_email,
    v_order.customer_phone,
    v_location.id,
    'draft',
    nullif(trim(coalesce(p_notes, '')), ''),
    v_uid,
    v_uid
  );

  insert into public.inventory_reservation_item (
    organization_id,
    reservation_id,
    sales_order_item_id,
    product_id,
    variant_id,
    product_name,
    variant_description,
    sku,
    unit_code,
    location_id,
    quantity_reserved,
    quantity_released,
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
    v_location.id,
    i.quantity,
    0,
    'draft',
    i.sort_order
  from public.sales_order_item i
  where i.sales_order_id = v_order.id
    and i.organization_id = p_org
  order by i.sort_order;

  select sum(quantity_reserved)
  into v_total
  from public.inventory_reservation_item
  where reservation_id = v_id
    and organization_id = p_org;

  update public.inventory_reservation
  set total_quantity_reserved = coalesce(v_total, 0),
      updated_by = v_uid
  where id = v_id;

  insert into public.inventory_reservation_history (
    organization_id,
    reservation_id,
    action,
    new_value,
    actor_user_id
  ) values (
    p_org,
    v_id,
    'ReservationCreated',
    v_number,
    v_uid
  );

  perform public.reservation_record_audit(
    p_org,
    v_id,
    'ReservationCreated',
    jsonb_build_object('number', v_number, 'salesOrderId', v_order.id, 'salesOrderNumber', v_order.number)
  );

  return v_id;
end;
$$;

create or replace function public.activate_inventory_reservation(
  p_org uuid,
  p_reservation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reservation public.inventory_reservation%rowtype;
  v_item public.inventory_reservation_item%rowtype;
  v_stock public.inventory_item%rowtype;
begin
  perform public.reservation_require_permission(p_org, 'reservation.activate');

  select *
  into v_reservation
  from public.inventory_reservation
  where id = p_reservation_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'reservation_not_found' using errcode = 'P0002';
  end if;
  if v_reservation.status = 'active' then
    return p_reservation_id;
  end if;
  if v_reservation.status <> 'draft' then
    raise exception 'reservation_not_activatable' using errcode = '22023';
  end if;

  for v_item in
    select *
    from public.inventory_reservation_item
    where reservation_id = p_reservation_id
      and organization_id = p_org
    order by variant_id, id
    for update
  loop
    if v_item.quantity_reserved <= 0 then
      raise exception 'invalid_reservation_quantity' using errcode = '22023';
    end if;

    select *
    into v_stock
    from public.inventory_item
    where organization_id = p_org
      and location_id = v_item.location_id
      and variant_id = v_item.variant_id
      and status = 'active'
    for update;

    if not found then
      raise exception 'inventory_item_not_found' using errcode = 'P0002';
    end if;
    if v_stock.qty_on_hand - v_stock.qty_reserved < v_item.quantity_reserved then
      raise exception 'insufficient_available_stock' using errcode = '22023';
    end if;

    perform set_config('inventory.allow_projection', 'on', true);
    update public.inventory_item
    set qty_reserved = qty_reserved + v_item.quantity_reserved,
        version = version + 1,
        updated_by = v_uid,
        updated_at = now()
    where id = v_stock.id;

    update public.inventory_reservation_item
    set status = 'active'
    where id = v_item.id;
  end loop;

  update public.inventory_reservation
  set status = 'active',
      updated_by = v_uid
  where id = p_reservation_id;

  insert into public.inventory_reservation_history (
    organization_id,
    reservation_id,
    action,
    old_value,
    new_value,
    actor_user_id
  ) values (
    p_org,
    p_reservation_id,
    'ReservationActivated',
    v_reservation.status,
    'active',
    v_uid
  );

  perform public.reservation_record_audit(
    p_org,
    p_reservation_id,
    'ReservationActivated',
    jsonb_build_object('from', v_reservation.status, 'to', 'active')
  );

  return p_reservation_id;
end;
$$;

create or replace function public.release_inventory_reservation(
  p_org uuid,
  p_reservation_id uuid,
  p_items jsonb default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reservation public.inventory_reservation%rowtype;
  v_release record;
  v_payload record;
  v_item public.inventory_reservation_item%rowtype;
  v_stock public.inventory_item%rowtype;
  v_quantity numeric;
  v_total_released numeric;
  v_total_reserved numeric;
  v_status text;
  v_expected int := 0;
  v_matched int := 0;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_uuid_rx text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
begin
  perform public.reservation_require_permission(p_org, 'reservation.release');

  select *
  into v_reservation
  from public.inventory_reservation
  where id = p_reservation_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'reservation_not_found' using errcode = 'P0002';
  end if;
  if v_reservation.status not in ('active', 'partially_released') then
    raise exception 'reservation_not_releasable' using errcode = '22023';
  end if;

  if p_items is not null and jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_release_items' using errcode = '22023';
  end if;
  if p_items is not null and jsonb_array_length(p_items) = 0 then
    raise exception 'invalid_release_items' using errcode = '22023';
  end if;
  if p_items is not null then
    for v_payload in select value as x from jsonb_array_elements(p_items) loop
      if jsonb_typeof(v_payload.x) <> 'object'
        or coalesce(v_payload.x ->> 'itemId', '') !~ v_uuid_rx
        or coalesce(v_payload.x ->> 'quantity', '') !~ '^[0-9]+(\.[0-9]{1,6})?$'
      then
        raise exception 'invalid_release_items' using errcode = '22023';
      end if;
    end loop;
    v_expected := jsonb_array_length(p_items);
  end if;

  for v_release in
    select
      i.id as reservation_item_id,
      case
        when p_items is null then i.quantity_reserved - i.quantity_released
        else (x.value ->> 'quantity')::numeric
      end as quantity
    from public.inventory_reservation_item i
    left join lateral jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) x(value)
      on (x.value ->> 'itemId')::uuid = i.id
    where i.reservation_id = p_reservation_id
      and i.organization_id = p_org
      and (
        p_items is null
        or x.value is not null
      )
  loop
    v_matched := v_matched + 1;
    v_quantity := v_release.quantity;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid_release_quantity' using errcode = '22023';
    end if;

    select *
    into v_item
    from public.inventory_reservation_item
    where id = v_release.reservation_item_id
      and organization_id = p_org
    for update;

    if v_quantity > v_item.quantity_reserved - v_item.quantity_released then
      raise exception 'release_exceeds_reserved' using errcode = '22023';
    end if;

    select *
    into v_stock
    from public.inventory_item
    where organization_id = p_org
      and location_id = v_item.location_id
      and variant_id = v_item.variant_id
    for update;

    if not found then
      raise exception 'inventory_item_not_found' using errcode = 'P0002';
    end if;
    if v_stock.qty_reserved < v_quantity then
      raise exception 'reserved_balance_negative' using errcode = '22023';
    end if;

    perform set_config('inventory.allow_projection', 'on', true);
    update public.inventory_item
    set qty_reserved = qty_reserved - v_quantity,
        version = version + 1,
        updated_by = v_uid,
        updated_at = now()
    where id = v_stock.id;

    update public.inventory_reservation_item
    set quantity_released = quantity_released + v_quantity,
        status = case
          when quantity_released + v_quantity = quantity_reserved then 'released'
          else 'partially_released'
        end
    where id = v_item.id;
  end loop;

  if p_items is not null and v_matched <> v_expected then
    raise exception 'release_item_not_found' using errcode = 'P0002';
  end if;

  select
    coalesce(sum(quantity_reserved), 0),
    coalesce(sum(quantity_released), 0)
  into v_total_reserved, v_total_released
  from public.inventory_reservation_item
  where reservation_id = p_reservation_id
    and organization_id = p_org;

  v_status := case
    when v_total_released = v_total_reserved then 'released'
    when v_total_released > 0 then 'partially_released'
    else v_reservation.status
  end;

  update public.inventory_reservation
  set status = v_status,
      total_quantity_released = v_total_released,
      updated_by = v_uid
  where id = p_reservation_id;

  insert into public.inventory_reservation_history (
    organization_id,
    reservation_id,
    action,
    old_value,
    new_value,
    reason,
    actor_user_id
  ) values (
    p_org,
    p_reservation_id,
    'ReservationReleased',
    v_reservation.status,
    v_status,
    v_reason,
    v_uid
  );

  perform public.reservation_record_audit(
    p_org,
    p_reservation_id,
    'ReservationReleased',
    jsonb_build_object('from', v_reservation.status, 'to', v_status, 'reason', v_reason)
  );

  return p_reservation_id;
end;
$$;

create or replace function public.cancel_inventory_reservation(
  p_org uuid,
  p_reservation_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reservation public.inventory_reservation%rowtype;
  v_item public.inventory_reservation_item%rowtype;
  v_stock public.inventory_item%rowtype;
  v_remaining numeric;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  perform public.reservation_require_permission(p_org, 'reservation.cancel');

  select *
  into v_reservation
  from public.inventory_reservation
  where id = p_reservation_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'reservation_not_found' using errcode = 'P0002';
  end if;
  if v_reservation.status in ('released', 'cancelled') then
    return p_reservation_id;
  end if;

  if v_reservation.status in ('active', 'partially_released') then
    for v_item in
      select *
      from public.inventory_reservation_item
      where reservation_id = p_reservation_id
        and organization_id = p_org
      order by variant_id, id
      for update
    loop
      v_remaining := v_item.quantity_reserved - v_item.quantity_released;
      if v_remaining > 0 then
        select *
        into v_stock
        from public.inventory_item
        where organization_id = p_org
          and location_id = v_item.location_id
          and variant_id = v_item.variant_id
        for update;

        if not found then
          raise exception 'inventory_item_not_found' using errcode = 'P0002';
        end if;
        if v_stock.qty_reserved < v_remaining then
          raise exception 'reserved_balance_negative' using errcode = '22023';
        end if;

        perform set_config('inventory.allow_projection', 'on', true);
        update public.inventory_item
        set qty_reserved = qty_reserved - v_remaining,
            version = version + 1,
            updated_by = v_uid,
            updated_at = now()
        where id = v_stock.id;
      end if;

      update public.inventory_reservation_item
      set quantity_released = quantity_reserved,
          status = 'cancelled'
      where id = v_item.id;
    end loop;
  else
    update public.inventory_reservation_item
    set status = 'cancelled'
    where reservation_id = p_reservation_id
      and organization_id = p_org;
  end if;

  update public.inventory_reservation
  set status = 'cancelled',
      total_quantity_released = total_quantity_reserved,
      updated_by = v_uid
  where id = p_reservation_id;

  insert into public.inventory_reservation_history (
    organization_id,
    reservation_id,
    action,
    old_value,
    new_value,
    reason,
    actor_user_id
  ) values (
    p_org,
    p_reservation_id,
    'ReservationCancelled',
    v_reservation.status,
    'cancelled',
    v_reason,
    v_uid
  );

  perform public.reservation_record_audit(
    p_org,
    p_reservation_id,
    'ReservationCancelled',
    jsonb_build_object('from', v_reservation.status, 'to', 'cancelled', 'reason', v_reason)
  );

  return p_reservation_id;
end;
$$;

create or replace function public.get_inventory_reservation(
  p_org uuid,
  p_reservation_id uuid
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
  perform public.reservation_require_permission(p_org, 'reservation.read');

  select jsonb_build_object(
    'document', to_jsonb(r),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.sort_order)
      from public.inventory_reservation_item i
      where i.reservation_id = r.id
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(to_jsonb(h) order by h.created_at desc)
      from public.inventory_reservation_history h
      where h.reservation_id = r.id
    ), '[]'::jsonb)
  )
  into v
  from public.inventory_reservation r
  where r.id = p_reservation_id
    and r.organization_id = p_org;

  return v;
end;
$$;

create or replace function public.list_inventory_reservations(
  p_org uuid,
  p_query text default null,
  p_status text default null,
  p_limit int default 50
)
returns setof public.inventory_reservation_search
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.inventory_reservation_search
  where organization_id = p_org
    and public.reservation_has_permission(p_org, 'reservation.read')
    and (p_status is null or status = p_status)
    and (
      nullif(trim(p_query), '') is null
      or to_tsvector('simple', search_text) @@ plainto_tsquery('simple', lower(trim(p_query)))
      or search_text like '%' || lower(trim(p_query)) || '%'
    )
  order by created_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

-- Sales integration for this foundation: confirming an order creates and
-- activates a reservation only. Cancelling an order releases the reservation.
create or replace function public.transition_sales_order(
  p_org uuid,
  p_id uuid,
  p_to text,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from text;
  v_permission text;
  v_reservation_id uuid;
begin
  v_permission := case p_to
    when 'confirmed' then 'sales.confirm'
    when 'cancelled' then 'sales.cancel'
    when 'archived' then 'sales.archive'
    else 'sales.edit'
  end;

  perform public.sales_require_permission(p_org, v_permission);

  select status
  into v_from
  from public.sales_order
  where id = p_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if not (
    (v_from = 'draft' and p_to in ('confirmed', 'cancelled', 'archived'))
    or (v_from = 'confirmed' and p_to = 'cancelled')
    or (v_from = 'cancelled' and p_to = 'archived')
  ) then
    raise exception 'invalid_transition';
  end if;

  update public.sales_order
  set status = p_to,
      archived_at = case when p_to = 'archived' then now() else null end,
      updated_by = auth.uid()
  where id = p_id
    and organization_id = p_org;

  if p_to = 'confirmed' then
    v_reservation_id := public.create_inventory_reservation_from_sales_order(p_org, p_id, null);
    perform public.activate_inventory_reservation(p_org, v_reservation_id);
  elsif p_to = 'cancelled' then
    select id
    into v_reservation_id
    from public.inventory_reservation
    where organization_id = p_org
      and source_type = 'sales_order'
      and source_id = p_id;
    if found then
      perform public.cancel_inventory_reservation(p_org, v_reservation_id, p_reason);
    end if;
  end if;

  insert into public.sales_history (
    organization_id,
    aggregate_type,
    aggregate_id,
    action,
    old_value,
    new_value,
    reason,
    actor_user_id
  ) values (
    p_org,
    'sales_order',
    p_id,
    'SalesOrder' || initcap(p_to),
    v_from,
    p_to,
    p_reason,
    auth.uid()
  );

  perform public.sales_record_audit(
    p_org,
    'sales_order',
    p_id,
    'SalesOrder' || initcap(p_to),
    jsonb_build_object('from', v_from, 'to', p_to, 'reason', p_reason, 'reservationId', v_reservation_id)
  );

  return p_id;
end;
$$;

alter table public.inventory_reservation_number_counter enable row level security;
alter table public.inventory_reservation enable row level security;
alter table public.inventory_reservation_item enable row level security;
alter table public.inventory_reservation_history enable row level security;
alter table public.inventory_reservation_search enable row level security;

create policy inventory_reservation_number_counter_read
  on public.inventory_reservation_number_counter
  for select to authenticated
  using (public.reservation_has_permission(organization_id, 'reservation.read'));

create policy inventory_reservation_read
  on public.inventory_reservation
  for select to authenticated
  using (public.reservation_has_permission(organization_id, 'reservation.read'));

create policy inventory_reservation_item_read
  on public.inventory_reservation_item
  for select to authenticated
  using (public.reservation_has_permission(organization_id, 'reservation.read'));

create policy inventory_reservation_history_read
  on public.inventory_reservation_history
  for select to authenticated
  using (public.reservation_has_permission(organization_id, 'reservation.read'));

create policy inventory_reservation_search_read
  on public.inventory_reservation_search
  for select to authenticated
  using (public.reservation_has_permission(organization_id, 'reservation.read'));

grant select on public.inventory_reservation_number_counter to authenticated;
grant select on public.inventory_reservation to authenticated;
grant select on public.inventory_reservation_item to authenticated;
grant select on public.inventory_reservation_history to authenticated;
grant select on public.inventory_reservation_search to authenticated;

revoke all on function public.reservation_has_permission(uuid, text) from public;
revoke all on function public.reservation_require_permission(uuid, text) from public;
revoke all on function public.reservation_record_audit(uuid, uuid, text, jsonb) from public;
revoke all on function public.allocate_inventory_reservation_number(uuid) from public;
revoke all on function public.refresh_inventory_reservation_search(uuid) from public;
revoke all on function public.create_inventory_reservation_from_sales_order(uuid, uuid, text) from public;
revoke all on function public.activate_inventory_reservation(uuid, uuid) from public;
revoke all on function public.release_inventory_reservation(uuid, uuid, jsonb, text) from public;
revoke all on function public.cancel_inventory_reservation(uuid, uuid, text) from public;
revoke all on function public.get_inventory_reservation(uuid, uuid) from public;
revoke all on function public.list_inventory_reservations(uuid, text, text, int) from public;

grant execute on function public.reservation_has_permission(uuid, text) to authenticated;
grant execute on function public.create_inventory_reservation_from_sales_order(uuid, uuid, text) to authenticated;
grant execute on function public.activate_inventory_reservation(uuid, uuid) to authenticated;
grant execute on function public.release_inventory_reservation(uuid, uuid, jsonb, text) to authenticated;
grant execute on function public.cancel_inventory_reservation(uuid, uuid, text) to authenticated;
grant execute on function public.get_inventory_reservation(uuid, uuid) to authenticated;
grant execute on function public.list_inventory_reservations(uuid, text, text, int) to authenticated;
