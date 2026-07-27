-- Inventory Shipment Foundation.
-- Shipment represents physical dispatch of packed sales items.
-- Dispatch is the only lifecycle step that writes inventory quantity and ledger.
-- Shipment never writes invoice, accounts receivable, receipts, payments,
-- cash flow or fiscal documents.

create table public.inventory_shipment_number_counter (
  organization_id uuid not null references public.organization (id) on delete restrict,
  last_value bigint not null default 0 check (last_value >= 0),
  primary key (organization_id)
);

create table public.inventory_shipment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  number text not null,
  packing_id uuid not null references public.inventory_packing (id) on delete restrict,
  packing_number text not null,
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
    check (status in ('draft', 'ready', 'dispatched', 'delivered', 'cancelled')),
  total_quantity_packed numeric(19, 6) not null default 0
    check (total_quantity_packed >= 0),
  total_quantity_shipped numeric(19, 6) not null default 0
    check (total_quantity_shipped >= 0),
  carrier text check (carrier is null or char_length(carrier) <= 160),
  service text check (service is null or char_length(service) <= 120),
  tracking_code text check (tracking_code is null or char_length(tracking_code) <= 120),
  freight_amount numeric(19, 4) check (freight_amount is null or freight_amount >= 0),
  dispatch_date date,
  estimated_delivery_date date,
  delivered_date date,
  notes text check (notes is null or char_length(notes) <= 4000),
  dispatch_idempotency_key text check (
    dispatch_idempotency_key is null
    or (
      char_length(trim(dispatch_idempotency_key)) >= 1
      and char_length(dispatch_idempotency_key) <= 128
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  unique (organization_id, number),
  unique (organization_id, packing_id),
  constraint inventory_shipment_quantities_chk check (
    total_quantity_shipped <= total_quantity_packed
  ),
  constraint inventory_shipment_delivered_date_chk check (
    (status = 'delivered' and delivered_date is not null)
    or (status <> 'delivered')
  ),
  constraint inventory_shipment_dispatched_date_chk check (
    (status in ('dispatched', 'delivered') and dispatch_date is not null)
    or (status not in ('dispatched', 'delivered'))
  )
);

create unique index inventory_shipment_org_dispatch_idem_uidx
  on public.inventory_shipment (organization_id, dispatch_idempotency_key)
  where dispatch_idempotency_key is not null;

create table public.inventory_shipment_item (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  shipment_id uuid not null references public.inventory_shipment (id) on delete restrict,
  packing_item_id uuid not null references public.inventory_packing_item (id) on delete restrict,
  picking_item_id uuid not null references public.inventory_picking_item (id) on delete restrict,
  reservation_item_id uuid not null references public.inventory_reservation_item (id) on delete restrict,
  product_id uuid not null,
  variant_id uuid not null,
  product_name text not null,
  variant_description text,
  sku text not null,
  unit_code text not null,
  location_id uuid not null references public.stock_location (id) on delete restrict,
  quantity_packed numeric(19, 6) not null check (quantity_packed > 0),
  quantity_shipped numeric(19, 6) not null check (quantity_shipped >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'dispatched', 'delivered', 'cancelled')),
  ledger_movement_id uuid references public.inventory_ledger_movement (id) on delete restrict,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shipment_id, packing_item_id),
  unique (shipment_id, sort_order),
  check (quantity_shipped <= quantity_packed)
);

create table public.inventory_shipment_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  shipment_id uuid not null references public.inventory_shipment (id) on delete restrict,
  action text not null,
  old_value text,
  new_value text,
  reason text check (reason is null or char_length(reason) <= 500),
  actor_user_id uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.inventory_shipment_search (
  shipment_id uuid primary key references public.inventory_shipment (id) on delete cascade,
  organization_id uuid not null,
  number text not null,
  packing_id uuid not null,
  packing_number text not null,
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
  total_quantity_packed numeric(19, 6) not null,
  total_quantity_shipped numeric(19, 6) not null,
  carrier text,
  service text,
  tracking_code text,
  shipment_date date not null,
  dispatch_date date,
  delivered_date date,
  created_at timestamptz not null,
  search_text text not null,
  updated_at timestamptz not null default now()
);

