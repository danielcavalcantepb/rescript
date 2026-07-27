-- Catalog Domain Foundation
-- Consolidates taxonomy metadata, same-tenant integrity, append-only history,
-- and the structured operational projection defined by ADR-0020..0025.
-- Explicitly excludes Pricing orchestration, Inventory, Supplier, Files and analytics.

-- ---------------------------------------------------------------------------
-- Taxonomy metadata (compatible expansion)
-- ---------------------------------------------------------------------------

alter table public.brand
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists sort_order integer not null default 0;

update public.brand
set slug = trim(both '-' from regexp_replace(lower(normalized_name), '[^a-z0-9]+', '-', 'g'))
where slug is null;

alter table public.brand
  alter column slug set not null,
  add constraint brand_slug_length_chk
    check (char_length(slug) between 1 and 120),
  add constraint brand_description_length_chk
    check (description is null or char_length(description) <= 2000),
  add constraint brand_sort_order_chk check (sort_order >= 0);

create unique index brand_org_slug_uidx
  on public.brand (organization_id, slug);

create index brand_org_sort_idx
  on public.brand (organization_id, sort_order, name);

alter table public.category
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists sort_order integer not null default 0;

update public.category
set slug = trim(both '-' from regexp_replace(lower(normalized_name), '[^a-z0-9]+', '-', 'g'))
where slug is null;

alter table public.category
  alter column slug set not null,
  add constraint category_slug_length_chk
    check (char_length(slug) between 1 and 120),
  add constraint category_description_length_chk
    check (description is null or char_length(description) <= 2000),
  add constraint category_sort_order_chk check (sort_order >= 0);

create unique index category_org_root_slug_uidx
  on public.category (organization_id, slug)
  where parent_id is null;

create unique index category_org_sibling_slug_uidx
  on public.category (organization_id, parent_id, slug)
  where parent_id is not null;

create index category_org_parent_sort_idx
  on public.category (organization_id, parent_id, sort_order, name);

alter table public.attribute_definition
  add column if not exists is_variant_axis boolean not null default false,
  add column if not exists is_filterable boolean not null default true,
  add column if not exists sort_order integer not null default 0;

alter table public.attribute_definition
  add constraint attribute_definition_sort_order_chk check (sort_order >= 0),
  add constraint attribute_definition_axis_type_chk
    check (is_variant_axis = false or value_type = 'option');

create index attribute_definition_org_sort_idx
  on public.attribute_definition (organization_id, sort_order, name);

-- ---------------------------------------------------------------------------
-- Database-level same-tenant and relationship integrity
-- ---------------------------------------------------------------------------

create unique index organization_id_id_uidx
  on public.organization (id, id);

create unique index product_org_id_uidx
  on public.product (organization_id, id);

create unique index brand_org_id_uidx
  on public.brand (organization_id, id);

create unique index category_org_id_uidx
  on public.category (organization_id, id);

create unique index attribute_definition_org_id_uidx
  on public.attribute_definition (organization_id, id);

create unique index product_variant_org_id_uidx
  on public.product_variant (organization_id, id);

create unique index attribute_option_definition_id_uidx
  on public.attribute_option (definition_id, id);

alter table public.product
  add constraint product_brand_same_org_fk
    foreign key (organization_id, brand_id)
    references public.brand (organization_id, id)
    on delete restrict,
  add constraint product_category_same_org_fk
    foreign key (organization_id, primary_category_id)
    references public.category (organization_id, id)
    on delete restrict;

create or replace function public.catalog_assert_variant_product_tenant()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.product p
    where p.id = new.product_id
      and p.organization_id = new.organization_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'variant_product_tenant_mismatch';
  end if;
  return new;
end;
$$;

create trigger product_variant_product_tenant_guard
before insert or update of organization_id, product_id
on public.product_variant
for each row execute function public.catalog_assert_variant_product_tenant();

