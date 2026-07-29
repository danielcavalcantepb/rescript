-- Product creation orchestration: Catalog + Pricing + Inventory Ledger.
-- Ownership is intentionally preserved: price_list_entry owns sale price,
-- inventory_ledger_movement owns quantity and this table owns entry valuation.

create table if not exists public.initial_inventory_valuation (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  branch_id uuid not null references public.branch(id) on delete restrict,
  location_id uuid not null references public.stock_location(id) on delete restrict,
  variant_id uuid not null references public.product_variant(id) on delete restrict,
  inventory_ledger_entry_id uuid not null references public.inventory_ledger_movement(id) on delete restrict,
  quantity numeric(18, 6) not null check (quantity > 0),
  unit_cost numeric(19, 6) not null check (unit_cost >= 0),
  total_cost numeric(19, 6) generated always as (round(quantity * unit_cost, 6)) stored,
  currency text not null default 'BRL' check (currency = 'BRL'),
  occurred_at timestamptz not null,
  source_type text not null check (source_type = 'product_creation'),
  source_id uuid not null,
  idempotency_key text not null check (char_length(trim(idempotency_key)) between 1 and 128),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (organization_id, idempotency_key),
  unique (inventory_ledger_entry_id)
);

create index if not exists initial_inventory_valuation_org_variant_idx
  on public.initial_inventory_valuation(organization_id, variant_id, occurred_at desc);
create index if not exists initial_inventory_valuation_org_branch_idx
  on public.initial_inventory_valuation(organization_id, branch_id, occurred_at desc);

create or replace function public.deny_initial_inventory_valuation_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'initial_inventory_valuation_immutable' using errcode = '42501';
end;
$$;
drop trigger if exists initial_inventory_valuation_no_update on public.initial_inventory_valuation;
create trigger initial_inventory_valuation_no_update before update on public.initial_inventory_valuation
for each row execute function public.deny_initial_inventory_valuation_mutation();
drop trigger if exists initial_inventory_valuation_no_delete on public.initial_inventory_valuation;
create trigger initial_inventory_valuation_no_delete before delete on public.initial_inventory_valuation
for each row execute function public.deny_initial_inventory_valuation_mutation();

alter table public.initial_inventory_valuation enable row level security;
create policy initial_inventory_valuation_select_member on public.initial_inventory_valuation
  for select to authenticated using (public.is_org_member(organization_id));
revoke all on public.initial_inventory_valuation from public, anon, authenticated;
grant select on public.initial_inventory_valuation to authenticated;

create table if not exists public.product_creation_request (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  idempotency_key text not null check (char_length(trim(idempotency_key)) between 1 and 128),
  request_payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (organization_id, idempotency_key)
);
alter table public.product_creation_request enable row level security;
create policy product_creation_request_select_member on public.product_creation_request
  for select to authenticated using (public.is_org_member(organization_id));
revoke all on public.product_creation_request from public, anon, authenticated;
grant select on public.product_creation_request to authenticated;