create index inventory_shipment_org_status_created_idx
  on public.inventory_shipment (organization_id, status, created_at desc);
create index inventory_shipment_org_packing_idx
  on public.inventory_shipment (organization_id, packing_id);
create index inventory_shipment_org_source_idx
  on public.inventory_shipment (organization_id, source_type, source_id);
create index inventory_shipment_item_org_variant_idx
  on public.inventory_shipment_item (organization_id, variant_id, status);
create index inventory_shipment_item_org_packing_item_idx
  on public.inventory_shipment_item (organization_id, packing_item_id);
create index inventory_shipment_item_org_ledger_idx
  on public.inventory_shipment_item (organization_id, ledger_movement_id)
  where ledger_movement_id is not null;
create index inventory_shipment_history_org_shipment_idx
  on public.inventory_shipment_history (organization_id, shipment_id, created_at desc);
create index inventory_shipment_search_filters_idx
  on public.inventory_shipment_search (organization_id, status, created_at desc);
create index inventory_shipment_search_text_idx
  on public.inventory_shipment_search using gin (to_tsvector('simple', search_text));

create trigger inventory_shipment_updated
  before update on public.inventory_shipment
  for each row execute function public.set_updated_at();

create trigger inventory_shipment_item_updated
  before update on public.inventory_shipment_item
  for each row execute function public.set_updated_at();

create or replace function public.deny_inventory_shipment_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'inventory_shipment_history_immutable' using errcode = '42501';
end;
$$;

create trigger inventory_shipment_history_no_update
  before update on public.inventory_shipment_history
  for each row execute function public.deny_inventory_shipment_history_mutation();

create trigger inventory_shipment_history_no_delete
  before delete on public.inventory_shipment_history
  for each row execute function public.deny_inventory_shipment_history_mutation();