alter table public.product_variant_axis
  add constraint product_variant_axis_product_same_org_fk
    foreign key (organization_id, product_id)
    references public.product (organization_id, id)
    on delete restrict,
  add constraint product_variant_axis_definition_same_org_fk
    foreign key (organization_id, attribute_definition_id)
    references public.attribute_definition (organization_id, id)
    on delete restrict;

alter table public.product_variant_attribute_value
  add column if not exists organization_id uuid,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users (id);

update public.product_variant_attribute_value av
set organization_id = v.organization_id
from public.product_variant v
where v.id = av.variant_id
  and av.organization_id is null;

alter table public.product_variant_attribute_value
  alter column organization_id set not null,
  add constraint variant_attribute_variant_same_org_fk
    foreign key (organization_id, variant_id)
    references public.product_variant (organization_id, id)
    on delete cascade,
  add constraint variant_attribute_definition_same_org_fk
    foreign key (organization_id, attribute_definition_id)
    references public.attribute_definition (organization_id, id)
    on delete restrict,
  add constraint variant_attribute_option_matches_definition_fk
    foreign key (attribute_definition_id, option_id)
    references public.attribute_option (definition_id, id)
    on delete restrict;

create index variant_attribute_org_option_idx
  on public.product_variant_attribute_value
    (organization_id, attribute_definition_id, option_id);

create or replace function public.catalog_validate_category_tree()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_parent_org uuid;
  v_parent_depth integer;
  v_has_cycle boolean;
  v_max_relative_depth integer;
begin
  if new.parent_id is null then
    new.depth := 0;
    return new;
  end if;

  select organization_id, depth
    into v_parent_org, v_parent_depth
  from public.category
  where id = new.parent_id;

  if v_parent_org is null or v_parent_org <> new.organization_id then
    raise exception using errcode = '23514', message = 'category_parent_tenant_mismatch';
  end if;

  with recursive descendants as (
    select id from public.category where id = new.id
    union all
    select c.id
    from public.category c
    join descendants d on c.parent_id = d.id
  )
  select exists(select 1 from descendants where id = new.parent_id)
    into v_has_cycle;

  if v_has_cycle then
    raise exception using errcode = '23514', message = 'category_cycle';
  end if;

  new.depth := v_parent_depth + 1;

  with recursive descendants as (
    select id, 0 as relative_depth
    from public.category
    where id = new.id
    union all
    select c.id, d.relative_depth + 1
    from public.category c
    join descendants d on c.parent_id = d.id
  )
  select coalesce(max(relative_depth), 0)
    into v_max_relative_depth
  from descendants;

  if new.depth + v_max_relative_depth > 5 then
    raise exception using errcode = '23514', message = 'category_depth_exceeded';
  end if;

  return new;
end;
$$;

create trigger category_validate_tree
  before insert or update of parent_id, organization_id on public.category
  for each row execute function public.catalog_validate_category_tree();

create or replace function public.catalog_redepth_category_descendants()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.depth = new.depth then
    return null;
  end if;

  with recursive descendants as (
    select c.id, 1 as relative_depth
    from public.category c
    where c.parent_id = new.id
    union all
    select c.id, d.relative_depth + 1
    from public.category c
    join descendants d on c.parent_id = d.id
  )
  update public.category c
  set depth = new.depth + d.relative_depth
  from descendants d
  where c.id = d.id;

  return null;
end;
$$;

create trigger category_redepth_descendants
  after update of parent_id on public.category
  for each row execute function public.catalog_redepth_category_descendants();

-- ---------------------------------------------------------------------------
-- Append-only Catalog history (module-local audit/history mechanism)
-- ---------------------------------------------------------------------------

create table public.catalog_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete cascade,
  entity_type text not null check (
    entity_type in ('brand', 'category', 'attribute', 'attribute_value', 'variant_attribute')
  ),
  entity_id uuid not null,
  event_type text not null check (
    event_type in (
      'BrandCreated', 'BrandUpdated', 'BrandArchived',
      'CategoryCreated', 'CategoryUpdated', 'CategoryArchived',
      'AttributeCreated', 'AttributeUpdated', 'AttributeArchived',
      'AttributeValueCreated', 'AttributeValueUpdated', 'AttributeValueArchived',
      'VariantAttributeAssigned', 'VariantAttributeRemoved'
    )
  ),
  actor_user_id uuid not null references auth.users (id),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index catalog_history_org_entity_idx
  on public.catalog_history (organization_id, entity_type, entity_id, occurred_at desc);

