-- Pricing Foundation
-- Evolves the ADR-0021 tables without moving price ownership to Product or Variant.

create extension if not exists btree_gist with schema extensions;

alter table public.price_list
  add column if not exists code text,
  add column if not exists valid_from date not null default current_date,
  add column if not exists valid_to date;

update public.price_list
set code = upper(regexp_replace(name, '[^[:alnum:]]+', '_', 'g')) || '_' || left(id::text, 8)
where code is null;

alter table public.price_list
  alter column code set not null,
  alter column code set default ('PL_' || upper(left(gen_random_uuid()::text, 8)));

alter table public.price_list
  drop constraint if exists price_list_code_chk,
  add constraint price_list_code_chk check (
    char_length(trim(code)) between 1 and 40
    and code = upper(code)
  ),
  drop constraint if exists price_list_validity_chk,
  add constraint price_list_validity_chk check (
    valid_to is null or valid_to >= valid_from
  );

create unique index if not exists price_list_org_code_uidx
  on public.price_list (organization_id, code);

alter table public.price_list_entry
  add column if not exists minimum_amount numeric(19, 6) not null default 0,
  add column if not exists status text not null default 'active';

alter table public.price_list_entry
  drop constraint if exists price_list_entry_minimum_amount_chk,
  add constraint price_list_entry_minimum_amount_chk check (
    minimum_amount >= 0 and minimum_amount <= amount
  ),
  drop constraint if exists price_list_entry_status_chk,
  add constraint price_list_entry_status_chk check (
    status in ('active', 'removed')
  );

drop index if exists public.price_list_entry_open_uidx;

alter table public.price_list_entry
  drop constraint if exists price_list_entry_no_overlap;
alter table public.price_list_entry
  add constraint price_list_entry_no_overlap
  exclude using gist (
    organization_id with =,
    price_list_id with =,
    variant_id with =,
    tstzrange(valid_from, coalesce(valid_to, 'infinity'::timestamptz), '[)') with &&
  )
  where (status = 'active');

create index if not exists price_list_entry_org_status_idx
  on public.price_list_entry (organization_id, status, valid_from desc);

create table if not exists public.pricing_search_projection (
  price_list_entry_id uuid primary key references public.price_list_entry (id) on delete cascade,
  organization_id uuid not null references public.organization (id) on delete restrict,
  price_list_id uuid not null references public.price_list (id) on delete cascade,
  price_list_name text not null,
  price_list_code text not null,
  product_id uuid not null references public.product (id) on delete restrict,
  product_name text not null,
  variant_id uuid not null references public.product_variant (id) on delete restrict,
  variant_name text not null,
  sku text,
  amount numeric(19, 6) not null,
  minimum_amount numeric(19, 6) not null,
  currency text not null,
  valid_from timestamptz not null,
  valid_to timestamptz,
  status text not null,
  updated_at timestamptz not null default now()
);

create index if not exists pricing_search_projection_list_idx
  on public.pricing_search_projection (organization_id, price_list_id, status);
create index if not exists pricing_search_projection_variant_idx
  on public.pricing_search_projection (organization_id, variant_id, status);
create index if not exists pricing_search_projection_product_idx
  on public.pricing_search_projection (organization_id, product_id, status);
create index if not exists pricing_search_projection_search_idx
  on public.pricing_search_projection using gin (
    to_tsvector(
      'simple',
      coalesce(product_name, '') || ' ' ||
      coalesce(variant_name, '') || ' ' ||
      coalesce(sku, '') || ' ' ||
      coalesce(price_list_name, '') || ' ' ||
      coalesce(price_list_code, '')
    )
  );

alter table public.pricing_search_projection enable row level security;

