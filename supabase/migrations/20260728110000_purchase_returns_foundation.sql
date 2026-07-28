-- Purchase Returns foundation. Goods Receipt remains the source of received quantities;
-- Inventory Ledger remains the only stock mutation boundary.

alter table public.goods_receipt_item
  add column if not exists returned_quantity numeric(18,4) not null default 0
    check (returned_quantity >= 0);

alter table public.goods_receipt
  drop constraint if exists goods_receipt_status_check;
alter table public.goods_receipt
  add constraint goods_receipt_status_check
  check (status in ('draft','posted','completed','cancelled','archived'));
alter table public.goods_receipt drop constraint if exists goods_receipt_posted_chk;
alter table public.goods_receipt add constraint goods_receipt_posted_chk check (
  (status in ('posted','completed') and received_at is not null and location_id is not null)
  or status not in ('posted','completed')
);

create table public.purchase_return_number_counter (
  organization_id uuid primary key references public.organization(id) on delete restrict,
  last_value bigint not null default 0 check (last_value >= 0)
);

create table public.purchase_return (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  number text not null,
  goods_receipt_id uuid not null references public.goods_receipt(id) on delete restrict,
  purchase_order_id uuid not null references public.purchase_order(id) on delete restrict,
  supplier_id uuid not null references public.supplier(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','processing','completed','cancelled')),
  reason text not null check (char_length(trim(reason)) between 1 and 500),
  notes text check (notes is null or char_length(notes) <= 4000),
  returned_at timestamptz,
  completion_idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  constraint purchase_return_org_number_uidx unique (organization_id, number),
  constraint purchase_return_completed_chk check ((status = 'completed' and returned_at is not null) or status <> 'completed')
);

create unique index purchase_return_org_idempotency_uidx
  on public.purchase_return(organization_id, completion_idempotency_key)
  where completion_idempotency_key is not null;

create index purchase_return_org_status_idx on public.purchase_return(organization_id, status);
create index purchase_return_org_receipt_idx on public.purchase_return(organization_id, goods_receipt_id);

create table public.purchase_return_item (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  purchase_return_id uuid not null references public.purchase_return(id) on delete restrict,
  goods_receipt_item_id uuid not null references public.goods_receipt_item(id) on delete restrict,
  variant_id uuid not null references public.product_variant(id) on delete restrict,
  variant_sku text,
  variant_name text not null,
  unit_code text not null,
  received_quantity numeric(18,4) not null check (received_quantity > 0),
  returned_quantity numeric(18,4) not null default 0 check (returned_quantity >= 0),
  location_id uuid references public.stock_location(id) on delete restrict,
  ledger_movement_id uuid references public.inventory_ledger_movement(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  unique (purchase_return_id, goods_receipt_item_id)
);

create index purchase_return_item_org_return_idx on public.purchase_return_item(organization_id, purchase_return_id);

create table public.purchase_return_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  purchase_return_id uuid not null references public.purchase_return(id) on delete restrict,
  action text not null,
  actor_user_id uuid not null references auth.users(id),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index purchase_return_history_idx on public.purchase_return_history(organization_id, purchase_return_id, created_at desc);

create table public.purchase_return_search (
  purchase_return_id uuid primary key references public.purchase_return(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete restrict,
  number text not null,
  purchase_order_id uuid not null,
  goods_receipt_id uuid not null,
  supplier_id uuid not null,
  status text not null,
  returned_at timestamptz,
  search_text text not null default '',
  updated_at timestamptz not null default now()
);
create index purchase_return_search_org_status_idx on public.purchase_return_search(organization_id, status);
create index purchase_return_search_text_idx on public.purchase_return_search using gin(to_tsvector('simple', search_text));

create or replace function public.purchase_returns_has_permission(p_org uuid, p_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membership m
    where m.organization_id = p_org and m.user_id = auth.uid() and m.status = 'active'
      and (m.role in ('owner','admin') or
        (m.role = 'manager' and p_permission in ('purchase.returns.read','purchase.returns.create','purchase.returns.update','purchase.returns.complete','purchase.returns.cancel')) or
        (m.role in ('inventory','finance') and p_permission in ('purchase.returns.read','purchase.returns.create','purchase.returns.complete')) or
        (m.role = 'viewer' and p_permission = 'purchase.returns.read'))
  );
$$;

create or replace function public.allocate_purchase_return_number(p_org uuid)
returns text language plpgsql security definer set search_path = public as $$
declare n bigint;
begin
  if not public.purchase_returns_has_permission(p_org, 'purchase.returns.create') then raise exception 'permission_denied' using errcode='42501'; end if;
  insert into public.purchase_return_number_counter values (p_org,1)
    on conflict (organization_id) do update set last_value = public.purchase_return_number_counter.last_value + 1
    returning last_value into n;
  return 'PR-' || lpad(n::text, 6, '0');
end; $$;

create or replace function public.refresh_purchase_return_search(p_return_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.purchase_return%rowtype; terms text;
begin
  select * into r from public.purchase_return where id = p_return_id;
  if not found then delete from public.purchase_return_search where purchase_return_id = p_return_id; return; end if;
  select string_agg(concat_ws(' ', variant_name, variant_sku), ' ') into terms from public.purchase_return_item where purchase_return_id = r.id;
  insert into public.purchase_return_search values (r.id,r.organization_id,r.number,r.purchase_order_id,r.goods_receipt_id,r.supplier_id,r.status,r.returned_at,lower(concat_ws(' ',r.number,r.reason,r.notes,terms)),now())
  on conflict (purchase_return_id) do update set status=excluded.status, returned_at=excluded.returned_at, search_text=excluded.search_text, updated_at=now();
end; $$;

create or replace function public.create_purchase_return(
  p_organization_id uuid, p_goods_receipt_id uuid, p_reason text, p_notes text default null
) returns public.purchase_return language plpgsql security definer set search_path=public as $$
declare gr public.goods_receipt%rowtype; r public.purchase_return;
begin
  if not public.purchase_returns_has_permission(p_organization_id,'purchase.returns.create') then raise exception 'permission_denied' using errcode='42501'; end if;
  select * into gr from public.goods_receipt where id=p_goods_receipt_id and organization_id=p_organization_id for share;
  if not found or gr.status not in ('posted','completed') then raise exception 'goods_receipt_not_completed'; end if;
  insert into public.purchase_return(organization_id,number,goods_receipt_id,purchase_order_id,supplier_id,reason,notes,created_by,updated_by)
    values(p_organization_id,public.allocate_purchase_return_number(p_organization_id),gr.id,gr.purchase_order_id,gr.supplier_id,trim(p_reason),p_notes,auth.uid(),auth.uid()) returning * into r;
  insert into public.purchase_return_history(organization_id,purchase_return_id,action,actor_user_id) values(p_organization_id,r.id,'PurchaseReturnCreated',auth.uid());
  perform public.refresh_purchase_return_search(r.id); return r;
end; $$;

create or replace function public.complete_purchase_return(p_organization_id uuid, p_purchase_return_id uuid, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.purchase_return%rowtype; i record; gri public.goods_receipt_item%rowtype; pending numeric; mv public.inventory_ledger_movement;
begin
  if not public.purchase_returns_has_permission(p_organization_id,'purchase.returns.complete') then raise exception 'permission_denied' using errcode='42501'; end if;
  if nullif(trim(coalesce(p_idempotency_key,'')),'') is null then raise exception 'invalid_idempotency_key' using errcode='22023'; end if;
  select * into r from public.purchase_return where id=p_purchase_return_id and organization_id=p_organization_id for update;
  if not found then raise exception 'purchase_return_not_found'; end if;
  if r.status='completed' then return jsonb_build_object('id',r.id,'status',r.status,'idempotent',true); end if;
  if r.status not in ('draft','processing') then raise exception 'invalid_purchase_return_state'; end if;
  update public.purchase_return set status='processing',updated_at=now(),updated_by=auth.uid() where id=r.id;
  for i in select * from public.purchase_return_item where purchase_return_id=r.id order by id for update loop
    select * into gri from public.goods_receipt_item where id=i.goods_receipt_item_id for update;
    pending := gri.received_quantity - gri.returned_quantity;
    if i.returned_quantity > pending then raise exception 'return_quantity_exceeds_received'; end if;
    mv := public.register_inventory_ledger_movement(p_organization_id,i.variant_id,i.location_id,'exit',i.returned_quantity,'OUTBOUND_PURCHASE_RETURN',null,now(),'purchase_return',r.id,r.id,p_idempotency_key || ':' || i.id::text);
    update public.goods_receipt_item set returned_quantity=returned_quantity+i.returned_quantity, updated_at=now(), updated_by=auth.uid() where id=gri.id;
    update public.purchase_return_item set ledger_movement_id=mv.id, updated_at=now(), updated_by=auth.uid() where id=i.id;
  end loop;
  update public.purchase_return set status='completed',returned_at=now(),completion_idempotency_key=p_idempotency_key,updated_at=now(),updated_by=auth.uid() where id=r.id returning * into r;
  insert into public.purchase_return_history(organization_id,purchase_return_id,action,actor_user_id) values(p_organization_id,r.id,'PurchaseReturnCompleted',auth.uid());
  perform public.refresh_purchase_return_search(r.id); return jsonb_build_object('id',r.id,'status',r.status);
end; $$;

create or replace function public.add_purchase_return_item(
  p_organization_id uuid, p_purchase_return_id uuid, p_goods_receipt_item_id uuid,
  p_returned_quantity numeric
) returns public.purchase_return_item language plpgsql security definer set search_path=public as $$
declare r public.purchase_return%rowtype; g public.goods_receipt_item%rowtype; i public.purchase_return_item;
begin
  if not public.purchase_returns_has_permission(p_organization_id,'purchase.returns.update') then raise exception 'permission_denied' using errcode='42501'; end if;
  if p_returned_quantity <= 0 then raise exception 'invalid_return_quantity'; end if;
  select * into r from public.purchase_return where id=p_purchase_return_id and organization_id=p_organization_id for update;
  if not found or r.status not in ('draft','processing') then raise exception 'invalid_purchase_return_state'; end if;
  select * into g from public.goods_receipt_item where id=p_goods_receipt_item_id and organization_id=p_organization_id for share;
  if not found then raise exception 'goods_receipt_item_not_found'; end if;
  if g.goods_receipt_id <> r.goods_receipt_id or g.received_quantity-g.returned_quantity < p_returned_quantity then raise exception 'return_quantity_exceeds_received'; end if;
  insert into public.purchase_return_item(organization_id,purchase_return_id,goods_receipt_item_id,variant_id,variant_sku,variant_name,unit_code,received_quantity,returned_quantity,location_id,created_by,updated_by)
    values(p_organization_id,r.id,g.id,g.variant_id,g.variant_sku,g.variant_name,g.unit_code,g.received_quantity,p_returned_quantity,g.location_id,auth.uid(),auth.uid())
    on conflict (purchase_return_id,goods_receipt_item_id) do update set returned_quantity=excluded.returned_quantity, updated_at=now(), updated_by=auth.uid()
    returning * into i;
  perform public.refresh_purchase_return_search(r.id); return i;
end; $$;

create or replace function public.cancel_purchase_return(p_organization_id uuid, p_purchase_return_id uuid)
returns public.purchase_return language plpgsql security definer set search_path=public as $$
declare r public.purchase_return;
begin
  if not public.purchase_returns_has_permission(p_organization_id,'purchase.returns.cancel') then raise exception 'permission_denied' using errcode='42501'; end if;
  update public.purchase_return set status='cancelled',updated_at=now(),updated_by=auth.uid() where id=p_purchase_return_id and organization_id=p_organization_id and status in ('draft','processing') returning * into r;
  if not found then raise exception 'invalid_purchase_return_state'; end if;
  insert into public.purchase_return_history(organization_id,purchase_return_id,action,actor_user_id) values(p_organization_id,r.id,'PurchaseReturnCancelled',auth.uid());
  perform public.refresh_purchase_return_search(r.id); return r;
end; $$;

alter table public.purchase_return enable row level security;
alter table public.purchase_return_item enable row level security;
alter table public.purchase_return_history enable row level security;
alter table public.purchase_return_search enable row level security;
create policy purchase_return_read on public.purchase_return for select to authenticated using (public.purchase_returns_has_permission(organization_id,'purchase.returns.read'));
create policy purchase_return_item_read on public.purchase_return_item for select to authenticated using (public.purchase_returns_has_permission(organization_id,'purchase.returns.read'));
create policy purchase_return_history_read on public.purchase_return_history for select to authenticated using (public.purchase_returns_has_permission(organization_id,'purchase.returns.read'));
create policy purchase_return_search_read on public.purchase_return_search for select to authenticated using (public.purchase_returns_has_permission(organization_id,'purchase.returns.read'));
revoke all on public.purchase_return, public.purchase_return_item, public.purchase_return_history, public.purchase_return_search from authenticated;
grant select on public.purchase_return, public.purchase_return_item, public.purchase_return_history, public.purchase_return_search to authenticated;
grant execute on function public.create_purchase_return(uuid,uuid,text,text), public.add_purchase_return_item(uuid,uuid,uuid,numeric), public.complete_purchase_return(uuid,uuid,text), public.cancel_purchase_return(uuid,uuid), public.allocate_purchase_return_number(uuid) to authenticated;