create index catalog_history_org_event_idx
  on public.catalog_history (organization_id, event_type, occurred_at desc);

alter table public.catalog_history enable row level security;

create policy catalog_history_select_member
  on public.catalog_history
  for select
  to authenticated
  using (public.is_org_member(organization_id));

grant select on public.catalog_history to authenticated;

create or replace function public.catalog_history_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception using errcode = '55000', message = 'catalog_history_is_append_only';
end;
$$;

create trigger catalog_history_no_update
  before update on public.catalog_history
  for each row execute function public.catalog_history_immutable();

create or replace function public.catalog_record_taxonomy_history()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_org uuid;
  v_entity text;
  v_event text;
  v_entity_id uuid;
  v_actor uuid;
begin
  v_entity := case tg_table_name
    when 'brand' then 'brand'
    when 'category' then 'category'
    when 'attribute_definition' then 'attribute'
    when 'attribute_option' then 'attribute_value'
  end;

  if tg_table_name = 'attribute_option' then
    select d.organization_id into v_org
    from public.attribute_definition d
    where d.id = coalesce(new.definition_id, old.definition_id);
  else
    v_org := coalesce(new.organization_id, old.organization_id);
  end if;

  v_entity_id := coalesce(new.id, old.id);
  v_actor := coalesce(new.updated_by, new.created_by, old.updated_by, old.created_by, auth.uid());
  if v_actor is null then
    raise exception using errcode = '23502', message = 'catalog_history_actor_required';
  end if;

  if tg_op = 'INSERT' then
    v_event := case v_entity
      when 'brand' then 'BrandCreated'
      when 'category' then 'CategoryCreated'
      when 'attribute' then 'AttributeCreated'
      when 'attribute_value' then 'AttributeValueCreated'
    end;
  elsif new.status = 'archived' and old.status <> 'archived' then
    v_event := case v_entity
      when 'brand' then 'BrandArchived'
      when 'category' then 'CategoryArchived'
      when 'attribute' then 'AttributeArchived'
      when 'attribute_value' then 'AttributeValueArchived'
    end;
  else
    v_event := case v_entity
      when 'brand' then 'BrandUpdated'
      when 'category' then 'CategoryUpdated'
      when 'attribute' then 'AttributeUpdated'
      when 'attribute_value' then 'AttributeValueUpdated'
    end;
  end if;

  insert into public.catalog_history (
    organization_id, entity_type, entity_id, event_type, actor_user_id, payload
  ) values (
    v_org,
    v_entity,
    v_entity_id,
    v_event,
    v_actor,
    jsonb_build_object('operation', tg_op)
  );

  return coalesce(new, old);
end;
$$;

create trigger brand_catalog_history
  after insert or update on public.brand
  for each row execute function public.catalog_record_taxonomy_history();

create trigger category_catalog_history
  after insert or update on public.category
  for each row execute function public.catalog_record_taxonomy_history();

create trigger attribute_definition_catalog_history
  after insert or update on public.attribute_definition
  for each row execute function public.catalog_record_taxonomy_history();

create trigger attribute_option_catalog_history
  after insert or update on public.attribute_option
  for each row execute function public.catalog_record_taxonomy_history();

create or replace function public.catalog_record_variant_attribute_history()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_row public.product_variant_attribute_value;
  v_actor uuid;