alter table public.price_list_entry add column if not exists idempotency_key text;
create unique index if not exists price_list_entry_org_idempotency_uidx
  on public.price_list_entry(organization_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.product_creation_require_permission(p_org uuid)
returns void language plpgsql security definer set search_path = public stable as $$
declare v_role text;
begin
  if auth.uid() is null or not public.is_org_member(p_org) then
    raise exception 'not_org_member' using errcode = '42501';
  end if;
  select role into v_role from public.membership
  where organization_id = p_org and user_id = auth.uid() and status = 'active';
  -- Existing RBAC groups the required capabilities under the established roles.
  if v_role not in ('owner', 'admin', 'manager') then
    raise exception 'product_creation_permission_denied' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.create_product_with_initial_setup(
  p_organization_id uuid,
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_existing public.product_creation_request%rowtype;
  v_product_id uuid := gen_random_uuid();
  v_branch_id uuid := nullif(p_payload->>'branchId', '')::uuid;
  v_price_list_id uuid := nullif(p_payload->>'priceListId', '')::uuid;
  v_category_id uuid := nullif(p_payload->>'categoryId', '')::uuid;
  v_brand_id uuid := nullif(p_payload->>'brandId', '')::uuid;
  v_unit_id uuid := nullif(p_payload->>'unitOfMeasureId', '')::uuid;
  v_product_sku text;
  v_category_name text;
  v_unit_code text;
  v_variant jsonb;
  v_variant_id uuid;
  v_ledger public.inventory_ledger_movement%rowtype;
  v_location_id uuid;
  v_price_id uuid;
  v_quantity numeric;
  v_cost numeric;
  v_price numeric;
  v_identity text;
  v_barcode text;
  v_barcode_type text;
  v_results jsonb := '[]'::jsonb;
  v_result jsonb;
  v_variant_index integer := 0;
  v_assignment jsonb;
  v_axis_id uuid;
  v_combination_hash text;
  v_variant_branch_id uuid;
begin
  perform public.product_creation_require_permission(p_organization_id);
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'invalid_product_creation_payload' using errcode = '22023'; end if;
  if nullif(trim(coalesce(p_idempotency_key, '')), '') is null then raise exception 'idempotency_key_required' using errcode = '22023'; end if;

  select * into v_existing from public.product_creation_request
    where organization_id = p_organization_id and idempotency_key = p_idempotency_key for update;
  if found then
    if v_existing.request_payload <> p_payload then raise exception 'idempotency_key_payload_mismatch' using errcode = '22023'; end if;
    return v_existing.result;
  end if;

  if nullif(trim(coalesce(p_payload->>'name', '')), '') is null or v_unit_id is null then
    raise exception 'product_name_and_unit_required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_payload->'variants') <> 'array' or jsonb_array_length(p_payload->'variants') = 0 then
    raise exception 'at_least_one_variant_required' using errcode = '22023';
  end if;
  if v_branch_id is null then select id into v_branch_id from public.branch where organization_id = p_organization_id and status = 'active' and is_default; end if;
  if v_branch_id is null or not exists(select 1 from public.branch where id = v_branch_id and organization_id = p_organization_id and status = 'active') then raise exception 'valid_branch_required' using errcode = '22023'; end if;
  if v_price_list_id is null then select id into v_price_list_id from public.price_list where organization_id = p_organization_id and status = 'active' and is_default; end if;
  if v_price_list_id is null or not exists(select 1 from public.price_list where id = v_price_list_id and organization_id = p_organization_id and status = 'active') then raise exception 'active_price_list_required' using errcode = '22023'; end if;
  select code into v_unit_code from public.unit_of_measure where id = v_unit_id and status = 'active' and (organization_id = p_organization_id or organization_id is null);
  if v_unit_code is null then raise exception 'unit_of_measure_not_found' using errcode = 'P0002'; end if;
  if v_category_id is not null then select name into v_category_name from public.category where id = v_category_id and organization_id = p_organization_id and status = 'active'; if v_category_name is null then raise exception 'category_not_found' using errcode = 'P0002'; end if; end if;
  if v_brand_id is not null and not exists(select 1 from public.brand where id = v_brand_id and organization_id = p_organization_id and status = 'active') then raise exception 'brand_not_found' using errcode = 'P0002'; end if;

  select trim(value->>'sku') into v_product_sku from jsonb_array_elements(p_payload->'variants') value limit 1;
  if v_product_sku is null or v_product_sku = '' then raise exception 'variant_sku_required' using errcode = '22023'; end if;
  insert into public.product(id, organization_id, name, description, sku, category, unit, status, brand_id, primary_category_id, lifecycle_status, created_by, updated_by)
  values(v_product_id, p_organization_id, trim(p_payload->>'name'), nullif(trim(p_payload->>'description'), ''), v_product_sku, v_category_name, v_unit_code, 'active', v_brand_id, v_category_id, 'active', v_actor, v_actor);

  for v_variant in select value from jsonb_array_elements(p_payload->'variants') loop
    v_variant_index := v_variant_index + 1;
    v_variant_id := gen_random_uuid(); v_identity := coalesce(nullif(trim(v_variant->>'identityKey'), ''), v_variant_id::text);
    if nullif(trim(v_variant->>'sku'), '') is null then raise exception 'variant_sku_required' using errcode = '22023'; end if;
    v_price := nullif(v_variant->>'salePrice', '')::numeric;
    if v_price is null or v_price < 0 then raise exception 'initial_price_required' using errcode = '22023'; end if;
    select case when count(*) = 0 then 'orchestrated:' || v_identity else 'orchestrated:' || md5(string_agg(trim(value->>'attributeDefinitionId') || ':' || trim(value->>'optionId'), '|' order by trim(value->>'attributeDefinitionId'))) end
      into v_combination_hash
      from jsonb_array_elements(coalesce(v_variant->'attributes', '[]'::jsonb));
    if exists (
      select 1 from jsonb_array_elements(coalesce(v_variant->'attributes', '[]'::jsonb)) assignment(value)
      where nullif(trim(value->>'attributeDefinitionId'), '') is null
         or nullif(trim(value->>'optionId'), '') is null
         or not exists (select 1 from public.attribute_definition d where d.id = (value->>'attributeDefinitionId')::uuid and d.organization_id = p_organization_id and d.status = 'active')
         or not exists (select 1 from public.attribute_option o where o.id = (value->>'optionId')::uuid and o.definition_id = (value->>'attributeDefinitionId')::uuid and o.status = 'active')
    ) then raise exception 'invalid_variant_attribute_assignment' using errcode = '22023'; end if;
    insert into public.product_variant(id, organization_id, product_id, sku, unit_of_measure_id, combination_hash, is_default, tracks_inventory, status, created_by, updated_by)
    values(v_variant_id, p_organization_id, v_product_id, trim(v_variant->>'sku'), v_unit_id, v_combination_hash, coalesce((v_variant->>'isDefault')::boolean, v_variant_index = 1), coalesce((v_variant->>'tracksInventory')::boolean, true), 'active', v_actor, v_actor);
    for v_assignment in select value from jsonb_array_elements(coalesce(v_variant->'attributes', '[]'::jsonb)) loop
      select id into v_axis_id from public.product_variant_axis
        where product_id = v_product_id and attribute_definition_id = (v_assignment->>'attributeDefinitionId')::uuid;
      if v_axis_id is null then
        insert into public.product_variant_axis(organization_id, product_id, attribute_definition_id, sort_order, created_by, updated_by)
        values(p_organization_id, v_product_id, (v_assignment->>'attributeDefinitionId')::uuid, 0, v_actor, v_actor)
        returning id into v_axis_id;
      end if;
      insert into public.product_variant_axis_option(axis_id, option_id)
      values(v_axis_id, (v_assignment->>'optionId')::uuid) on conflict do nothing;
      insert into public.product_variant_attribute_value(organization_id, variant_id, attribute_definition_id, option_id, created_by)
      values(p_organization_id, v_variant_id, (v_assignment->>'attributeDefinitionId')::uuid, (v_assignment->>'optionId')::uuid, v_actor);
    end loop;
    v_barcode := nullif(trim(v_variant #>> '{ean,value}'), ''); v_barcode_type := coalesce(nullif(v_variant #>> '{ean,type}', ''), 'EAN_13');
    if v_barcode is not null then
      insert into public.product_variant_barcode(organization_id, variant_id, barcode_type, barcode, is_primary, created_by, updated_by)
      values(p_organization_id, v_variant_id, v_barcode_type, v_barcode, true, v_actor, v_actor);
    end if;
    v_price_id := gen_random_uuid();
    insert into public.price_list_entry(id, organization_id, price_list_id, variant_id, amount, minimum_amount, currency, valid_from, status, idempotency_key, created_by, updated_by)
    values(v_price_id, p_organization_id, v_price_list_id, v_variant_id, v_price, 0, 'BRL', now(), 'active', 'price:' || p_idempotency_key || ':' || v_identity, v_actor, v_actor);
    insert into public.price_history(organization_id, price_list_id, variant_id, entry_id, amount, currency, effective_at, recorded_by)
    values(p_organization_id, v_price_list_id, v_variant_id, v_price_id, v_price, 'BRL', now(), v_actor);
    perform public.pricing_refresh_projection(v_price_id);
    v_quantity := coalesce(nullif(v_variant->>'initialQuantity', '')::numeric, 0);
    if v_quantity < 0 then raise exception 'initial_quantity_invalid' using errcode = '22023'; end if;
    if v_quantity > 0 then
      v_variant_branch_id := coalesce(nullif(v_variant->>'branchId', '')::uuid, v_branch_id);
      if not exists(select 1 from public.branch where id = v_variant_branch_id and organization_id = p_organization_id and status = 'active') then raise exception 'valid_branch_required' using errcode = '22023'; end if;
      v_location_id := nullif(v_variant->>'locationId', '')::uuid;
      if v_location_id is null then select id into v_location_id from public.stock_location where organization_id = p_organization_id and status = 'active' and is_default; end if;
      if v_location_id is null then raise exception 'valid_stock_location_required' using errcode = '22023'; end if;
      select * into v_ledger from public.register_inventory_ledger_movement(p_organization_id, v_variant_id, v_location_id, 'entry', v_quantity, 'initial_balance', null, now(), 'product_creation', v_product_id, null, 'inventory:' || p_idempotency_key || ':' || v_identity || ':' || v_branch_id::text || ':' || v_location_id::text);
      if v_variant ? 'unitCost' and nullif(v_variant->>'unitCost', '') is not null then
        v_cost := (v_variant->>'unitCost')::numeric;
        if v_cost < 0 or (v_cost = 0 and coalesce((v_variant->>'allowZeroCost')::boolean, false) is false) then raise exception 'initial_unit_cost_invalid' using errcode = '22023'; end if;
        insert into public.initial_inventory_valuation(organization_id, branch_id, location_id, variant_id, inventory_ledger_entry_id, quantity, unit_cost, occurred_at, source_type, source_id, idempotency_key, created_by)
        values(p_organization_id, v_variant_branch_id, v_location_id, v_variant_id, v_ledger.id, v_quantity, v_cost, now(), 'product_creation', v_product_id, 'valuation:' || p_idempotency_key || ':' || v_identity || ':' || v_variant_branch_id::text || ':' || v_location_id::text, v_actor);
      end if;
    end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object('variantId', v_variant_id, 'priceEntryId', v_price_id, 'ledgerEntryId', case when v_quantity > 0 then v_ledger.id else null end));
  end loop;
  v_result := jsonb_build_object('productId', v_product_id, 'branchId', v_branch_id, 'priceListId', v_price_list_id, 'variants', v_results);
  insert into public.product_creation_request(organization_id, idempotency_key, request_payload, result, created_by) values(p_organization_id, p_idempotency_key, p_payload, v_result, v_actor);
  insert into public.audit_event(organization_id, actor_user_id, aggregate_type, aggregate_id, action, after_state)
  values(p_organization_id, v_actor, 'Product', v_product_id, 'ProductCreationCompleted', v_result);
  return v_result;
end;
$$;

revoke all on function public.product_creation_require_permission(uuid) from public;
revoke all on function public.create_product_with_initial_setup(uuid, jsonb, text) from public;
grant execute on function public.create_product_with_initial_setup(uuid, jsonb, text) to authenticated;

comment on table public.initial_inventory_valuation is 'Immutable valuation fact for an initial inventory ledger entry. Corrections require reversal or adjustment.';
comment on function public.create_product_with_initial_setup(uuid, jsonb, text) is 'ProductCreationOrchestrator: one PostgreSQL transaction across Catalog, Pricing, Inventory Ledger and InitialInventoryValuation.';