create or replace function public.pricing_has_permission(
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
  if auth.uid() is null then return false; end if;
  select role into v_role
  from public.membership
  where organization_id = p_org
    and user_id = auth.uid()
    and status = 'active';

  if v_role is null then return false; end if;
  if v_role in ('owner', 'admin') then return true; end if;
  if p_permission in ('prices.read', 'prices.resolve') then
    return v_role in ('manager', 'seller', 'inventory', 'finance', 'viewer');
  end if;
  if p_permission in ('prices.create', 'prices.edit', 'prices.archive', 'prices.restore', 'prices.activate') then
    return v_role = 'manager';
  end if;
  return false;
end;
$$;

create or replace function public.pricing_require_permission(p_org uuid, p_permission text)
returns void
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.pricing_has_permission(p_org, p_permission) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.pricing_refresh_projection(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pricing_search_projection (
    price_list_entry_id, organization_id, price_list_id, price_list_name,
    price_list_code, product_id, product_name, variant_id, variant_name, sku,
    amount, minimum_amount, currency, valid_from, valid_to, status, updated_at
  )
  select
    e.id, e.organization_id, e.price_list_id, l.name, l.code,
    p.id, p.name, v.id,
    case when v.is_default then p.name else p.name || ' · ' || coalesce(v.sku, left(v.id::text, 8)) end,
    v.sku, e.amount, e.minimum_amount, e.currency, e.valid_from, e.valid_to,
    e.status, now()
  from public.price_list_entry e
  join public.price_list l on l.id = e.price_list_id and l.organization_id = e.organization_id
  join public.product_variant v on v.id = e.variant_id and v.organization_id = e.organization_id
  join public.product p on p.id = v.product_id and p.organization_id = e.organization_id
  where e.id = p_entry_id
  on conflict (price_list_entry_id) do update set
    price_list_name = excluded.price_list_name,
    price_list_code = excluded.price_list_code,
    product_name = excluded.product_name,
    variant_name = excluded.variant_name,
    sku = excluded.sku,
    amount = excluded.amount,
    minimum_amount = excluded.minimum_amount,
    currency = excluded.currency,
    valid_from = excluded.valid_from,
    valid_to = excluded.valid_to,
    status = excluded.status,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function public.pricing_record_audit(
  p_org uuid, p_actor uuid, p_type text, p_id uuid, p_action text,
  p_before jsonb default null, p_after jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_event (
    organization_id, actor_user_id, aggregate_type, aggregate_id,
    action, before_state, after_state
  ) values (p_org, p_actor, p_type, p_id, p_action, p_before, p_after);
end;
$$;

create or replace function public.create_price_list(
  p_organization_id uuid,
  p_name text,
  p_code text,
  p_currency text,
  p_valid_from date,
  p_valid_to date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
  v_actor uuid := auth.uid();
begin
  perform public.pricing_require_permission(p_organization_id, 'prices.create');
  if v_actor is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  insert into public.price_list (
    id, organization_id, name, code, currency, valid_from, valid_to,
    is_default, priority, status, created_by, updated_by
  ) values (
    v_id, p_organization_id, trim(p_name), upper(trim(p_code)), p_currency,
    p_valid_from, p_valid_to, false, 0, 'active', v_actor, v_actor
  );
  perform public.pricing_record_audit(
    p_organization_id, v_actor, 'PriceList', v_id, 'PriceListCreated',
    null, jsonb_build_object('name', trim(p_name), 'code', upper(trim(p_code)))
  );
  return v_id;
end;
$$;

create or replace function public.update_price_list(
  p_organization_id uuid,
  p_price_list_id uuid,
  p_name text,
  p_code text,
  p_valid_from date,
  p_valid_to date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
  v_after jsonb;
begin
  perform public.pricing_require_permission(p_organization_id, 'prices.edit');
  select to_jsonb(l) into v_before from public.price_list l
  where l.id = p_price_list_id and l.organization_id = p_organization_id for update;
  if v_before is null then raise exception 'price_list_not_found' using errcode = 'P0002'; end if;
  update public.price_list
  set name = trim(p_name), code = upper(trim(p_code)), valid_from = p_valid_from,
      valid_to = p_valid_to, updated_by = v_actor
  where id = p_price_list_id and organization_id = p_organization_id;
  select to_jsonb(l) into v_after from public.price_list l where l.id = p_price_list_id;
  update public.pricing_search_projection
  set price_list_name = trim(p_name), price_list_code = upper(trim(p_code)), updated_at = now()
  where organization_id = p_organization_id and price_list_id = p_price_list_id;
  perform public.pricing_record_audit(
    p_organization_id, v_actor, 'PriceList', p_price_list_id,
    'PriceListUpdated', v_before, v_after
  );
end;
$$;

create or replace function public.archive_price_list(
  p_organization_id uuid,
  p_price_list_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
begin
  perform public.pricing_require_permission(p_organization_id, 'prices.archive');
  select to_jsonb(l) into v_before from public.price_list l
  where l.id = p_price_list_id and l.organization_id = p_organization_id for update;
  if v_before is null then raise exception 'price_list_not_found' using errcode = 'P0002'; end if;
  update public.price_list
  set status = 'archived', archived_at = now(), archived_by = v_actor, updated_by = v_actor
  where id = p_price_list_id and organization_id = p_organization_id;
  perform public.pricing_record_audit(
    p_organization_id, v_actor, 'PriceList', p_price_list_id,
    'PriceListArchived', v_before, null
  );
end;
$$;

create or replace function public.create_price_list_item(
  p_organization_id uuid,
  p_price_list_id uuid,
  p_variant_id uuid,
  p_amount numeric,
  p_minimum_amount numeric,
  p_valid_from timestamptz,
  p_valid_to timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
  v_actor uuid := auth.uid();
  v_currency text;
begin
  perform public.pricing_require_permission(p_organization_id, 'prices.edit');
  select currency into v_currency from public.price_list
  where id = p_price_list_id and organization_id = p_organization_id
    and status = 'active'
  for update;
  if v_currency is null then raise exception 'price_list_not_found_or_archived' using errcode = 'P0002'; end if;
  if not exists (
    select 1 from public.product_variant
    where id = p_variant_id and organization_id = p_organization_id
      and status <> 'archived'
  ) then raise exception 'variant_not_found' using errcode = 'P0002'; end if;

  insert into public.price_list_entry (
    id, organization_id, price_list_id, variant_id, amount, minimum_amount,
    currency, valid_from, valid_to, status, created_by, updated_by
  ) values (
    v_id, p_organization_id, p_price_list_id, p_variant_id, p_amount,
    p_minimum_amount, v_currency, p_valid_from, p_valid_to, 'active',
    v_actor, v_actor
  );
  insert into public.price_history (
    organization_id, price_list_id, variant_id, entry_id, amount, currency,
    effective_at, recorded_by
  ) values (
    p_organization_id, p_price_list_id, p_variant_id, v_id, p_amount,
    v_currency, p_valid_from, v_actor
  );
  perform public.pricing_refresh_projection(v_id);
  perform public.pricing_record_audit(
    p_organization_id, v_actor, 'PriceListItem', v_id, 'PriceListItemCreated',
    null, jsonb_build_object('priceListId', p_price_list_id, 'variantId', p_variant_id, 'amount', p_amount)
  );
  return v_id;
end;
$$;

create or replace function public.update_price_list_item(
  p_organization_id uuid,
  p_item_id uuid,
  p_amount numeric,
  p_minimum_amount numeric,
  p_valid_from timestamptz,
  p_valid_to timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
  v_entry public.price_list_entry%rowtype;
begin
  perform public.pricing_require_permission(p_organization_id, 'prices.edit');
  select to_jsonb(e) into v_before from public.price_list_entry e
  where e.id = p_item_id and e.organization_id = p_organization_id for update;
  if v_before is null then raise exception 'price_list_item_not_found' using errcode = 'P0002'; end if;
  update public.price_list_entry
  set amount = p_amount, minimum_amount = p_minimum_amount,
      valid_from = p_valid_from, valid_to = p_valid_to, updated_by = v_actor
  where id = p_item_id and organization_id = p_organization_id
  returning * into v_entry;
  insert into public.price_history (
    organization_id, price_list_id, variant_id, entry_id, amount, currency,
    effective_at, recorded_by
  ) values (
    p_organization_id, v_entry.price_list_id, v_entry.variant_id, v_entry.id,
    v_entry.amount, v_entry.currency, v_entry.valid_from, v_actor
  );
  perform public.pricing_refresh_projection(p_item_id);
  perform public.pricing_record_audit(
    p_organization_id, v_actor, 'PriceListItem', p_item_id,
    'PriceListItemUpdated', v_before, to_jsonb(v_entry)
  );
end;
$$;

create or replace function public.remove_price_list_item(
  p_organization_id uuid,
  p_item_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
begin
  perform public.pricing_require_permission(p_organization_id, 'prices.edit');
  select to_jsonb(e) into v_before from public.price_list_entry e
  where e.id = p_item_id and e.organization_id = p_organization_id for update;
  if v_before is null then raise exception 'price_list_item_not_found' using errcode = 'P0002'; end if;
  update public.price_list_entry
  set status = 'removed', updated_by = v_actor
  where id = p_item_id and organization_id = p_organization_id;
  perform public.pricing_refresh_projection(p_item_id);
  perform public.pricing_record_audit(
    p_organization_id, v_actor, 'PriceListItem', p_item_id,
    'PriceListItemRemoved', v_before, null
  );
end;
$$;

create or replace function public.resolve_price(
  p_organization_id uuid,
  p_price_list_id uuid,
  p_variant_id uuid,
  p_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_result jsonb;
begin
  perform public.pricing_require_permission(p_organization_id, 'prices.resolve');
  select jsonb_build_object(
    'priceListId', l.id, 'priceListName', l.name, 'priceListCode', l.code,
    'itemId', e.id, 'variantId', e.variant_id, 'amount', e.amount::text,
    'minimumAmount', e.minimum_amount::text, 'currency', e.currency,
    'validFrom', e.valid_from, 'validTo', e.valid_to
  ) into v_result
  from public.price_list l
  join public.price_list_entry e on e.price_list_id = l.id
    and e.organization_id = l.organization_id
  where l.organization_id = p_organization_id
    and l.id = p_price_list_id
    and l.status = 'active'
    and l.valid_from <= p_at::date
    and (l.valid_to is null or l.valid_to >= p_at::date)
    and e.variant_id = p_variant_id
    and e.status = 'active'
    and e.valid_from <= p_at
    and (e.valid_to is null or e.valid_to > p_at)
  order by e.valid_from desc
  limit 1;
  return v_result;
end;
$$;

create or replace function public.list_price_lists(
  p_organization_id uuid,
  p_search text default null,
  p_status text default null,
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_offset integer := greatest(p_page - 1, 0) * least(greatest(p_page_size, 1), 100);
  v_limit integer := least(greatest(p_page_size, 1), 100);
begin
  perform public.pricing_require_permission(p_organization_id, 'prices.read');
  return jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.name)
      from (
        select l.id, l.name, l.code, l.status, l.currency,
          l.valid_from as "validFrom", l.valid_to as "validTo",
          l.updated_at as "updatedAt",
          count(e.id)::integer as "itemCount"
        from public.price_list l
        left join public.price_list_entry e
          on e.price_list_id = l.id and e.status = 'active'
        where l.organization_id = p_organization_id
          and (p_status is null or l.status = p_status)
          and (
            p_search is null
            or l.name ilike '%' || p_search || '%'
            or l.code ilike '%' || p_search || '%'
          )
        group by l.id
        order by l.name
        limit v_limit offset v_offset
      ) x
    ), '[]'::jsonb),
    'total', (
      select count(*) from public.price_list l
      where l.organization_id = p_organization_id
        and (p_status is null or l.status = p_status)
        and (
          p_search is null
          or l.name ilike '%' || p_search || '%'
          or l.code ilike '%' || p_search || '%'
        )
    ),
    'page', greatest(p_page, 1),
    'pageSize', v_limit
  );
end;
$$;

create or replace function public.list_price_list_items(
  p_organization_id uuid,
  p_search text default null,
  p_status text default null,
  p_price_list_id uuid default null,
  p_product_id uuid default null,
  p_variant_id uuid default null,
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_offset integer := greatest(p_page - 1, 0) * least(greatest(p_page_size, 1), 100);
  v_limit integer := least(greatest(p_page_size, 1), 100);
begin
  perform public.pricing_require_permission(p_organization_id, 'prices.read');
  return jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(to_jsonb(x) order by x."productName", x."variantName")
      from (
        select s.price_list_entry_id as id, s.price_list_id as "priceListId",
          s.price_list_name as "priceListName", s.price_list_code as "priceListCode",
          s.product_id as "productId", s.product_name as "productName",
          s.variant_id as "variantId", s.variant_name as "variantName", s.sku,
          s.amount::text, s.minimum_amount::text as "minimumAmount", s.currency,
          s.valid_from as "validFrom", s.valid_to as "validTo", s.status
        from public.pricing_search_projection s
        where s.organization_id = p_organization_id
          and (p_status is null or s.status = p_status)
          and (p_price_list_id is null or s.price_list_id = p_price_list_id)
          and (p_product_id is null or s.product_id = p_product_id)
          and (p_variant_id is null or s.variant_id = p_variant_id)
          and (
            p_search is null
            or to_tsvector(
              'simple',
              coalesce(s.product_name, '') || ' ' || coalesce(s.variant_name, '') ||
              ' ' || coalesce(s.sku, '') || ' ' || coalesce(s.price_list_name, '') ||
              ' ' || coalesce(s.price_list_code, '')
            ) @@ plainto_tsquery('simple', p_search)
          )
        order by s.product_name, s.variant_name
        limit v_limit offset v_offset
      ) x
    ), '[]'::jsonb),
    'total', (
      select count(*) from public.pricing_search_projection s
      where s.organization_id = p_organization_id
        and (p_status is null or s.status = p_status)
        and (p_price_list_id is null or s.price_list_id = p_price_list_id)
        and (p_product_id is null or s.product_id = p_product_id)
        and (p_variant_id is null or s.variant_id = p_variant_id)
        and (
          p_search is null
          or to_tsvector(
            'simple',
            coalesce(s.product_name, '') || ' ' || coalesce(s.variant_name, '') ||
            ' ' || coalesce(s.sku, '') || ' ' || coalesce(s.price_list_name, '') ||
            ' ' || coalesce(s.price_list_code, '')
          ) @@ plainto_tsquery('simple', p_search)
        )
    ),
    'page', greatest(p_page, 1),
    'pageSize', v_limit
  );
end;
$$;

create or replace function public.search_pricing_variants(
  p_organization_id uuid,
  p_search text,
  p_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  perform public.pricing_require_permission(p_organization_id, 'prices.read');
  return coalesce((
    select jsonb_agg(to_jsonb(x) order by x."productName", x.sku)
    from (
      select v.id, v.product_id as "productId", p.name as "productName",
        case when v.is_default then p.name else p.name || ' · ' || coalesce(v.sku, left(v.id::text, 8)) end as name,
        v.sku
      from public.product_variant v
      join public.product p on p.id = v.product_id
      where v.organization_id = p_organization_id
        and v.status <> 'archived'
        and (
          p_search = ''
          or p.name ilike '%' || p_search || '%'
          or v.sku ilike '%' || p_search || '%'
        )
      order by p.name, v.sku
      limit least(greatest(p_limit, 1), 50)
    ) x
  ), '[]'::jsonb);
end;
$$;

drop policy if exists pricing_projection_read on public.pricing_search_projection;
create policy pricing_projection_read
  on public.pricing_search_projection for select to authenticated
  using (public.pricing_has_permission(organization_id, 'prices.read'));

drop policy if exists price_list_insert_member on public.price_list;
drop policy if exists price_list_update_member on public.price_list;
drop policy if exists price_list_entry_insert_member on public.price_list_entry;
drop policy if exists price_list_entry_update_member on public.price_list_entry;
drop policy if exists price_history_insert_member on public.price_history;

revoke insert, update, delete on public.price_list from authenticated;
revoke insert, update, delete on public.price_list_entry from authenticated;
revoke insert, update, delete on public.price_history from authenticated;
revoke all on public.pricing_search_projection from public, anon, authenticated;
grant select on public.pricing_search_projection to authenticated;

revoke all on function public.pricing_require_permission(uuid, text) from public;
revoke all on function public.pricing_refresh_projection(uuid) from public;
revoke all on function public.pricing_record_audit(uuid, uuid, text, uuid, text, jsonb, jsonb) from public;
revoke all on function public.create_price_list(uuid, text, text, text, date, date) from public;
revoke all on function public.update_price_list(uuid, uuid, text, text, date, date) from public;
revoke all on function public.archive_price_list(uuid, uuid) from public;
revoke all on function public.create_price_list_item(uuid, uuid, uuid, numeric, numeric, timestamptz, timestamptz) from public;
revoke all on function public.update_price_list_item(uuid, uuid, numeric, numeric, timestamptz, timestamptz) from public;
revoke all on function public.remove_price_list_item(uuid, uuid) from public;
revoke all on function public.resolve_price(uuid, uuid, uuid, timestamptz) from public;
revoke all on function public.list_price_lists(uuid, text, text, integer, integer) from public;
revoke all on function public.list_price_list_items(uuid, text, text, uuid, uuid, uuid, integer, integer) from public;
revoke all on function public.search_pricing_variants(uuid, text, integer) from public;
grant execute on function public.pricing_has_permission(uuid, text) to authenticated;
grant execute on function public.create_price_list(uuid, text, text, text, date, date) to authenticated;
grant execute on function public.update_price_list(uuid, uuid, text, text, date, date) to authenticated;
grant execute on function public.archive_price_list(uuid, uuid) to authenticated;
grant execute on function public.create_price_list_item(uuid, uuid, uuid, numeric, numeric, timestamptz, timestamptz) to authenticated;
grant execute on function public.update_price_list_item(uuid, uuid, numeric, numeric, timestamptz, timestamptz) to authenticated;
grant execute on function public.remove_price_list_item(uuid, uuid) to authenticated;
grant execute on function public.resolve_price(uuid, uuid, uuid, timestamptz) to authenticated;
grant execute on function public.list_price_lists(uuid, text, text, integer, integer) to authenticated;
grant execute on function public.list_price_list_items(uuid, text, text, uuid, uuid, uuid, integer, integer) to authenticated;
grant execute on function public.search_pricing_variants(uuid, text, integer) to authenticated;

insert into public.pricing_search_projection (
  price_list_entry_id, organization_id, price_list_id, price_list_name,
  price_list_code, product_id, product_name, variant_id, variant_name, sku,
  amount, minimum_amount, currency, valid_from, valid_to, status, updated_at
)
select
  e.id, e.organization_id, e.price_list_id, l.name, l.code,
  p.id, p.name, v.id,
  case when v.is_default then p.name else p.name || ' · ' || coalesce(v.sku, left(v.id::text, 8)) end,
  v.sku, e.amount, e.minimum_amount, e.currency, e.valid_from, e.valid_to,
  e.status, now()
from public.price_list_entry e
join public.price_list l on l.id = e.price_list_id
join public.product_variant v on v.id = e.variant_id
join public.product p on p.id = v.product_id
on conflict (price_list_entry_id) do nothing;

comment on table public.pricing_search_projection is
  'Read-only Pricing projection for server-side search, filtering and pagination.';
comment on function public.resolve_price(uuid, uuid, uuid, timestamptz) is
  'Canonical explicit Price List resolution service. No customer/channel/promotion fallback.';