begin
  v_row := coalesce(new, old);
  v_actor := coalesce(v_row.created_by, auth.uid());
  if v_actor is null then
    raise exception using errcode = '23502', message = 'catalog_history_actor_required';
  end if;

  insert into public.catalog_history (
    organization_id, entity_type, entity_id, event_type, actor_user_id, payload
  ) values (
    v_row.organization_id,
    'variant_attribute',
    v_row.variant_id,
    case when tg_op = 'DELETE'
      then 'VariantAttributeRemoved'
      else 'VariantAttributeAssigned'
    end,
    v_actor,
    jsonb_build_object(
      'attribute_id', v_row.attribute_definition_id,
      'attribute_value_id', v_row.option_id
    )
  );

  return coalesce(new, old);
end;
$$;

create trigger variant_attribute_catalog_history
  after insert or delete on public.product_variant_attribute_value
  for each row execute function public.catalog_record_variant_attribute_history();

-- ---------------------------------------------------------------------------
-- Structured operational projection (ADR-0024)
-- ---------------------------------------------------------------------------

create table public.catalog_search_projection (
  variant_id uuid primary key references public.product_variant (id) on delete cascade,
  organization_id uuid not null references public.organization (id) on delete restrict,
  product_id uuid not null references public.product (id) on delete cascade,
  product_name text not null,
  variant_name text not null,
  sku text,
  barcodes text[] not null default '{}',
  category_id uuid,
  category_name text,
  brand_id uuid,
  brand_name text,
  attributes jsonb not null default '[]'::jsonb,
  product_status text not null,
  variant_status text not null,
  search_text text not null,
  updated_at timestamptz not null default now()
);

create index catalog_search_projection_org_product_idx
  on public.catalog_search_projection (organization_id, product_id);

create index catalog_search_projection_org_category_idx
  on public.catalog_search_projection (organization_id, category_id);

create index catalog_search_projection_org_brand_idx
  on public.catalog_search_projection (organization_id, brand_id);

create index catalog_search_projection_org_status_idx
  on public.catalog_search_projection (organization_id, product_status, variant_status);

create index catalog_search_projection_attributes_gin_idx
  on public.catalog_search_projection using gin (attributes jsonb_path_ops);

create index catalog_search_projection_fts_idx
  on public.catalog_search_projection
  using gin (to_tsvector('simple', search_text));

alter table public.catalog_search_projection enable row level security;

create policy catalog_search_projection_select_member
  on public.catalog_search_projection
  for select
  to authenticated
  using (public.is_org_member(organization_id));

grant select on public.catalog_search_projection to authenticated;

