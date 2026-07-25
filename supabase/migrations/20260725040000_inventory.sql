-- Inventory bounded context (ledger + materializado)
-- Fonte de verdade: inventory_movement (append-only).
-- inventory_balance: materialização reconstruível, atualizada só via RPC atômica.
-- App enforces inventory.read | inventory.move | inventory.adjust.

-- ---------------------------------------------------------------------------
-- Official signed delta (single formula for saldo)
-- entry / adjustment_in = +qty ; exit / adjustment_out = -qty
-- ---------------------------------------------------------------------------
create or replace function public.inventory_movement_delta(
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
    when 'exit' then -p_quantity
    when 'adjustment_out' then -p_quantity
    else null
  end;
$$;

comment on function public.inventory_movement_delta(text, numeric) is
  'Official stock delta: entry/adjustment_in +, exit/adjustment_out -. quantity must be > 0.';

revoke all on function public.inventory_movement_delta(text, numeric) from public;
grant execute on function public.inventory_movement_delta(text, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- inventory_movement (FT, immutable)
-- ---------------------------------------------------------------------------
create table public.inventory_movement (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  product_id uuid not null references public.product (id) on delete restrict,
  type text not null check (
    type in ('entry', 'exit', 'adjustment_in', 'adjustment_out')
  ),
  quantity numeric(18, 6) not null check (quantity > 0),
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
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id)
);

create index inventory_movement_org_product_occurred_idx
  on public.inventory_movement (organization_id, product_id, occurred_at desc);

create index inventory_movement_org_type_occurred_idx
  on public.inventory_movement (organization_id, type, occurred_at desc);

create index inventory_movement_org_created_idx
  on public.inventory_movement (organization_id, created_at desc);

comment on table public.inventory_movement is
  'Append-only inventory ledger. No UPDATE/DELETE. Corrections = new compensating movements.';

-- ---------------------------------------------------------------------------
-- inventory_balance (materialized, not independent FT)
-- ---------------------------------------------------------------------------
create table public.inventory_balance (
  organization_id uuid not null references public.organization (id) on delete restrict,
  product_id uuid not null references public.product (id) on delete restrict,
  quantity numeric(18, 6) not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (organization_id, product_id)
);

create index inventory_balance_org_qty_idx
  on public.inventory_balance (organization_id, quantity);

comment on table public.inventory_balance is
  'Materialized on-hand qty per product. Recomputable from inventory_movement. Mutated only by register_inventory_movement.';

-- ---------------------------------------------------------------------------
-- Reconstruct balance from ledger (official query helper)
-- ---------------------------------------------------------------------------
create or replace function public.compute_product_stock(
  p_organization_id uuid,
  p_product_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    sum(public.inventory_movement_delta(m.type, m.quantity)),
    0
  )
  from public.inventory_movement m
  where m.organization_id = p_organization_id
    and m.product_id = p_product_id;
$$;

revoke all on function public.compute_product_stock(uuid, uuid) from public;
grant execute on function public.compute_product_stock(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic register movement (concurrency + no negative stock)
-- ---------------------------------------------------------------------------
create or replace function public.register_inventory_movement(
  p_organization_id uuid,
  p_product_id uuid,
  p_type text,
  p_quantity numeric,
  p_reason text,
  p_notes text default null,
  p_occurred_at timestamptz default now(),
  p_reference_type text default null,
  p_reference_id uuid default null
)
returns public.inventory_movement
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_product public.product;
  v_delta numeric;
  v_balance numeric;
  v_row public.inventory_movement;
  v_reason text := trim(coalesce(p_reason, ''));
  v_notes text := nullif(trim(coalesce(p_notes, '')), '');
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

  v_delta := public.inventory_movement_delta(p_type, p_quantity);
  if v_delta is null then
    raise exception 'invalid_movement_type' using errcode = '22023';
  end if;

  if v_reason = '' or char_length(v_reason) > 500 then
    raise exception 'invalid_reason' using errcode = '22023';
  end if;

  -- Lock product row (same org) — serializes movements for this SKU
  select *
  into v_product
  from public.product
  where id = p_product_id
    and organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'product_not_found' using errcode = 'P0002';
  end if;

  if v_product.status <> 'active' then
    raise exception 'product_archived' using errcode = '22023';
  end if;

  -- Ensure balance row exists, then lock it
  insert into public.inventory_balance (organization_id, product_id, quantity)
  values (p_organization_id, p_product_id, 0)
  on conflict (organization_id, product_id) do nothing;

  select b.quantity
  into v_balance
  from public.inventory_balance b
  where b.organization_id = p_organization_id
    and b.product_id = p_product_id
  for update;

  if v_balance + v_delta < 0 then
    raise exception 'insufficient_stock' using errcode = '22023';
  end if;

  insert into public.inventory_movement (
    organization_id,
    product_id,
    type,
    quantity,
    reason,
    notes,
    reference_type,
    reference_id,
    occurred_at,
    created_by
  ) values (
    p_organization_id,
    p_product_id,
    p_type,
    p_quantity,
    v_reason,
    v_notes,
    nullif(trim(coalesce(p_reference_type, '')), ''),
    p_reference_id,
    coalesce(p_occurred_at, now()),
    v_uid
  )
  returning * into v_row;

  update public.inventory_balance
  set
    quantity = v_balance + v_delta,
    updated_at = now()
  where organization_id = p_organization_id
    and product_id = p_product_id;

  return v_row;
end;
$$;

revoke all on function public.register_inventory_movement(
  uuid, uuid, text, numeric, text, text, timestamptz, text, uuid
) from public;
grant execute on function public.register_inventory_movement(
  uuid, uuid, text, numeric, text, text, timestamptz, text, uuid
) to authenticated;

comment on function public.register_inventory_movement is
  'Atomic ledger write + balance update. Locks product + balance. Rejects negative stock and archived products.';

-- Block UPDATE/DELETE on movements (defense in depth beyond RLS)
create or replace function public.deny_inventory_movement_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'inventory_movement_immutable' using errcode = '42501';
end;
$$;

create trigger inventory_movement_no_update
  before update on public.inventory_movement
  for each row execute function public.deny_inventory_movement_mutation();

create trigger inventory_movement_no_delete
  before delete on public.inventory_movement
  for each row execute function public.deny_inventory_movement_mutation();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.inventory_movement enable row level security;
alter table public.inventory_balance enable row level security;

create policy inventory_movement_select_member
  on public.inventory_movement
  for select
  to authenticated
  using (public.is_org_member(organization_id));

-- No INSERT/UPDATE/DELETE policies on inventory_movement for clients.
-- Writes go only through SECURITY DEFINER register_inventory_movement (atomic + balance).

create policy inventory_balance_select_member
  on public.inventory_balance
  for select
  to authenticated
  using (public.is_org_member(organization_id));

-- No INSERT/UPDATE/DELETE policies on inventory_balance for clients.

grant select on public.inventory_movement to authenticated;
grant select on public.inventory_balance to authenticated;
