-- Inventory Security & Canonicalization Hardening
-- No business capability is added. This migration closes authorization and
-- projection bypasses, persists canonical audit evidence and exposes a
-- read-only reconciliation diagnostic.

-- ---------------------------------------------------------------------------
-- Canonical persisted audit (documented platform mechanism)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_event (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organization (id) on delete restrict,
  actor_user_id uuid references auth.users (id) on delete restrict,
  actor_type text not null default 'user'
    check (actor_type in ('user', 'system', 'support')),
  aggregate_type text not null,
  aggregate_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  before_state jsonb,
  after_state jsonb,
  reason text,
  correlation_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists audit_event_org_created_idx
  on public.audit_event (organization_id, created_at desc);
create index if not exists audit_event_org_aggregate_idx
  on public.audit_event (organization_id, aggregate_type, aggregate_id);
create index if not exists audit_event_org_actor_idx
  on public.audit_event (organization_id, actor_user_id, created_at desc);
create index if not exists audit_event_correlation_idx
  on public.audit_event (correlation_id)
  where correlation_id is not null;

create or replace function public.deny_audit_event_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('audit.allow_admin', true) = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'audit_event_immutable' using errcode = '42501';
end;
$$;

drop trigger if exists audit_event_no_update on public.audit_event;
create trigger audit_event_no_update
  before update on public.audit_event
  for each row execute function public.deny_audit_event_mutation();

drop trigger if exists audit_event_no_delete on public.audit_event;
create trigger audit_event_no_delete
  before delete on public.audit_event
  for each row execute function public.deny_audit_event_mutation();

alter table public.audit_event enable row level security;

drop policy if exists audit_event_owner_admin_read on public.audit_event;
create policy audit_event_owner_admin_read
  on public.audit_event
  for select to authenticated
  using (
    exists (
      select 1
      from public.membership m
      where m.organization_id = audit_event.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    )
  );

revoke all on table public.audit_event from public, anon, authenticated;
grant select on table public.audit_event to authenticated;

-- ---------------------------------------------------------------------------
-- Inventory permission contract
-- Canonical permissions are explicit. inventory.move remains a deprecated
-- compatibility alias for inventory.movements.create.
-- ---------------------------------------------------------------------------
create or replace function public.inventory_has_permission(
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
  v_permission text := case
    when p_permission = 'inventory.move' then 'inventory.movements.create'
    else p_permission
  end;
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

  if v_permission in ('inventory.read', 'inventory.movements.read') then
    return v_role in ('manager', 'inventory', 'viewer');
  end if;

  if v_permission in (
    'inventory.create',
    'inventory.edit',
    'inventory.archive',
    'inventory.restore',
    'inventory.locations.manage',
    'inventory.movements.create',
    'inventory.adjust',
    'inventory.transfer',
    'inventory.reverse'
  ) then
    return v_role in ('manager', 'inventory');
  end if;

  return false;
end;
$$;

create or replace function public.inventory_require_permission(
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
  if not public.inventory_has_permission(p_org, p_permission) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.inventory_has_permission(uuid, text) from public;
revoke all on function public.inventory_require_permission(uuid, text) from public;
grant execute on function public.inventory_has_permission(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Projection-only quantity enforcement
-- Identity rows may be created directly only with a zero projection.
-- ---------------------------------------------------------------------------
create or replace function public.deny_inventory_item_direct_qty_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('inventory.allow_projection', true) = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.qty_on_hand <> 0 or new.qty_reserved <> 0 or new.version <> 0 then
      raise exception 'inventory_item_qty_projection_only' using errcode = '42501';
    end if;
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
  before insert or update on public.inventory_item
  for each row execute function public.deny_inventory_item_direct_qty_mutation();

-- ---------------------------------------------------------------------------
-- Permission-aware RLS
-- ---------------------------------------------------------------------------
drop policy if exists stock_location_select_member on public.stock_location;
drop policy if exists stock_location_insert_member on public.stock_location;
drop policy if exists stock_location_update_member on public.stock_location;

create policy stock_location_read
  on public.stock_location for select to authenticated
  using (public.inventory_has_permission(organization_id, 'inventory.read'));
create policy stock_location_create
  on public.stock_location for insert to authenticated
  with check (
    public.inventory_has_permission(organization_id, 'inventory.locations.manage')
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy stock_location_update
  on public.stock_location for update to authenticated
  using (
    public.inventory_has_permission(organization_id, 'inventory.locations.manage')
  )
  with check (
    public.inventory_has_permission(organization_id, 'inventory.locations.manage')
    and updated_by = auth.uid()
  );

drop policy if exists inventory_item_select_member on public.inventory_item;
drop policy if exists inventory_item_insert_member on public.inventory_item;
drop policy if exists inventory_item_update_member on public.inventory_item;

create policy inventory_item_read
  on public.inventory_item for select to authenticated
  using (public.inventory_has_permission(organization_id, 'inventory.read'));
create policy inventory_item_create_zero_projection
  on public.inventory_item for insert to authenticated
  with check (
    public.inventory_has_permission(organization_id, 'inventory.create')
    and qty_on_hand = 0
    and qty_reserved = 0
    and version = 0
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy inventory_item_update_metadata
  on public.inventory_item for update to authenticated
  using (public.inventory_has_permission(organization_id, 'inventory.edit'))
  with check (
    public.inventory_has_permission(organization_id, 'inventory.edit')
    and updated_by = auth.uid()
  );

drop policy if exists inventory_item_history_select_member
  on public.inventory_item_history;
drop policy if exists inventory_item_history_insert_member
  on public.inventory_item_history;

create policy inventory_item_history_read
  on public.inventory_item_history for select to authenticated
  using (
    public.inventory_has_permission(
      organization_id,
      'inventory.movements.read'
    )
  );
create policy inventory_item_history_append
  on public.inventory_item_history for insert to authenticated
  with check (
    (
      public.inventory_has_permission(organization_id, 'inventory.create')
      or public.inventory_has_permission(organization_id, 'inventory.edit')
    )
    and recorded_by = auth.uid()
  );

drop policy if exists inventory_ledger_movement_select_member
  on public.inventory_ledger_movement;
create policy inventory_ledger_movement_read
  on public.inventory_ledger_movement for select to authenticated
  using (
    public.inventory_has_permission(
      organization_id,
      'inventory.movements.read'
    )
  );

-- ---------------------------------------------------------------------------
-- Persisted inventory audit
-- ---------------------------------------------------------------------------
create or replace function public.inventory_record_audit(
  p_org uuid,
  p_aggregate_type text,
  p_aggregate_id uuid,
  p_action text,
  p_before jsonb default null,
  p_after jsonb default null,
  p_payload jsonb default '{}'::jsonb,
  p_reason text default null,
  p_correlation_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_event (
    organization_id,
    actor_user_id,
    actor_type,
    aggregate_type,
    aggregate_id,
    action,
    payload,
    before_state,
    after_state,
    reason,
    correlation_id
  ) values (
    p_org,
    auth.uid(),
    case when auth.uid() is null then 'system' else 'user' end,
    p_aggregate_type,
    p_aggregate_id,
    p_action,
    coalesce(p_payload, '{}'::jsonb),
    p_before,
    p_after,
    p_reason,
    p_correlation_id
  );
end;
$$;

revoke all on function public.inventory_record_audit(
  uuid, text, uuid, text, jsonb, jsonb, jsonb, text, uuid
) from public, authenticated;

create or replace function public.audit_stock_location_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.inventory_record_audit(
    new.organization_id,
    'stock_location',
    new.id,
    case when tg_op = 'INSERT' then 'StockLocationCreated'
         else 'StockLocationUpdated' end,
    case when tg_op = 'UPDATE' then
      jsonb_build_object(
        'code', old.code,
        'name', old.name,
        'status', old.status,
        'isDefault', old.is_default,
        'priority', old.priority
      )
      else null end,
    jsonb_build_object(
      'code', new.code,
      'name', new.name,
      'status', new.status,
      'isDefault', new.is_default,
      'priority', new.priority
    )
  );
  return new;
end;
$$;

drop trigger if exists stock_location_audit on public.stock_location;
create trigger stock_location_audit
  after insert or update on public.stock_location
  for each row execute function public.audit_stock_location_change();

create or replace function public.audit_inventory_item_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.inventory_record_audit(
    new.organization_id,
    'inventory_item',
    new.id,
    case when tg_op = 'INSERT' then 'InventoryItemCreated'
         else 'InventoryItemUpdated' end,
    case when tg_op = 'UPDATE' then
      jsonb_build_object(
        'status', old.status,
        'quantityOnHand', old.qty_on_hand,
        'quantityReserved', old.qty_reserved,
        'version', old.version
      )
      else null end,
    jsonb_build_object(
      'status', new.status,
      'quantityOnHand', new.qty_on_hand,
      'quantityReserved', new.qty_reserved,
      'version', new.version
    ),
    jsonb_build_object(
      'variantId', new.variant_id,
      'locationId', new.location_id
    )
  );
  return new;
end;
$$;

drop trigger if exists inventory_item_audit on public.inventory_item;
create trigger inventory_item_audit
  after insert or update on public.inventory_item
  for each row execute function public.audit_inventory_item_change();

-- ---------------------------------------------------------------------------
-- Authorized wrappers around the already canonical ledger implementation.
-- The original implementation remains unchanged and becomes private.
-- ---------------------------------------------------------------------------
alter function public.register_inventory_ledger_movement(
  uuid, uuid, uuid, text, numeric, text, text, timestamptz, text, uuid, uuid,
  text, uuid, numeric
) rename to apply_inventory_ledger_movement;

revoke all on function public.apply_inventory_ledger_movement(
  uuid, uuid, uuid, text, numeric, text, text, timestamptz, text, uuid, uuid,
  text, uuid, numeric
) from public, anon, authenticated;

create function public.register_inventory_ledger_movement(
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
  v_permission text;
  v_row public.inventory_ledger_movement;
begin
  v_permission := case
    when p_type in ('entry', 'exit') then 'inventory.movements.create'
    when p_type in ('adjustment_in', 'adjustment_out') then 'inventory.adjust'
    when p_type in ('transfer_in', 'transfer_out') then 'inventory.transfer'
    when p_type = 'reversal' then 'inventory.reverse'
    else 'inventory.movements.create'
  end;
  perform public.inventory_require_permission(p_organization_id, v_permission);

  v_row := public.apply_inventory_ledger_movement(
    p_organization_id,
    p_variant_id,
    p_location_id,
    p_type,
    p_quantity,
    p_reason,
    p_notes,
    p_occurred_at,
    p_reference_type,
    p_reference_id,
    p_correlation_id,
    p_idempotency_key,
    p_reverses_movement_id,
    p_signed_delta
  );

  if not exists (
    select 1
    from public.audit_event a
    where a.organization_id = p_organization_id
      and a.aggregate_type = 'inventory_ledger_movement'
      and a.aggregate_id = v_row.id
      and a.action = case when p_type = 'reversal'
        then 'InventoryMovementReversed'
        else 'InventoryMovementRegistered'
      end
  ) then
    perform public.inventory_record_audit(
      p_organization_id,
      'inventory_ledger_movement',
      v_row.id,
      case when p_type = 'reversal' then 'InventoryMovementReversed'
           else 'InventoryMovementRegistered' end,
      null,
      jsonb_build_object(
        'type', v_row.type,
        'quantity', v_row.quantity,
        'signedDelta', v_row.signed_delta,
        'beforeQuantity', v_row.before_quantity,
        'afterQuantity', v_row.after_quantity
      ),
      jsonb_build_object(
        'variantId', v_row.variant_id,
        'locationId', v_row.location_id,
        'referenceType', v_row.reference_type,
        'referenceId', v_row.reference_id
      ),
      v_row.reason,
      v_row.correlation_id
    );
  end if;

  return v_row;
end;
$$;

revoke all on function public.register_inventory_ledger_movement(
  uuid, uuid, uuid, text, numeric, text, text, timestamptz, text, uuid, uuid,
  text, uuid, numeric
) from public, anon;
grant execute on function public.register_inventory_ledger_movement(
  uuid, uuid, uuid, text, numeric, text, text, timestamptz, text, uuid, uuid,
  text, uuid, numeric
) to authenticated;

alter function public.register_inventory_ledger_transfer(
  uuid, uuid, uuid, uuid, numeric, text, text, timestamptz, text
) rename to apply_inventory_ledger_transfer;

revoke all on function public.apply_inventory_ledger_transfer(
  uuid, uuid, uuid, uuid, numeric, text, text, timestamptz, text
) from public, anon, authenticated;

create function public.register_inventory_ledger_transfer(
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
begin
  perform public.inventory_require_permission(
    p_organization_id,
    'inventory.transfer'
  );
  return query
    select *
    from public.apply_inventory_ledger_transfer(
      p_organization_id,
      p_variant_id,
      p_from_location_id,
      p_to_location_id,
      p_quantity,
      p_reason,
      p_notes,
      p_occurred_at,
      p_idempotency_key
    );
end;
$$;

revoke all on function public.register_inventory_ledger_transfer(
  uuid, uuid, uuid, uuid, numeric, text, text, timestamptz, text
) from public, anon;
grant execute on function public.register_inventory_ledger_transfer(
  uuid, uuid, uuid, uuid, numeric, text, text, timestamptz, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Read-only reconciliation. It never repairs or mutates data.
-- ---------------------------------------------------------------------------
create or replace function public.reconcile_inventory_ledger(
  p_organization_id uuid,
  p_only_inconsistent boolean default true
)
returns table (
  organization_id uuid,
  variant_id uuid,
  location_id uuid,
  inventory_item_id uuid,
  projected_quantity numeric,
  ledger_quantity numeric,
  difference numeric,
  movement_count bigint,
  issues text[]
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  perform public.inventory_require_permission(
    p_organization_id,
    'inventory.movements.read'
  );

  return query
  with ledger as (
    select
      m.organization_id,
      m.variant_id,
      m.location_id,
      (array_agg(m.inventory_item_id order by m.created_at))[1]
        as inventory_item_id,
      coalesce(sum(m.signed_delta), 0)::numeric as quantity,
      count(*)::bigint as movement_count,
      bool_or(
        m.after_quantity <> m.before_quantity + m.signed_delta
      ) as invalid_chain
    from public.inventory_ledger_movement m
    where m.organization_id = p_organization_id
    group by m.organization_id, m.variant_id, m.location_id
  ),
  compared as (
    select
      coalesce(i.organization_id, l.organization_id) as organization_id,
      coalesce(i.variant_id, l.variant_id) as variant_id,
      coalesce(i.location_id, l.location_id) as location_id,
      i.id as inventory_item_id,
      coalesce(i.qty_on_hand, 0)::numeric as projected_quantity,
      coalesce(l.quantity, 0)::numeric as ledger_quantity,
      (
        coalesce(i.qty_on_hand, 0) - coalesce(l.quantity, 0)
      )::numeric as difference,
      coalesce(l.movement_count, 0)::bigint as movement_count,
      array_remove(array[
        case when i.id is null then 'missing_projection' end,
        case
          when coalesce(l.movement_count, 0) = 0
            and coalesce(i.qty_on_hand, 0) <> 0
          then 'missing_ledger_movement'
        end,
        case
          when coalesce(i.qty_on_hand, 0) <> coalesce(l.quantity, 0)
          then 'balance_divergence'
        end,
        case when coalesce(l.invalid_chain, false)
          then 'movement_chain_invalid' end
      ], null)::text[] as issues
    from public.inventory_item i
    full join ledger l
      on l.organization_id = i.organization_id
     and l.variant_id = i.variant_id
     and l.location_id = i.location_id
    where coalesce(i.organization_id, l.organization_id) = p_organization_id
  )
  select
    c.organization_id,
    c.variant_id,
    c.location_id,
    c.inventory_item_id,
    c.projected_quantity,
    c.ledger_quantity,
    c.difference,
    c.movement_count,
    c.issues
  from compared c
  where not p_only_inconsistent or cardinality(c.issues) > 0
  order by c.variant_id, c.location_id;
end;
$$;

revoke all on function public.reconcile_inventory_ledger(uuid, boolean)
  from public, anon;
grant execute on function public.reconcile_inventory_ledger(uuid, boolean)
  to authenticated;

comment on function public.reconcile_inventory_ledger(uuid, boolean) is
  'Read-only variant-scoped ledger x inventory_item diagnostic. Never repairs data.';

comment on table public.inventory_item is
  'Canonical variant+location balance projection. Physical quantity is written only by Inventory ledger RPCs.';
comment on table public.inventory_ledger_movement is
  'Canonical append-only physical stock source of truth scoped by organization, variant and StockLocation.';
