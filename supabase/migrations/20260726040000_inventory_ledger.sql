-- Sprint 024 — Inventory Ledger (variant × location)
-- Append-only ledger is the source of truth.
-- inventory_item.qty_on_hand is a projection updated only by SECURITY DEFINER RPCs.
-- Legacy product-scoped inventory_movement remains for /estoque MVP (not dual-written by this engine).

-- ---------------------------------------------------------------------------
-- Projection versioning on inventory_item
-- ---------------------------------------------------------------------------
alter table public.inventory_item
  add column if not exists version integer not null default 0
  check (version >= 0);

comment on column public.inventory_item.version is
  'Optimistic concurrency token. Incremented only by ledger projection RPCs.';

-- Block client qty/version/reserved mutations (defense in depth).
-- SECURITY DEFINER RPCs set local config inventory.allow_projection = 'on'.
create or replace function public.deny_inventory_item_direct_qty_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('inventory.allow_projection', true) = 'on' then
    return new;
  end if;
  if
    new.qty_on_hand is distinct from old.qty_on_hand
    or new.qty_reserved is distinct from old.qty_reserved
    or new.version is distinct from old.version
  then
    raise exception 'inventory_item_qty_projection_only' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists inventory_item_no_direct_qty on public.inventory_item;
create trigger inventory_item_no_direct_qty
  before update on public.inventory_item
  for each row execute function public.deny_inventory_item_direct_qty_mutation();