create or replace function public.shipment_has_permission(
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
  if p_permission = 'shipment.read' then
    return v_role in ('manager', 'seller', 'inventory', 'viewer');
  end if;
  if p_permission in (
    'shipment.create',
    'shipment.edit',
    'shipment.ready',
    'shipment.dispatch',
    'shipment.complete',
    'shipment.cancel',
    'shipment.archive'
  ) then
    return v_role in ('manager', 'seller', 'inventory');
  end if;
  return false;
end;
$$;

create or replace function public.shipment_require_permission(
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
  if not public.shipment_has_permission(p_org, p_permission) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.shipment_record_audit(
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
      using p_org, auth.uid(), 'inventory_shipment', p_id, p_action, p_payload;
  end if;
exception when undefined_table or undefined_column then
  null;
end;
$$;

create or replace function public.allocate_inventory_shipment_number(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v bigint;
begin
  insert into public.inventory_shipment_number_counter (organization_id, last_value)
  values (p_org, 1)
  on conflict (organization_id)
  do update set last_value = public.inventory_shipment_number_counter.last_value + 1
  returning last_value into v;

  return 'SHP-' || lpad(v::text, 6, '0');
end;
$$;

create or replace function public.refresh_inventory_shipment_search(p_shipment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory_shipment_search (
    shipment_id,
    organization_id,
    number,
    packing_id,
    packing_number,
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
    total_quantity_packed,
    total_quantity_shipped,
    carrier,
    service,
    tracking_code,
    shipment_date,
    dispatch_date,
    delivered_date,
    created_at,
    search_text
  )
  select
    s.id,
    s.organization_id,
    s.number,
    s.packing_id,
    s.packing_number,
    s.picking_id,
    s.picking_number,
    s.reservation_id,
    s.reservation_number,
    s.source_type,
    s.source_id,
    s.source_number,
    s.customer_name,
    s.customer_document,
    s.status,
    s.total_quantity_packed,
    s.total_quantity_shipped,
    s.carrier,
    s.service,
    s.tracking_code,
    s.created_at::date,
    s.dispatch_date,
    s.delivered_date,
    s.created_at,
    concat_ws(
      ' ',
      s.number,
      s.packing_number,
      s.picking_number,
      s.reservation_number,
      s.source_number,
      s.customer_name,
      s.customer_document,
      s.carrier,
      s.service,
      s.tracking_code,
      (
        select string_agg(concat_ws(' ', i.sku, i.product_name, i.variant_description), ' ')
        from public.inventory_shipment_item i
        where i.shipment_id = s.id
      )
    )
  from public.inventory_shipment s
  where s.id = p_shipment_id
  on conflict (shipment_id)
  do update set
    status = excluded.status,
    total_quantity_shipped = excluded.total_quantity_shipped,
    carrier = excluded.carrier,
    service = excluded.service,
    tracking_code = excluded.tracking_code,
    dispatch_date = excluded.dispatch_date,
    delivered_date = excluded.delivered_date,
    search_text = excluded.search_text,
    updated_at = now();
end;
$$;

create or replace function public.trg_inventory_shipment_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_inventory_shipment_search(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_inventory_shipment_item_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_inventory_shipment_search(coalesce(new.shipment_id, old.shipment_id));
  return coalesce(new, old);
end;
$$;

create trigger inventory_shipment_search_refresh
  after insert or update on public.inventory_shipment
  for each row execute function public.trg_inventory_shipment_search();

create trigger inventory_shipment_item_search_refresh
  after insert or update or delete on public.inventory_shipment_item
  for each row execute function public.trg_inventory_shipment_item_search();

create or replace function public.create_inventory_shipment(
  p_org uuid,
  p_packing_id uuid,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_packing public.inventory_packing%rowtype;
  v_id uuid;
  v_existing_id uuid;
  v_number text;
  v_total numeric;
begin
  perform public.shipment_require_permission(p_org, 'shipment.create');

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select id
  into v_existing_id
  from public.inventory_shipment
  where organization_id = p_org
    and packing_id = p_packing_id;
  if found then
    return v_existing_id;
  end if;

  select *
  into v_packing
  from public.inventory_packing
  where id = p_packing_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'packing_not_found' using errcode = 'P0002';
  end if;
  if v_packing.status <> 'completed' then
    raise exception 'packing_not_completed' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.inventory_packing_item i
    where i.packing_id = v_packing.id
      and i.organization_id = p_org
      and i.status = 'completed'
      and i.quantity_picked > 0
  ) then
    raise exception 'shipment_requires_completed_packing_items' using errcode = '22023';
  end if;

  v_id := gen_random_uuid();
  v_number := public.allocate_inventory_shipment_number(p_org);

  insert into public.inventory_shipment (
    id,
    organization_id,
    number,
    packing_id,
    packing_number,
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
    v_packing.id,
    v_packing.number,
    v_packing.picking_id,
    v_packing.picking_number,
    v_packing.reservation_id,
    v_packing.reservation_number,
    v_packing.source_type,
    v_packing.source_id,
    v_packing.source_number,
    v_packing.customer_id,
    v_packing.customer_name,
    v_packing.customer_document,
    v_packing.customer_email,
    v_packing.customer_phone,
    v_packing.location_id,
    'draft',
    nullif(trim(coalesce(p_notes, '')), ''),
    v_uid,
    v_uid
  );

  insert into public.inventory_shipment_item (
    organization_id,
    shipment_id,
    packing_item_id,
    picking_item_id,
    reservation_item_id,
    product_id,
    variant_id,
    product_name,
    variant_description,
    sku,
    unit_code,
    location_id,
    quantity_packed,
    quantity_shipped,
    status,
    sort_order
  )
  select
    p_org,
    v_id,
    i.id,
    i.picking_item_id,
    i.reservation_item_id,
    i.product_id,
    i.variant_id,
    i.product_name,
    i.variant_description,
    i.sku,
    i.unit_code,
    i.location_id,
    i.quantity_picked,
    i.quantity_picked,
    'draft',
    i.sort_order
  from public.inventory_packing_item i
  where i.packing_id = v_packing.id
    and i.organization_id = p_org
    and i.status = 'completed'
  order by i.sort_order;

  select sum(quantity_packed)
  into v_total
  from public.inventory_shipment_item
  where shipment_id = v_id
    and organization_id = p_org;

  update public.inventory_shipment
  set total_quantity_packed = coalesce(v_total, 0),
      updated_by = v_uid
  where id = v_id
    and organization_id = p_org;

  insert into public.inventory_shipment_history (
    organization_id,
    shipment_id,
    action,
    new_value,
    actor_user_id
  ) values (
    p_org,
    v_id,
    'ShipmentCreated',
    v_number,
    v_uid
  );

  perform public.shipment_record_audit(
    p_org,
    v_id,
    'ShipmentCreated',
    jsonb_build_object(
      'number', v_number,
      'packingId', v_packing.id,
      'packingNumber', v_packing.number,
      'pickingId', v_packing.picking_id,
      'pickingNumber', v_packing.picking_number,
      'reservationId', v_packing.reservation_id,
      'reservationNumber', v_packing.reservation_number,
      'salesOrderId', v_packing.source_id,
      'salesOrderNumber', v_packing.source_number
    )
  );

  return v_id;
end;
$$;

create or replace function public.mark_inventory_shipment_ready(
  p_org uuid,
  p_shipment_id uuid,
  p_carrier text default null,
  p_service text default null,
  p_tracking_code text default null,
  p_freight_amount numeric default null,
  p_estimated_delivery_date date default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_shipment public.inventory_shipment%rowtype;
  v_freight numeric := p_freight_amount;
begin
  perform public.shipment_require_permission(p_org, 'shipment.ready');

  if v_freight is not null and v_freight < 0 then
    raise exception 'invalid_freight_amount' using errcode = '22023';
  end if;

  select *
  into v_shipment
  from public.inventory_shipment
  where id = p_shipment_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'shipment_not_found' using errcode = 'P0002';
  end if;
  if v_shipment.status = 'ready' then
    return p_shipment_id;
  end if;
  if v_shipment.status <> 'draft' then
    raise exception 'shipment_not_readyable' using errcode = '22023';
  end if;

  update public.inventory_shipment_item
  set status = 'ready'
  where shipment_id = p_shipment_id
    and organization_id = p_org;

  update public.inventory_shipment
  set status = 'ready',
      carrier = nullif(trim(coalesce(p_carrier, '')), ''),
      service = nullif(trim(coalesce(p_service, '')), ''),
      tracking_code = nullif(trim(coalesce(p_tracking_code, '')), ''),
      freight_amount = v_freight,
      estimated_delivery_date = p_estimated_delivery_date,
      notes = coalesce(nullif(trim(coalesce(p_notes, '')), ''), notes),
      updated_by = v_uid
  where id = p_shipment_id
    and organization_id = p_org;

  insert into public.inventory_shipment_history (
    organization_id,
    shipment_id,
    action,
    old_value,
    new_value,
    actor_user_id
  ) values (
    p_org,
    p_shipment_id,
    'ShipmentReady',
    v_shipment.status,
    'ready',
    v_uid
  );

  perform public.shipment_record_audit(
    p_org,
    p_shipment_id,
    'ShipmentReady',
    jsonb_build_object(
      'from', v_shipment.status,
      'to', 'ready',
      'carrier', nullif(trim(coalesce(p_carrier, '')), ''),
      'service', nullif(trim(coalesce(p_service, '')), ''),
      'trackingCode', nullif(trim(coalesce(p_tracking_code, '')), '')
    )
  );

  return p_shipment_id;
end;
$$;

create or replace function public.dispatch_inventory_shipment(
  p_org uuid,
  p_shipment_id uuid,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_shipment public.inventory_shipment%rowtype;
  v_item public.inventory_shipment_item%rowtype;
  v_stock public.inventory_item%rowtype;
  v_res_item public.inventory_reservation_item%rowtype;
  v_movement public.inventory_ledger_movement;
  v_idem text;
  v_total_shipped numeric;
  v_total_reserved numeric;
  v_total_released numeric;
  v_reservation_status text;
  v_movements jsonb := '[]'::jsonb;
begin
  perform public.shipment_require_permission(p_org, 'shipment.dispatch');

  select *
  into v_shipment
  from public.inventory_shipment
  where id = p_shipment_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'shipment_not_found' using errcode = 'P0002';
  end if;
  if v_shipment.status in ('dispatched', 'delivered') then
    return p_shipment_id;
  end if;
  if v_shipment.status <> 'ready' then
    raise exception 'shipment_not_dispatchable' using errcode = '22023';
  end if;

  v_idem := coalesce(nullif(trim(coalesce(p_idempotency_key, '')), ''), 'shipment:' || p_shipment_id::text);

  for v_item in
    select *
    from public.inventory_shipment_item
    where shipment_id = p_shipment_id
      and organization_id = p_org
    order by variant_id, location_id, id
    for update
  loop
    if v_item.quantity_shipped <= 0 or v_item.quantity_shipped > v_item.quantity_packed then
      raise exception 'invalid_shipped_quantity' using errcode = '22023';
    end if;

    select *
    into v_res_item
    from public.inventory_reservation_item
    where id = v_item.reservation_item_id
      and reservation_id = v_shipment.reservation_id
      and organization_id = p_org
    for update;

    if not found then
      raise exception 'reservation_item_not_found' using errcode = 'P0002';
    end if;
    if v_res_item.quantity_reserved - v_res_item.quantity_released < v_item.quantity_shipped then
      raise exception 'shipment_exceeds_reserved_quantity' using errcode = '22023';
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
    if v_stock.qty_on_hand < v_item.quantity_shipped then
      raise exception 'insufficient_stock' using errcode = '22023';
    end if;
    if v_stock.qty_reserved < v_item.quantity_shipped then
      raise exception 'reserved_balance_negative' using errcode = '22023';
    end if;

    perform set_config('inventory.allow_projection', 'on', true);
    update public.inventory_item
    set qty_reserved = qty_reserved - v_item.quantity_shipped,
        version = version + 1,
        updated_by = v_uid,
        updated_at = now()
    where id = v_stock.id;

    v_movement := public.register_inventory_ledger_movement(
      p_org,
      v_item.variant_id,
      v_item.location_id,
      'exit',
      v_item.quantity_shipped,
      'Expedição ' || v_shipment.number,
      v_shipment.notes,
      now(),
      'inventory_shipment',
      v_shipment.id,
      v_shipment.id,
      v_idem || ':item:' || v_item.id::text,
      null,
      null
    );

    update public.inventory_shipment_item
    set status = 'dispatched',
        ledger_movement_id = v_movement.id
    where id = v_item.id
      and organization_id = p_org;

    update public.inventory_reservation_item
    set quantity_released = quantity_released + v_item.quantity_shipped,
        status = case
          when quantity_released + v_item.quantity_shipped = quantity_reserved then 'released'
          else 'partially_released'
        end
    where id = v_res_item.id
      and organization_id = p_org;

    v_movements := v_movements || jsonb_build_array(
      jsonb_build_object(
        'shipmentItemId', v_item.id,
        'ledgerMovementId', v_movement.id,
        'variantId', v_item.variant_id,
        'locationId', v_item.location_id,
        'quantity', v_item.quantity_shipped
      )
    );
  end loop;

  select
    coalesce(sum(quantity_shipped), 0)
  into v_total_shipped
  from public.inventory_shipment_item
  where shipment_id = p_shipment_id
    and organization_id = p_org;

  select
    coalesce(sum(quantity_reserved), 0),
    coalesce(sum(quantity_released), 0)
  into v_total_reserved, v_total_released
  from public.inventory_reservation_item
  where reservation_id = v_shipment.reservation_id
    and organization_id = p_org;

  v_reservation_status := case
    when v_total_released = v_total_reserved then 'released'
    when v_total_released > 0 then 'partially_released'
    else 'active'
  end;

  update public.inventory_reservation
  set status = v_reservation_status,
      total_quantity_released = v_total_released,
      updated_by = v_uid
  where id = v_shipment.reservation_id
    and organization_id = p_org;

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
    v_shipment.reservation_id,
    'ReservationReleased',
    v_shipment.status,
    v_reservation_status,
    'Expedição ' || v_shipment.number,
    v_uid
  );

  update public.inventory_shipment
  set status = 'dispatched',
      total_quantity_shipped = v_total_shipped,
      dispatch_date = current_date,
      dispatch_idempotency_key = v_idem,
      updated_by = v_uid
  where id = p_shipment_id
    and organization_id = p_org;

  insert into public.inventory_shipment_history (
    organization_id,
    shipment_id,
    action,
    old_value,
    new_value,
    actor_user_id
  ) values (
    p_org,
    p_shipment_id,
    'ShipmentDispatched',
    v_shipment.status,
    v_movements::text,
    v_uid
  );

  perform public.shipment_record_audit(
    p_org,
    p_shipment_id,
    'ShipmentDispatched',
    jsonb_build_object(
      'from', v_shipment.status,
      'to', 'dispatched',
      'movements', v_movements,
      'reservationStatus', v_reservation_status
    )
  );

  return p_shipment_id;
end;
$$;

create or replace function public.complete_inventory_shipment(
  p_org uuid,
  p_shipment_id uuid,
  p_delivered_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_shipment public.inventory_shipment%rowtype;
  v_date date := coalesce(p_delivered_date, current_date);
begin
  perform public.shipment_require_permission(p_org, 'shipment.complete');

  select *
  into v_shipment
  from public.inventory_shipment
  where id = p_shipment_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'shipment_not_found' using errcode = 'P0002';
  end if;
  if v_shipment.status = 'delivered' then
    return p_shipment_id;
  end if;
  if v_shipment.status <> 'dispatched' then
    raise exception 'shipment_not_deliverable' using errcode = '22023';
  end if;

  update public.inventory_shipment_item
  set status = 'delivered'
  where shipment_id = p_shipment_id
    and organization_id = p_org;

  update public.inventory_shipment
  set status = 'delivered',
      delivered_date = v_date,
      updated_by = v_uid
  where id = p_shipment_id
    and organization_id = p_org;

  insert into public.inventory_shipment_history (
    organization_id,
    shipment_id,
    action,
    old_value,
    new_value,
    actor_user_id
  ) values (
    p_org,
    p_shipment_id,
    'ShipmentDelivered',
    v_shipment.status,
    v_date::text,
    v_uid
  );

  perform public.shipment_record_audit(
    p_org,
    p_shipment_id,
    'ShipmentDelivered',
    jsonb_build_object('from', v_shipment.status, 'to', 'delivered', 'deliveredDate', v_date)
  );

  return p_shipment_id;
end;
$$;

create or replace function public.cancel_inventory_shipment(
  p_org uuid,
  p_shipment_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_shipment public.inventory_shipment%rowtype;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  perform public.shipment_require_permission(p_org, 'shipment.cancel');

  select *
  into v_shipment
  from public.inventory_shipment
  where id = p_shipment_id
    and organization_id = p_org
  for update;

  if not found then
    raise exception 'shipment_not_found' using errcode = 'P0002';
  end if;
  if v_shipment.status = 'cancelled' then
    return p_shipment_id;
  end if;
  if v_shipment.status in ('dispatched', 'delivered') then
    raise exception 'shipment_not_cancellable_after_dispatch' using errcode = '22023';
  end if;

  update public.inventory_shipment_item
  set status = 'cancelled'
  where shipment_id = p_shipment_id
    and organization_id = p_org;

  update public.inventory_shipment
  set status = 'cancelled',
      updated_by = v_uid
  where id = p_shipment_id
    and organization_id = p_org;

  insert into public.inventory_shipment_history (
    organization_id,
    shipment_id,
    action,
    old_value,
    new_value,
    reason,
    actor_user_id
  ) values (
    p_org,
    p_shipment_id,
    'ShipmentCancelled',
    v_shipment.status,
    'cancelled',
    v_reason,
    v_uid
  );

  perform public.shipment_record_audit(
    p_org,
    p_shipment_id,
    'ShipmentCancelled',
    jsonb_build_object('from', v_shipment.status, 'to', 'cancelled', 'reason', v_reason)
  );

  return p_shipment_id;
end;
$$;

create or replace function public.get_inventory_shipment(
  p_org uuid,
  p_shipment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  perform public.shipment_require_permission(p_org, 'shipment.read');

  return (
    select jsonb_build_object(
      'document', to_jsonb(s),
      'items', coalesce((
        select jsonb_agg(to_jsonb(i) order by i.sort_order)
        from public.inventory_shipment_item i
        where i.shipment_id = s.id
          and i.organization_id = p_org
      ), '[]'::jsonb),
      'movements', coalesce((
        select jsonb_agg(to_jsonb(m) order by m.occurred_at, m.id)
        from public.inventory_ledger_movement m
        where m.organization_id = p_org
          and m.reference_type = 'inventory_shipment'
          and m.reference_id = s.id
      ), '[]'::jsonb),
      'history', coalesce((
        select jsonb_agg(to_jsonb(h) order by h.created_at desc)
        from public.inventory_shipment_history h
        where h.shipment_id = s.id
          and h.organization_id = p_org
      ), '[]'::jsonb)
    )
    from public.inventory_shipment s
    where s.id = p_shipment_id
      and s.organization_id = p_org
  );
end;
$$;

create or replace function public.list_inventory_shipments(
  p_org uuid,
  p_query text default null,
  p_status text default null,
  p_limit int default 50
)
returns setof public.inventory_shipment_search
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.inventory_shipment_search
  where organization_id = p_org
    and public.shipment_has_permission(p_org, 'shipment.read')
    and (nullif(p_status, '') is null or status = p_status)
    and (
      nullif(trim(coalesce(p_query, '')), '') is null
      or to_tsvector('simple', search_text) @@ plainto_tsquery('simple', p_query)
      or search_text ilike '%' || p_query || '%'
    )
  order by created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

alter table public.inventory_shipment_number_counter enable row level security;
alter table public.inventory_shipment enable row level security;
alter table public.inventory_shipment_item enable row level security;
alter table public.inventory_shipment_history enable row level security;
alter table public.inventory_shipment_search enable row level security;

create policy inventory_shipment_number_counter_read
  on public.inventory_shipment_number_counter
  for select to authenticated
  using (public.shipment_has_permission(organization_id, 'shipment.read'));

create policy inventory_shipment_read
  on public.inventory_shipment
  for select to authenticated
  using (public.shipment_has_permission(organization_id, 'shipment.read'));

create policy inventory_shipment_item_read
  on public.inventory_shipment_item
  for select to authenticated
  using (public.shipment_has_permission(organization_id, 'shipment.read'));

create policy inventory_shipment_history_read
  on public.inventory_shipment_history
  for select to authenticated
  using (public.shipment_has_permission(organization_id, 'shipment.read'));

create policy inventory_shipment_search_read
  on public.inventory_shipment_search
  for select to authenticated
  using (public.shipment_has_permission(organization_id, 'shipment.read'));

grant select on public.inventory_shipment_number_counter to authenticated;
grant select on public.inventory_shipment to authenticated;
grant select on public.inventory_shipment_item to authenticated;
grant select on public.inventory_shipment_history to authenticated;
grant select on public.inventory_shipment_search to authenticated;

revoke all on function public.refresh_inventory_shipment_search(uuid) from public;
revoke all on function public.create_inventory_shipment(uuid, uuid, text) from public;
revoke all on function public.mark_inventory_shipment_ready(uuid, uuid, text, text, text, numeric, date, text) from public;
revoke all on function public.dispatch_inventory_shipment(uuid, uuid, text) from public;
revoke all on function public.complete_inventory_shipment(uuid, uuid, date) from public;
revoke all on function public.cancel_inventory_shipment(uuid, uuid, text) from public;
revoke all on function public.get_inventory_shipment(uuid, uuid) from public;
revoke all on function public.list_inventory_shipments(uuid, text, text, int) from public;

grant execute on function public.shipment_has_permission(uuid, text) to authenticated;
grant execute on function public.create_inventory_shipment(uuid, uuid, text) to authenticated;
grant execute on function public.mark_inventory_shipment_ready(uuid, uuid, text, text, text, numeric, date, text) to authenticated;
grant execute on function public.dispatch_inventory_shipment(uuid, uuid, text) to authenticated;
grant execute on function public.complete_inventory_shipment(uuid, uuid, date) to authenticated;
grant execute on function public.cancel_inventory_shipment(uuid, uuid, text) to authenticated;
grant execute on function public.get_inventory_shipment(uuid, uuid) to authenticated;
grant execute on function public.list_inventory_shipments(uuid, text, text, int) to authenticated;
