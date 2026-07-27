-- Sales Foundation: Quotations and Sales Orders.
-- This sprint intentionally has no stock, finance, fiscal, fulfillment or receivable effects.

create table public.sales_number_counter(
  organization_id uuid not null references public.organization(id) on delete restrict,
  document_type text not null check(document_type in('quotation','sales_order')),
  last_value bigint not null default 0 check(last_value>=0),
  primary key(organization_id,document_type)
);

create table public.quotation(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  number text not null,
  customer_id uuid not null references public.customer(id) on delete restrict,
  customer_name text not null,
  customer_document text,
  customer_email text,
  customer_phone text,
  status text not null default 'draft' check(status in('draft','sent','approved','rejected','expired','archived')),
  currency text not null default 'BRL' check(currency ~ '^[A-Z]{3}$'),
  subtotal numeric(18,4) not null check(subtotal>=0),
  discount_total numeric(18,4) not null default 0 check(discount_total>=0),
  grand_total numeric(18,4) not null check(grand_total>=0),
  valid_until date,
  notes text check(notes is null or char_length(notes)<=4000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  unique(organization_id,number),
  check(grand_total=subtotal-discount_total)
);

create table public.quotation_item(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  quotation_id uuid not null references public.quotation(id) on delete restrict,
  product_id uuid not null,
  variant_id uuid not null,
  product_name text not null,
  variant_description text,
  sku text not null,
  unit_code text not null,
  quantity numeric(19,6) not null check(quantity>0),
  unit_price numeric(18,4) not null check(unit_price>=0),
  currency text not null check(currency ~ '^[A-Z]{3}$'),
  discount numeric(18,4) not null default 0 check(discount>=0),
  subtotal numeric(18,4) not null check(subtotal>=0),
  total numeric(18,4) not null check(total>=0),
  price_list_id uuid,
  price_source text not null default 'manual' check(price_source in('manual','price_list')),
  price_rule_snapshot jsonb not null default '{}'::jsonb,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  unique(quotation_id,sort_order),
  check(subtotal=quantity*unit_price),
  check(total=subtotal-discount)
);

create table public.sales_order(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  number text not null,
  quotation_id uuid references public.quotation(id) on delete restrict,
  customer_id uuid not null references public.customer(id) on delete restrict,
  customer_name text not null,
  customer_document text,
  customer_email text,
  customer_phone text,
  status text not null default 'draft' check(status in('draft','confirmed','cancelled','archived')),
  currency text not null default 'BRL' check(currency ~ '^[A-Z]{3}$'),
  subtotal numeric(18,4) not null check(subtotal>=0),
  discount_total numeric(18,4) not null default 0 check(discount_total>=0),
  grand_total numeric(18,4) not null check(grand_total>=0),
  notes text check(notes is null or char_length(notes)<=4000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  unique(organization_id,number),
  unique(organization_id,quotation_id),
  check(grand_total=subtotal-discount_total),
  check(quotation_id is null or status in('draft','confirmed','cancelled','archived'))
);

create table public.sales_order_item(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  sales_order_id uuid not null references public.sales_order(id) on delete restrict,
  product_id uuid not null,
  variant_id uuid not null,
  product_name text not null,
  variant_description text,
  sku text not null,
  unit_code text not null,
  quantity numeric(19,6) not null check(quantity>0),
  unit_price numeric(18,4) not null check(unit_price>=0),
  currency text not null check(currency ~ '^[A-Z]{3}$'),
  discount numeric(18,4) not null default 0 check(discount>=0),
  subtotal numeric(18,4) not null check(subtotal>=0),
  total numeric(18,4) not null check(total>=0),
  price_list_id uuid,
  price_source text not null default 'manual' check(price_source in('manual','price_list')),
  price_rule_snapshot jsonb not null default '{}'::jsonb,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  unique(sales_order_id,sort_order),
  check(subtotal=quantity*unit_price),
  check(total=subtotal-discount)
);

create table public.sales_history(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  aggregate_type text not null check(aggregate_type in('quotation','sales_order')),
  aggregate_id uuid not null,
  action text not null,
  old_value text,
  new_value text,
  reason text,
  actor_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.sales_search(
  aggregate_type text not null,
  aggregate_id uuid not null,
  organization_id uuid not null,
  number text not null,
  customer_name text not null,
  customer_document text,
  status text not null,
  currency text not null,
  grand_total numeric(18,4) not null,
  quotation_number text,
  valid_until date,
  issue_date date not null,
  created_at timestamptz not null,
  search_text text not null,
  updated_at timestamptz not null default now(),
  primary key(aggregate_type,aggregate_id)
);

create index sales_search_filters on public.sales_search(organization_id,aggregate_type,status,created_at desc);
create index sales_search_text on public.sales_search using gin(to_tsvector('simple',search_text));
create index sales_history_idx on public.sales_history(organization_id,aggregate_type,aggregate_id,created_at desc);
create trigger quotation_updated before update on public.quotation for each row execute function public.set_updated_at();
create trigger sales_order_updated before update on public.sales_order for each row execute function public.set_updated_at();

create or replace function public.deny_sales_history_mutation() returns trigger language plpgsql set search_path=public as $$
begin
  raise exception 'sales_history_immutable' using errcode='42501';
end$$;
create trigger sales_history_no_update before update on public.sales_history for each row execute function public.deny_sales_history_mutation();
create trigger sales_history_no_delete before delete on public.sales_history for each row execute function public.deny_sales_history_mutation();

create or replace function public.sales_has_permission(p_org uuid,p_permission text) returns boolean language plpgsql security definer set search_path=public stable as $$
declare v_role text;
begin
  if auth.uid() is null then return false; end if;
  select role into v_role from membership where organization_id=p_org and user_id=auth.uid() and status='active';
  if v_role is null then return false; end if;
  if v_role in('owner','admin') then return true; end if;
  if p_permission='sales.read' then return v_role in('manager','seller','inventory','finance','viewer'); end if;
  if p_permission in('sales.create','sales.edit','sales.send','sales.approve','sales.reject','sales.convert','sales.confirm','sales.cancel','sales.archive','sales.discount') then
    return v_role in('manager','seller');
  end if;
  return false;
end$$;

create or replace function public.sales_require_permission(p_org uuid,p_permission text) returns void language plpgsql security definer set search_path=public stable as $$
begin
  if not sales_has_permission(p_org,p_permission) then
    raise exception 'permission_denied' using errcode='42501';
  end if;
end$$;

create or replace function public.sales_normalize_currency(p_currency text) returns text language plpgsql immutable as $$
declare v text:=upper(trim(coalesce(p_currency,'')));
begin
  if v !~ '^[A-Z]{3}$' then raise exception 'invalid_currency'; end if;
  return v;
end$$;

create or replace function public.sales_record_audit(p_org uuid,p_type text,p_id uuid,p_action text,p_payload jsonb) returns void language plpgsql security definer set search_path=public as $$
begin
  if to_regclass('public.audit_event') is not null then
    execute 'insert into public.audit_event(organization_id, actor_user_id, aggregate_type, aggregate_id, action, payload, created_at) values($1,$2,$3,$4,$5,$6,now())'
      using p_org,auth.uid(),p_type,p_id,p_action,p_payload;
  end if;
exception when undefined_table or undefined_column then
  null;
end$$;

create or replace function public.allocate_sales_number(p_org uuid,p_type text) returns text language plpgsql security definer set search_path=public as $$
declare v bigint;
begin
  insert into sales_number_counter values(p_org,p_type,1)
  on conflict(organization_id,document_type) do update set last_value=sales_number_counter.last_value+1
  returning last_value into v;
  return (case when p_type='quotation' then 'QT-' else 'SO-' end)||lpad(v::text,6,'0');
end$$;

create or replace function public.sales_resolve_item_snapshots(p_org uuid,p_currency text,p_items jsonb,p_allow_manual boolean)
returns table(
  sort_order integer, product_id uuid, variant_id uuid, product_name text, variant_description text, sku text, unit_code text,
  quantity numeric, unit_price numeric, currency text, discount numeric, subtotal numeric, total numeric, price_list_id uuid,
  price_source text, price_rule_snapshot jsonb, item_search_text text
) language plpgsql security definer set search_path=public stable as $$
declare
  r record; v_currency text:=sales_normalize_currency(p_currency); v_variant uuid; v_price_list uuid; v_qty numeric; v_price numeric; v_discount numeric;
  v_product product%rowtype; v_variant_row product_variant%rowtype; v_unit text; v_price_row record; v_uuid_rx text:='^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)=0 then raise exception 'invalid_items'; end if;
  for r in select value as x, ordinality::int as ord from jsonb_array_elements(p_items) with ordinality loop
    if jsonb_typeof(r.x)<>'object' then raise exception 'invalid_item_payload'; end if;
    if coalesce(r.x->>'variantId','') !~ v_uuid_rx then raise exception 'invalid_variant'; end if;
    if coalesce(r.x->>'quantity','') !~ '^[0-9]+(\.[0-9]{1,6})?$' then raise exception 'invalid_quantity'; end if;
    if coalesce(r.x->>'discount','0') !~ '^[0-9]+(\.[0-9]{1,4})?$' then raise exception 'invalid_discount'; end if;
    v_variant:=(r.x->>'variantId')::uuid; v_qty:=(r.x->>'quantity')::numeric; v_discount:=coalesce((r.x->>'discount')::numeric,0);
    if v_qty<=0 then raise exception 'invalid_quantity'; end if;
    select * into v_variant_row from product_variant pv where pv.id=v_variant and pv.organization_id=p_org and pv.status='active';
    if not found then raise exception 'variant_not_found'; end if;
    select * into v_product from product pr where pr.id=v_variant_row.product_id and pr.organization_id=p_org and pr.status='active';
    if not found then raise exception 'product_not_found'; end if;
    select coalesce(u.code,v_product.unit,'UN') into v_unit from unit_of_measure u where u.id=v_variant_row.unit_of_measure_id;
    v_unit:=coalesce(v_unit,v_product.unit,'UN');
    if nullif(r.x->>'priceListId','') is not null then
      if (r.x->>'priceListId') !~ v_uuid_rx then raise exception 'invalid_price_list'; end if;
      v_price_list:=(r.x->>'priceListId')::uuid;
      select pl.id,pl.name,pl.currency,pl.priority,ple.id as entry_id,ple.amount,ple.valid_from,ple.valid_to into v_price_row
      from price_list pl
      join price_list_entry ple on ple.price_list_id=pl.id and ple.organization_id=p_org and ple.variant_id=v_variant and ple.valid_from<=now() and (ple.valid_to is null or ple.valid_to>now())
      where pl.id=v_price_list and pl.organization_id=p_org and pl.status='active' and pl.currency=v_currency
      order by ple.valid_from desc
      limit 1;
      if not found then raise exception 'price_required'; end if;
      v_price:=v_price_row.amount; price_source:='price_list'; price_list_id:=v_price_list;
      price_rule_snapshot:=jsonb_build_object('priceListId',v_price_row.id,'priceListName',v_price_row.name,'entryId',v_price_row.entry_id,'validFrom',v_price_row.valid_from,'validTo',v_price_row.valid_to,'priority',v_price_row.priority);
    else
      if not p_allow_manual then raise exception 'manual_price_denied' using errcode='42501'; end if;
      if coalesce(r.x->>'unitPrice','') !~ '^[0-9]+(\.[0-9]{1,4})?$' then raise exception 'invalid_price'; end if;
      v_price:=(r.x->>'unitPrice')::numeric; price_source:='manual'; price_list_id:=null; price_rule_snapshot:=jsonb_build_object('source','manual');
    end if;
    if v_price<0 or v_discount<0 or v_discount>(v_qty*v_price) then raise exception 'invalid_item_total'; end if;
    sort_order:=r.ord; product_id:=v_product.id; variant_id:=v_variant_row.id; product_name:=v_product.name;
    variant_description:=coalesce(nullif(r.x->>'description',''),v_product.description);
    sku:=coalesce(nullif(v_variant_row.sku,''),v_product.name); unit_code:=v_unit; quantity:=v_qty; unit_price:=v_price; currency:=v_currency;
    discount:=v_discount; subtotal:=v_qty*v_price; total:=subtotal-v_discount;
    item_search_text:=lower(concat_ws(' ',product_name,variant_description,sku,unit_code,total::text,price_source));
    return next;
  end loop;
end$$;

create or replace function public.refresh_sales_search(p_type text,p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if p_type='quotation' then
    insert into sales_search(aggregate_type,aggregate_id,organization_id,number,customer_name,customer_document,status,currency,grand_total,quotation_number,valid_until,issue_date,created_at,search_text)
    select 'quotation',q.id,q.organization_id,q.number,q.customer_name,q.customer_document,q.status,q.currency,q.grand_total,null,q.valid_until,q.created_at::date,q.created_at,
      lower(concat_ws(' ',q.number,q.customer_name,q.customer_document,q.status,q.currency,q.grand_total::text,q.valid_until::text,q.created_at::date::text,(select string_agg(i.item_search_text,' ') from (select concat_ws(' ',product_name,variant_description,sku,unit_code,total::text,price_source) item_search_text from quotation_item where quotation_id=q.id order by sort_order) i)))
    from quotation q where q.id=p_id
    on conflict(aggregate_type,aggregate_id) do update set customer_name=excluded.customer_name,customer_document=excluded.customer_document,status=excluded.status,currency=excluded.currency,grand_total=excluded.grand_total,valid_until=excluded.valid_until,issue_date=excluded.issue_date,search_text=excluded.search_text,updated_at=now();
  else
    insert into sales_search(aggregate_type,aggregate_id,organization_id,number,customer_name,customer_document,status,currency,grand_total,quotation_number,valid_until,issue_date,created_at,search_text)
    select 'sales_order',o.id,o.organization_id,o.number,o.customer_name,o.customer_document,o.status,o.currency,o.grand_total,q.number,null,o.created_at::date,o.created_at,
      lower(concat_ws(' ',o.number,o.customer_name,o.customer_document,o.status,o.currency,o.grand_total::text,q.number,o.created_at::date::text,(select string_agg(i.item_search_text,' ') from (select concat_ws(' ',product_name,variant_description,sku,unit_code,total::text,price_source) item_search_text from sales_order_item where sales_order_id=o.id order by sort_order) i)))
    from sales_order o left join quotation q on q.id=o.quotation_id where o.id=p_id
    on conflict(aggregate_type,aggregate_id) do update set customer_name=excluded.customer_name,customer_document=excluded.customer_document,status=excluded.status,currency=excluded.currency,grand_total=excluded.grand_total,quotation_number=excluded.quotation_number,issue_date=excluded.issue_date,search_text=excluded.search_text,updated_at=now();
  end if;
end$$;

create or replace function public.trg_quotation_search() returns trigger language plpgsql security definer set search_path=public as $$begin perform refresh_sales_search('quotation',coalesce(new.id,old.id)); return coalesce(new,old); end$$;
create or replace function public.trg_order_search() returns trigger language plpgsql security definer set search_path=public as $$begin perform refresh_sales_search('sales_order',coalesce(new.id,old.id)); return coalesce(new,old); end$$;
create or replace function public.trg_quotation_item_search() returns trigger language plpgsql security definer set search_path=public as $$begin perform refresh_sales_search('quotation',coalesce(new.quotation_id,old.quotation_id)); return coalesce(new,old); end$$;
create or replace function public.trg_order_item_search() returns trigger language plpgsql security definer set search_path=public as $$begin perform refresh_sales_search('sales_order',coalesce(new.sales_order_id,old.sales_order_id)); return coalesce(new,old); end$$;
create trigger quotation_search after insert or update on public.quotation for each row execute function public.trg_quotation_search();
create trigger quotation_item_search after insert or update or delete on public.quotation_item for each row execute function public.trg_quotation_item_search();
create trigger order_search after insert or update on public.sales_order for each row execute function public.trg_order_search();
create trigger order_item_search after insert or update or delete on public.sales_order_item for each row execute function public.trg_order_item_search();

create or replace function public.create_quotation(p_org uuid,p_customer uuid,p_currency text,p_valid_until date,p_notes text,p_items jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid:=gen_random_uuid(); v_num text; v_c customer%rowtype; v_currency text:=sales_normalize_currency(p_currency); v_sub numeric; v_disc numeric; v_count int;
begin
  perform sales_require_permission(p_org,'sales.create');
  select * into v_c from customer where id=p_customer and organization_id=p_org and status='active';
  if not found then raise exception 'customer_not_found'; end if;
  drop table if exists sales_item_snapshot_tmp;
  create temporary table sales_item_snapshot_tmp on commit drop as select * from sales_resolve_item_snapshots(p_org,v_currency,p_items,sales_has_permission(p_org,'sales.discount'));
  select count(*),sum(subtotal),sum(discount) into v_count,v_sub,v_disc from sales_item_snapshot_tmp;
  if v_count=0 or coalesce(v_sub-v_disc,-1)<0 then raise exception 'invalid_items'; end if;
  v_num:=allocate_sales_number(p_org,'quotation');
  insert into quotation(id,organization_id,number,customer_id,customer_name,customer_document,customer_email,customer_phone,currency,subtotal,discount_total,grand_total,valid_until,notes,created_by,updated_by)
  values(v_id,p_org,v_num,v_c.id,v_c.name,v_c.document,v_c.email,v_c.phone,v_currency,v_sub,v_disc,v_sub-v_disc,p_valid_until,nullif(trim(p_notes),''),auth.uid(),auth.uid());
  insert into quotation_item(organization_id,quotation_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order)
  select p_org,v_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order from sales_item_snapshot_tmp order by sort_order;
  insert into sales_history(organization_id,aggregate_type,aggregate_id,action,new_value,actor_user_id) values(p_org,'quotation',v_id,'QuotationCreated',v_num,auth.uid());
  perform sales_record_audit(p_org,'quotation',v_id,'QuotationCreated',jsonb_build_object('number',v_num,'customerId',v_c.id,'total',v_sub-v_disc));
  return v_id;
end$$;

create or replace function public.create_sales_order(p_org uuid,p_customer uuid,p_currency text,p_notes text,p_items jsonb,p_quotation uuid default null) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid:=gen_random_uuid(); v_num text; v_c customer%rowtype; v_currency text:=sales_normalize_currency(p_currency); v_sub numeric; v_disc numeric; v_count int;
begin
  perform sales_require_permission(p_org,'sales.create');
  if p_quotation is not null then raise exception 'use_convert_quotation_to_sales_order'; end if;
  select * into v_c from customer where id=p_customer and organization_id=p_org and status='active';
  if not found then raise exception 'customer_not_found'; end if;
  drop table if exists sales_item_snapshot_tmp;
  create temporary table sales_item_snapshot_tmp on commit drop as select * from sales_resolve_item_snapshots(p_org,v_currency,p_items,sales_has_permission(p_org,'sales.discount'));
  select count(*),sum(subtotal),sum(discount) into v_count,v_sub,v_disc from sales_item_snapshot_tmp;
  if v_count=0 or coalesce(v_sub-v_disc,-1)<0 then raise exception 'invalid_items'; end if;
  v_num:=allocate_sales_number(p_org,'sales_order');
  insert into sales_order(id,organization_id,number,customer_id,customer_name,customer_document,customer_email,customer_phone,currency,subtotal,discount_total,grand_total,notes,created_by,updated_by)
  values(v_id,p_org,v_num,v_c.id,v_c.name,v_c.document,v_c.email,v_c.phone,v_currency,v_sub,v_disc,v_sub-v_disc,nullif(trim(p_notes),''),auth.uid(),auth.uid());
  insert into sales_order_item(organization_id,sales_order_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order)
  select p_org,v_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order from sales_item_snapshot_tmp order by sort_order;
  insert into sales_history(organization_id,aggregate_type,aggregate_id,action,new_value,actor_user_id) values(p_org,'sales_order',v_id,'SalesOrderCreated',v_num,auth.uid());
  perform sales_record_audit(p_org,'sales_order',v_id,'SalesOrderCreated',jsonb_build_object('number',v_num,'customerId',v_c.id,'total',v_sub-v_disc));
  return v_id;
end$$;

create or replace function public.update_quotation(p_org uuid,p_id uuid,p_currency text,p_valid_until date,p_notes text,p_items jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_status text; v_currency text:=sales_normalize_currency(p_currency); v_sub numeric; v_disc numeric; v_count int; v_before jsonb; v_after jsonb;
begin
  perform sales_require_permission(p_org,'sales.edit');
  select status into v_status from quotation where id=p_id and organization_id=p_org for update;
  if not found then raise exception 'not_found'; end if;
  if v_status<>'draft' then raise exception 'document_not_editable'; end if;
  v_before:=coalesce((select jsonb_agg(to_jsonb(i) order by sort_order) from quotation_item i where quotation_id=p_id),'[]'::jsonb);
  drop table if exists sales_item_snapshot_tmp;
  create temporary table sales_item_snapshot_tmp on commit drop as select * from sales_resolve_item_snapshots(p_org,v_currency,p_items,sales_has_permission(p_org,'sales.discount'));
  select count(*),sum(subtotal),sum(discount) into v_count,v_sub,v_disc from sales_item_snapshot_tmp;
  if v_count=0 or coalesce(v_sub-v_disc,-1)<0 then raise exception 'invalid_items'; end if;
  update quotation set currency=v_currency,subtotal=v_sub,discount_total=v_disc,grand_total=v_sub-v_disc,valid_until=p_valid_until,notes=nullif(trim(p_notes),''),updated_by=auth.uid() where id=p_id and organization_id=p_org;
  delete from quotation_item where quotation_id=p_id and organization_id=p_org;
  insert into quotation_item(organization_id,quotation_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order)
  select p_org,p_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order from sales_item_snapshot_tmp order by sort_order;
  v_after:=coalesce((select jsonb_agg(to_jsonb(i) order by sort_order) from quotation_item i where quotation_id=p_id),'[]'::jsonb);
  insert into sales_history(organization_id,aggregate_type,aggregate_id,action,new_value,actor_user_id) values(p_org,'quotation',p_id,'QuotationUpdated','draft',auth.uid());
  perform sales_record_audit(p_org,'quotation',p_id,'QuotationUpdated',jsonb_build_object('beforeItems',v_before,'afterItems',v_after,'currency',v_currency,'validUntil',p_valid_until,'total',v_sub-v_disc));
  return p_id;
end$$;

create or replace function public.update_sales_order(p_org uuid,p_id uuid,p_currency text,p_notes text,p_items jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_status text; v_currency text:=sales_normalize_currency(p_currency); v_sub numeric; v_disc numeric; v_count int; v_before jsonb; v_after jsonb;
begin
  perform sales_require_permission(p_org,'sales.edit');
  select status into v_status from sales_order where id=p_id and organization_id=p_org for update;
  if not found then raise exception 'not_found'; end if;
  if v_status<>'draft' then raise exception 'document_not_editable'; end if;
  v_before:=coalesce((select jsonb_agg(to_jsonb(i) order by sort_order) from sales_order_item i where sales_order_id=p_id),'[]'::jsonb);
  drop table if exists sales_item_snapshot_tmp;
  create temporary table sales_item_snapshot_tmp on commit drop as select * from sales_resolve_item_snapshots(p_org,v_currency,p_items,sales_has_permission(p_org,'sales.discount'));
  select count(*),sum(subtotal),sum(discount) into v_count,v_sub,v_disc from sales_item_snapshot_tmp;
  if v_count=0 or coalesce(v_sub-v_disc,-1)<0 then raise exception 'invalid_items'; end if;
  update sales_order set currency=v_currency,subtotal=v_sub,discount_total=v_disc,grand_total=v_sub-v_disc,notes=nullif(trim(p_notes),''),updated_by=auth.uid() where id=p_id and organization_id=p_org;
  delete from sales_order_item where sales_order_id=p_id and organization_id=p_org;
  insert into sales_order_item(organization_id,sales_order_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order)
  select p_org,p_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order from sales_item_snapshot_tmp order by sort_order;
  v_after:=coalesce((select jsonb_agg(to_jsonb(i) order by sort_order) from sales_order_item i where sales_order_id=p_id),'[]'::jsonb);
  insert into sales_history(organization_id,aggregate_type,aggregate_id,action,new_value,actor_user_id) values(p_org,'sales_order',p_id,'SalesOrderUpdated','draft',auth.uid());
  perform sales_record_audit(p_org,'sales_order',p_id,'SalesOrderUpdated',jsonb_build_object('beforeItems',v_before,'afterItems',v_after,'currency',v_currency,'total',v_sub-v_disc));
  return p_id;
end$$;

create or replace function public.convert_quotation_to_sales_order(p_org uuid,p_quotation uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_num text; v_q quotation%rowtype;
begin
  perform sales_require_permission(p_org,'sales.convert');
  select id into v_id from sales_order where organization_id=p_org and quotation_id=p_quotation;
  if found then return v_id; end if;
  select * into v_q from quotation where id=p_quotation and organization_id=p_org for update;
  if not found then raise exception 'not_found'; end if;
  if v_q.status<>'approved' then raise exception 'quotation_not_approved'; end if;
  select id into v_id from sales_order where organization_id=p_org and quotation_id=p_quotation;
  if found then return v_id; end if;
  v_id:=gen_random_uuid(); v_num:=allocate_sales_number(p_org,'sales_order');
  insert into sales_order(id,organization_id,number,quotation_id,customer_id,customer_name,customer_document,customer_email,customer_phone,currency,subtotal,discount_total,grand_total,notes,created_by,updated_by)
  values(v_id,p_org,v_num,p_quotation,v_q.customer_id,v_q.customer_name,v_q.customer_document,v_q.customer_email,v_q.customer_phone,v_q.currency,v_q.subtotal,v_q.discount_total,v_q.grand_total,v_q.notes,auth.uid(),auth.uid());
  insert into sales_order_item(organization_id,sales_order_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order)
  select organization_id,v_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order from quotation_item where quotation_id=p_quotation and organization_id=p_org order by sort_order;
  insert into sales_history(organization_id,aggregate_type,aggregate_id,action,new_value,reason,actor_user_id)
  values(p_org,'sales_order',v_id,'SalesOrderCreated',v_num,'convertida de '||v_q.number,auth.uid()),
        (p_org,'quotation',p_quotation,'QuotationConverted',v_num,null,auth.uid());
  perform sales_record_audit(p_org,'sales_order',v_id,'SalesOrderCreated',jsonb_build_object('number',v_num,'quotationId',p_quotation,'quotationNumber',v_q.number,'converted',true));
  perform sales_record_audit(p_org,'quotation',p_quotation,'QuotationConverted',jsonb_build_object('salesOrderId',v_id,'salesOrderNumber',v_num));
  return v_id;
end$$;

create or replace function public.transition_quotation(p_org uuid,p_id uuid,p_to text,p_reason text default null) returns uuid language plpgsql security definer set search_path=public as $$
declare v_from text; v_permission text;
begin
  v_permission:=case p_to when 'sent' then 'sales.send' when 'approved' then 'sales.approve' when 'rejected' then 'sales.reject' when 'expired' then 'sales.reject' when 'archived' then 'sales.archive' else 'sales.edit' end;
  perform sales_require_permission(p_org,v_permission);
  select status into v_from from quotation where id=p_id and organization_id=p_org for update;
  if not found then raise exception 'not_found'; end if;
  if not((v_from='draft' and p_to in('sent','archived')) or (v_from='sent' and p_to in('approved','rejected','expired')) or (v_from in('approved','rejected','expired') and p_to='archived')) then raise exception 'invalid_transition'; end if;
  update quotation set status=p_to,archived_at=case when p_to='archived' then now() else null end,updated_by=auth.uid() where id=p_id;
  insert into sales_history(organization_id,aggregate_type,aggregate_id,action,old_value,new_value,reason,actor_user_id) values(p_org,'quotation',p_id,'Quotation'||initcap(p_to),v_from,p_to,p_reason,auth.uid());
  perform sales_record_audit(p_org,'quotation',p_id,'Quotation'||initcap(p_to),jsonb_build_object('from',v_from,'to',p_to,'reason',p_reason));
  return p_id;
end$$;

create or replace function public.transition_sales_order(p_org uuid,p_id uuid,p_to text,p_reason text default null) returns uuid language plpgsql security definer set search_path=public as $$
declare v_from text; v_permission text;
begin
  v_permission:=case p_to when 'confirmed' then 'sales.confirm' when 'cancelled' then 'sales.cancel' when 'archived' then 'sales.archive' else 'sales.edit' end;
  perform sales_require_permission(p_org,v_permission);
  select status into v_from from sales_order where id=p_id and organization_id=p_org for update;
  if not found then raise exception 'not_found'; end if;
  if not((v_from='draft' and p_to in('confirmed','cancelled','archived')) or (v_from='confirmed' and p_to='cancelled') or (v_from='cancelled' and p_to='archived')) then raise exception 'invalid_transition'; end if;
  update sales_order set status=p_to,archived_at=case when p_to='archived' then now() else null end,updated_by=auth.uid() where id=p_id;
  insert into sales_history(organization_id,aggregate_type,aggregate_id,action,old_value,new_value,reason,actor_user_id) values(p_org,'sales_order',p_id,'SalesOrder'||initcap(p_to),v_from,p_to,p_reason,auth.uid());
  perform sales_record_audit(p_org,'sales_order',p_id,'SalesOrder'||initcap(p_to),jsonb_build_object('from',v_from,'to',p_to,'reason',p_reason));
  return p_id;
end$$;

create or replace function public.get_sales_document(p_org uuid,p_type text,p_id uuid) returns jsonb language plpgsql security definer set search_path=public stable as $$
declare v jsonb;
begin
  perform sales_require_permission(p_org,'sales.read');
  if p_type='quotation' then
    select jsonb_build_object('document',to_jsonb(q),'items',coalesce((select jsonb_agg(to_jsonb(i) order by sort_order) from quotation_item i where quotation_id=q.id),'[]'),'history',coalesce((select jsonb_agg(to_jsonb(h) order by created_at desc) from sales_history h where aggregate_type='quotation' and aggregate_id=q.id),'[]')) into v from quotation q where q.id=p_id and q.organization_id=p_org;
  elsif p_type='sales_order' then
    select jsonb_build_object('document',to_jsonb(o),'items',coalesce((select jsonb_agg(to_jsonb(i) order by sort_order) from sales_order_item i where sales_order_id=o.id),'[]'),'history',coalesce((select jsonb_agg(to_jsonb(h) order by created_at desc) from sales_history h where aggregate_type='sales_order' and aggregate_id=o.id),'[]')) into v from sales_order o where o.id=p_id and o.organization_id=p_org;
  else
    raise exception 'invalid_sales_document_type';
  end if;
  return v;
end$$;

create or replace function public.list_sales_documents(p_org uuid,p_type text,p_query text default null,p_status text default null,p_limit int default 50) returns setof sales_search language sql security definer set search_path=public stable as $$
  select * from sales_search
  where organization_id=p_org
    and sales_has_permission(p_org,'sales.read')
    and aggregate_type=p_type
    and (p_status is null or status=p_status)
    and (
      nullif(trim(p_query),'') is null
      or to_tsvector('simple',search_text) @@ plainto_tsquery('simple',lower(trim(p_query)))
      or search_text like '%'||lower(trim(p_query))||'%'
    )
  order by created_at desc
  limit least(greatest(p_limit,1),100)
$$;

alter table public.sales_number_counter enable row level security;
alter table public.quotation enable row level security;
alter table public.quotation_item enable row level security;
alter table public.sales_order enable row level security;
alter table public.sales_order_item enable row level security;
alter table public.sales_history enable row level security;
alter table public.sales_search enable row level security;

create policy quotation_read on public.quotation for select to authenticated using(sales_has_permission(organization_id,'sales.read'));
create policy quotation_item_read on public.quotation_item for select to authenticated using(sales_has_permission(organization_id,'sales.read'));
create policy order_read on public.sales_order for select to authenticated using(sales_has_permission(organization_id,'sales.read'));
create policy order_item_read on public.sales_order_item for select to authenticated using(sales_has_permission(organization_id,'sales.read'));
create policy sales_history_read on public.sales_history for select to authenticated using(sales_has_permission(organization_id,'sales.read'));
create policy sales_search_read on public.sales_search for select to authenticated using(sales_has_permission(organization_id,'sales.read'));

grant select on public.quotation,public.quotation_item,public.sales_order,public.sales_order_item,public.sales_history,public.sales_search to authenticated;
grant execute on function public.create_quotation(uuid,uuid,text,date,text,jsonb),public.create_sales_order(uuid,uuid,text,text,jsonb,uuid),public.update_quotation(uuid,uuid,text,date,text,jsonb),public.update_sales_order(uuid,uuid,text,text,jsonb),public.convert_quotation_to_sales_order(uuid,uuid),public.transition_quotation(uuid,uuid,text,text),public.transition_sales_order(uuid,uuid,text,text),public.get_sales_document(uuid,text,uuid),public.list_sales_documents(uuid,text,text,text,int) to authenticated;