create or replace function public.catalog_refresh_search_variant(p_variant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.catalog_search_projection where variant_id = p_variant_id;

  insert into public.catalog_search_projection (
    variant_id,
    organization_id,
    product_id,
    product_name,
    variant_name,
    sku,
    barcodes,
    category_id,
    category_name,
    brand_id,
    brand_name,
    attributes,
    product_status,
    variant_status,
    search_text,
    updated_at
  )
  select
    v.id,
    v.organization_id,
    p.id,
    p.name,
    coalesce(nullif(string_agg(distinct ao.label, ' / ' order by ao.label), ''), p.name),
    v.sku,
    coalesce(array_agg(distinct bc.barcode) filter (where bc.barcode is not null), '{}'),
    c.id,
    c.name,
    b.id,
    b.name,
    coalesce(
      jsonb_agg(
        distinct jsonb_build_object(
          'attribute_id', ad.id,
          'attribute_name', ad.name,
          'attribute_value_id', ao.id,
          'attribute_value', ao.label
        )
      ) filter (where ad.id is not null),
      '[]'::jsonb
    ),
    coalesce(p.lifecycle_status, p.status),
    v.status,
    concat_ws(
      ' ',
      p.name,
      v.sku,
      b.name,
      c.name,
      string_agg(distinct bc.barcode, ' '),
      string_agg(distinct ad.name, ' '),
      string_agg(distinct ao.label, ' ')
    ),
    now()
  from public.product_variant v
  join public.product p
    on p.id = v.product_id
   and p.organization_id = v.organization_id
  left join public.brand b
    on b.id = p.brand_id
   and b.organization_id = p.organization_id
  left join public.category c
    on c.id = p.primary_category_id
   and c.organization_id = p.organization_id
  left join public.product_variant_barcode bc
    on bc.variant_id = v.id
   and bc.organization_id = v.organization_id
  left join public.product_variant_attribute_value av
    on av.variant_id = v.id
   and av.organization_id = v.organization_id
  left join public.attribute_definition ad
    on ad.id = av.attribute_definition_id
   and ad.organization_id = v.organization_id
  left join public.attribute_option ao
    on ao.id = av.option_id
   and ao.definition_id = av.attribute_definition_id
  where v.id = p_variant_id
  group by v.id, p.id, c.id, b.id;
end;
$$;

create or replace function public.catalog_refresh_search_from_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant_id uuid;
  v_product_id uuid;
begin
  if tg_table_name = 'product_variant' then
    perform public.catalog_refresh_search_variant(coalesce(new.id, old.id));
  elsif tg_table_name = 'product_variant_barcode'
     or tg_table_name = 'product_variant_attribute_value' then
    perform public.catalog_refresh_search_variant(coalesce(new.variant_id, old.variant_id));
  elsif tg_table_name = 'product' then
    for v_variant_id in
      select id from public.product_variant where product_id = coalesce(new.id, old.id)
    loop
      perform public.catalog_refresh_search_variant(v_variant_id);
    end loop;
  elsif tg_table_name = 'brand' then
    for v_variant_id in
      select v.id
      from public.product_variant v
      join public.product p on p.id = v.product_id
      where p.brand_id = coalesce(new.id, old.id)
    loop
      perform public.catalog_refresh_search_variant(v_variant_id);
    end loop;
  elsif tg_table_name = 'category' then
    for v_variant_id in
      select v.id
      from public.product_variant v
      join public.product p on p.id = v.product_id
      where p.primary_category_id = coalesce(new.id, old.id)
    loop
      perform public.catalog_refresh_search_variant(v_variant_id);
    end loop;
  elsif tg_table_name = 'attribute_definition' then
    for v_variant_id in
      select distinct av.variant_id
      from public.product_variant_attribute_value av
      where av.attribute_definition_id = coalesce(new.id, old.id)
    loop
      perform public.catalog_refresh_search_variant(v_variant_id);
    end loop;
  elsif tg_table_name = 'attribute_option' then
    for v_variant_id in
      select distinct av.variant_id
      from public.product_variant_attribute_value av
      where av.option_id = coalesce(new.id, old.id)
    loop
      perform public.catalog_refresh_search_variant(v_variant_id);
    end loop;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger catalog_search_product
  after insert or update on public.product
  for each row execute function public.catalog_refresh_search_from_row();

create trigger catalog_search_variant
  after insert or update or delete on public.product_variant
  for each row execute function public.catalog_refresh_search_from_row();

create trigger catalog_search_barcode
  after insert or update or delete on public.product_variant_barcode
  for each row execute function public.catalog_refresh_search_from_row();

create trigger catalog_search_assignment
  after insert or update or delete on public.product_variant_attribute_value
  for each row execute function public.catalog_refresh_search_from_row();

create trigger catalog_search_brand
  after update on public.brand
  for each row execute function public.catalog_refresh_search_from_row();

create trigger catalog_search_category
  after update on public.category
  for each row execute function public.catalog_refresh_search_from_row();

create trigger catalog_search_attribute
  after update on public.attribute_definition
  for each row execute function public.catalog_refresh_search_from_row();

create trigger catalog_search_attribute_option
  after update on public.attribute_option
  for each row execute function public.catalog_refresh_search_from_row();

do $$
declare
  v_variant_id uuid;
begin
  for v_variant_id in select id from public.product_variant loop
    perform public.catalog_refresh_search_variant(v_variant_id);
  end loop;
end;
$$;

comment on table public.catalog_history is
  'Append-only module-local Catalog history. Global Audit Center remains a separate future projection.';

comment on table public.catalog_search_projection is
  'Rebuildable structured Catalog projection by Variant (ADR-0024). No Inventory, Pricing, Supplier or Sales facts.';