-- ---------------------------------------------------------------------------
-- Official ledger delta (includes transfer + reversal)
-- ---------------------------------------------------------------------------
create or replace function public.inventory_ledger_delta(
  p_type text,
  p_quantity numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case p_type
    when 'entry' then p_quantity
    when 'adjustment_in' then p_quantity
    when 'transfer_in' then p_quantity
    when 'exit' then -p_quantity
    when 'adjustment_out' then -p_quantity
    when 'transfer_out' then -p_quantity
    when 'reversal' then p_quantity -- signed quantity supplied by caller (may be negative)
    else null
  end;
$$;

revoke all on function public.inventory_ledger_delta(text, numeric) from public;
grant execute on function public.inventory_ledger_delta(text, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- inventory_ledger_movement (append-only FT)
-- ---------------------------------------------------------------------------
create table public.inventory_ledger_movement (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  variant_id uuid not null references public.product_variant (id) on delete restrict,
  location_id uuid not null references public.stock_location (id) on delete restrict,
  inventory_item_id uuid not null references public.inventory_item (id) on delete restrict,
  type text not null check (
    type in (
      'entry',
      'exit',
      'adjustment_in',
      'adjustment_out',
      'transfer_out',
      'transfer_in',
      'reversal'
    )
  ),
  quantity numeric(18, 6) not null check (quantity > 0),
  signed_delta numeric(18, 6) not null,
  before_quantity numeric(18, 6) not null check (before_quantity >= 0),
  after_quantity numeric(18, 6) not null check (after_quantity >= 0),
  reason text not null check (
    char_length(trim(reason)) >= 1
    and char_length(reason) <= 500
  ),
  notes text check (
    notes is null or char_length(notes) <= 2000
  ),
  reference_type text check (
    reference_type is null or char_length(reference_type) <= 64
  ),
  reference_id uuid,
  correlation_id uuid,
  idempotency_key text check (
    idempotency_key is null
    or (
      char_length(trim(idempotency_key)) >= 1
      and char_length(idempotency_key) <= 128
    )
  ),
  reverses_movement_id uuid references public.inventory_ledger_movement (id) on delete restrict,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id)
);

create unique index inventory_ledger_movement_org_idempotency_uidx
  on public.inventory_ledger_movement (organization_id, idempotency_key)
  where idempotency_key is not null;

create index inventory_ledger_movement_org_variant_occurred_idx
  on public.inventory_ledger_movement (
    organization_id, variant_id, occurred_at desc
  );

create index inventory_ledger_movement_org_location_occurred_idx
  on public.inventory_ledger_movement (
    organization_id, location_id, occurred_at desc
  );

create index inventory_ledger_movement_org_item_occurred_idx
  on public.inventory_ledger_movement (
    organization_id, inventory_item_id, occurred_at desc
  );

create index inventory_ledger_movement_org_correlation_idx
  on public.inventory_ledger_movement (organization_id, correlation_id)
  where correlation_id is not null;

create index inventory_ledger_movement_org_type_occurred_idx
  on public.inventory_ledger_movement (
    organization_id, type, occurred_at desc
  );

comment on table public.inventory_ledger_movement is
  'Append-only inventory ledger (variant × location). Projection updates inventory_item. Soft delete forbidden.';

-- Immutability
create or replace function public.deny_inventory_ledger_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'inventory_ledger_immutable' using errcode = '42501';
end;
$$;

create trigger inventory_ledger_movement_no_update
  before update on public.inventory_ledger_movement
  for each row execute function public.deny_inventory_ledger_mutation();

create trigger inventory_ledger_movement_no_delete
  before delete on public.inventory_ledger_movement
  for each row execute function public.deny_inventory_ledger_mutation();

alter table public.inventory_ledger_movement enable row level security;

create policy inventory_ledger_movement_select_member
  on public.inventory_ledger_movement
  for select to authenticated
  using (public.is_org_member(organization_id));

-- No INSERT/UPDATE/DELETE for clients — writes only via SECURITY DEFINER RPCs.

grant select on public.inventory_ledger_movement to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic register (single movement + project balance)
-- ---------------------------------------------------------------------------
create or replace function public.register_inventory_ledger_movement(
  p_organization_id uuid,
  p_variant_id uuid,
  p_location_id uuid,
  p_type text,
  p_quantity numeric,
  p_reason text,
  p_notes text default null,
  p_occurred_at timestamptz default now(),
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_correlation_id uuid default null,
  p_idempotency_key text default null,
  p_reverses_movement_id uuid default null,
  p_signed_delta numeric default null
)
returns public.inventory_ledger_movement
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_variant public.product_variant;
  v_product public.product;
  v_location public.stock_location;
  v_item public.inventory_item;
  v_delta numeric;
  v_balance numeric;
  v_row public.inventory_ledger_movement;
  v_reason text := trim(coalesce(p_reason, ''));
  v_notes text := nullif(trim(coalesce(p_notes, '')), '');
  v_idem text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  v_existing public.inventory_ledger_movement;
  v_reversed public.inventory_ledger_movement;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not public.is_org_member(p_organization_id) then
    raise exception 'not_org_member' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'invalid_quantity' using errcode = '22023';
  end if;
  if v_reason = '' or char_length(v_reason) > 500 then
    raise exception 'invalid_reason' using errcode = '22023';
  end if;

  -- Idempotency: return prior result
  if v_idem is not null then
    select *
    into v_existing
    from public.inventory_ledger_movement
    where organization_id = p_organization_id
      and idempotency_key = v_idem;
    if found then
      return v_existing;
    end if;
  end if;

  -- Lock variant
  select *
  into v_variant
  from public.product_variant
  where id = p_variant_id
    and organization_id = p_organization_id
  for update;
  if not found then
    raise exception 'variant_not_found' using errcode = 'P0002';
  end if;
  if v_variant.status <> 'active' then
    raise exception 'variant_not_active' using errcode = '22023';
  end if;
  if not v_variant.tracks_inventory then
    raise exception 'variant_does_not_track_inventory' using errcode = '22023';
  end if;

  -- Lock product
  select *
  into v_product
  from public.product
  where id = v_variant.product_id
    and organization_id = p_organization_id
  for update;
  if not found then
    raise exception 'product_not_found' using errcode = 'P0002';
  end if;
  if v_product.status <> 'active' then
    raise exception 'product_not_active' using errcode = '22023';
  end if;

  -- Lock location
  select *
  into v_location
  from public.stock_location
  where id = p_location_id
    and organization_id = p_organization_id
  for update;
  if not found then
    raise exception 'location_not_found' using errcode = 'P0002';
  end if;
  if v_location.status <> 'active' then
    raise exception 'location_not_active' using errcode = '22023';
  end if;

  -- Reversal validation
  if p_type = 'reversal' then
    if p_reverses_movement_id is null then
      raise exception 'reversal_requires_target' using errcode = '22023';
    end if;
    select *
    into v_reversed
    from public.inventory_ledger_movement
    where id = p_reverses_movement_id
      and organization_id = p_organization_id
    for update;
    if not found then
      raise exception 'movement_not_found' using errcode = 'P0002';
    end if;
    if v_reversed.variant_id <> p_variant_id or v_reversed.location_id <> p_location_id then
      raise exception 'reversal_target_mismatch' using errcode = '22023';
    end if;
    if exists (
      select 1
      from public.inventory_ledger_movement r
      where r.organization_id = p_organization_id
        and r.reverses_movement_id = p_reverses_movement_id
        and r.type = 'reversal'
    ) then
      raise exception 'movement_already_reversed' using errcode = '22023';
    end if;
    -- Neutralize prior signed_delta
    v_delta := -v_reversed.signed_delta;
  else
    if p_signed_delta is not null then
      v_delta := p_signed_delta;
    else
      v_delta := public.inventory_ledger_delta(p_type, p_quantity);
    end if;
    if v_delta is null then
      raise exception 'invalid_movement_type' using errcode = '22023';
    end if;
  end if;

  -- Ensure projection row, then lock
  insert into public.inventory_item (
    organization_id,
    location_id,
    variant_id,
    qty_on_hand,
    qty_reserved,
    status,
    created_by,
    updated_by
  ) values (
    p_organization_id,
    p_location_id,
    p_variant_id,
    0,
    0,
    'active',
    v_uid,
    v_uid
  )
  on conflict (organization_id, location_id, variant_id) do nothing;

  select *
  into v_item
  from public.inventory_item
  where organization_id = p_organization_id
    and location_id = p_location_id
    and variant_id = p_variant_id
  for update;

  if v_item.status <> 'active' then
    raise exception 'inventory_item_not_active' using errcode = '22023';
  end if;

  v_balance := v_item.qty_on_hand;
  if v_balance + v_delta < 0 then
    raise exception 'insufficient_stock' using errcode = '22023';
  end if;

  insert into public.inventory_ledger_movement (
    organization_id,
    variant_id,
    location_id,
    inventory_item_id,
    type,
    quantity,
    signed_delta,
    before_quantity,
    after_quantity,
    reason,
    notes,
    reference_type,
    reference_id,
    correlation_id,
    idempotency_key,
    reverses_movement_id,
    occurred_at,
    created_by
  ) values (
    p_organization_id,
    p_variant_id,
    p_location_id,
    v_item.id,
    p_type,
    p_quantity,
    v_delta,
    v_balance,
    v_balance + v_delta,
    v_reason,
    v_notes,
    nullif(trim(coalesce(p_reference_type, '')), ''),
    p_reference_id,
    p_correlation_id,
    v_idem,
    p_reverses_movement_id,
    coalesce(p_occurred_at, now()),
    v_uid
  )
  returning * into v_row;

  perform set_config('inventory.allow_projection', 'on', true);
  update public.inventory_item
  set
    qty_on_hand = v_balance + v_delta,
    version = v_item.version + 1,
    updated_by = v_uid,
    updated_at = now()
  where id = v_item.id;

  return v_row;
end;
$$;

revoke all on function public.register_inventory_ledger_movement(
  uuid, uuid, uuid, text, numeric, text, text, timestamptz, text, uuid, uuid, text, uuid, numeric
) from public;
grant execute on function public.register_inventory_ledger_movement(
  uuid, uuid, uuid, text, numeric, text, text, timestamptz, text, uuid, uuid, text, uuid, numeric
) to authenticated;

comment on function public.register_inventory_ledger_movement is
  'Atomic ledger append + inventory_item projection. Idempotent by (org, idempotency_key). Locks variant/location/item.';

-- ---------------------------------------------------------------------------
-- Atomic transfer (TRANSFER_OUT + TRANSFER_IN, same correlation_id)
-- ---------------------------------------------------------------------------
create or replace function public.register_inventory_ledger_transfer(
  p_organization_id uuid,
  p_variant_id uuid,
  p_from_location_id uuid,
  p_to_location_id uuid,
  p_quantity numeric,
  p_reason text,
  p_notes text default null,
  p_occurred_at timestamptz default now(),
  p_idempotency_key text default null
)
returns setof public.inventory_ledger_movement
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correlation uuid := gen_random_uuid();
  v_idem text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  v_existing public.inventory_ledger_movement;
  v_out public.inventory_ledger_movement;
  v_in public.inventory_ledger_movement;
begin
  if p_from_location_id = p_to_location_id then
    raise exception 'transfer_same_location' using errcode = '22023';
  end if;

  if v_idem is not null then
    select *
    into v_existing
    from public.inventory_ledger_movement
    where organization_id = p_organization_id
      and idempotency_key = v_idem
      and type = 'transfer_out';
    if found then
      return query
        select *
        from public.inventory_ledger_movement
        where organization_id = p_organization_id
          and correlation_id = v_existing.correlation_id
        order by created_at;
      return;
    end if;
  end if;

  v_out := public.register_inventory_ledger_movement(
    p_organization_id,
    p_variant_id,
    p_from_location_id,
    'transfer_out',
    p_quantity,
    p_reason,
    p_notes,
    p_occurred_at,
    'transfer',
    null,
    v_correlation,
    v_idem,
    null,
    null
  );

  v_in := public.register_inventory_ledger_movement(
    p_organization_id,
    p_variant_id,
    p_to_location_id,
    'transfer_in',
    p_quantity,
    p_reason,
    p_notes,
    p_occurred_at,
    'transfer',
    v_out.id,
    v_correlation,
    case when v_idem is null then null else v_idem || ':in' end,
    null,
    null
  );

  return next v_out;
  return next v_in;
end;
$$;

revoke all on function public.register_inventory_ledger_transfer(
  uuid, uuid, uuid, uuid, numeric, text, text, timestamptz, text
) from public;
grant execute on function public.register_inventory_ledger_transfer(
  uuid, uuid, uuid, uuid, numeric, text, text, timestamptz, text
) to authenticated;

comment on function public.register_inventory_ledger_transfer is
  'Atomic transfer: TRANSFER_OUT + TRANSFER_IN with shared correlation_id.';
