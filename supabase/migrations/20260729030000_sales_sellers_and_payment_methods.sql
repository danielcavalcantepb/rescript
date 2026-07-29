-- Commercial configuration: sellers and payment methods are organization-owned
-- reference data.  They do not post cash or calculate commissions.

create table if not exists public.seller (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  branch_id uuid references public.branch(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  short_name text not null check (char_length(trim(short_name)) between 2 and 80),
  commission_rate numeric(9,6) not null default 0 check (commission_rate >= 0 and commission_rate <= 100),
  salary_amount numeric(18,4) not null default 0 check (salary_amount >= 0),
  bonus_amount numeric(18,4) not null default 0 check (bonus_amount >= 0),
  bonus_target_percentage numeric(9,6) not null default 0 check (bonus_target_percentage >= 0 and bonus_target_percentage <= 100),
  status text not null default 'active' check (status in ('active', 'archived')),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  check ((status = 'active' and archived_at is null and archived_by is null) or (status = 'archived' and archived_at is not null and archived_by is not null))
);
create unique index if not exists seller_org_user_uidx on public.seller(organization_id, user_id) where user_id is not null and status = 'active';
create index if not exists seller_org_status_name_idx on public.seller(organization_id, status, full_name);

create table if not exists public.seller_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  seller_id uuid not null references public.seller(id) on delete restrict,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  actor_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists seller_history_org_seller_idx on public.seller_history(organization_id, seller_id, created_at desc);

create table if not exists public.payment_method (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  code text not null check (char_length(trim(code)) between 1 and 40),
  name text not null check (char_length(trim(name)) between 1 and 160),
  kind text not null check (kind in ('cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'other')),
  status text not null default 'active' check (status in ('active', 'archived')),
  is_default boolean not null default false,
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  check ((status = 'active' and archived_at is null and archived_by is null) or (status = 'archived' and archived_at is not null and archived_by is not null))
);
create unique index if not exists payment_method_org_code_uidx on public.payment_method(organization_id, upper(code));
create unique index if not exists payment_method_org_default_uidx on public.payment_method(organization_id) where is_default and status = 'active';
create index if not exists payment_method_org_status_name_idx on public.payment_method(organization_id, status, name);

create table if not exists public.payment_method_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  payment_method_id uuid not null references public.payment_method(id) on delete restrict,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  actor_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists payment_method_history_org_method_idx on public.payment_method_history(organization_id, payment_method_id, created_at desc);

create trigger seller_set_updated_at before update on public.seller for each row execute function public.set_updated_at();
create trigger payment_method_set_updated_at before update on public.payment_method for each row execute function public.set_updated_at();

alter table public.sales_order
  add column if not exists seller_id uuid references public.seller(id) on delete restrict,
  add column if not exists seller_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists payment_method_id uuid references public.payment_method(id) on delete restrict,
  add column if not exists payment_method_snapshot jsonb not null default '{}'::jsonb;
create index if not exists sales_order_org_seller_idx on public.sales_order(organization_id, seller_id);
create index if not exists sales_order_org_payment_method_idx on public.sales_order(organization_id, payment_method_id);

create or replace function public.commercial_has_permission(p_org uuid, p_permission text)
returns boolean language plpgsql security definer set search_path = public stable as $$
declare v_role text;
begin
  if auth.uid() is null then return false; end if;
  select role into v_role from public.membership where organization_id = p_org and user_id = auth.uid() and status = 'active';
  if v_role in ('owner', 'admin') then return true; end if;
  if p_permission in ('sellers.read', 'payment_methods.read') then return v_role in ('manager', 'seller', 'finance', 'viewer'); end if;
  if p_permission in ('sellers.manage', 'payment_methods.manage') then return v_role in ('manager', 'finance'); end if;
  return false;
end $$;

create or replace function public.commercial_require_permission(p_org uuid, p_permission text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.commercial_has_permission(p_org, p_permission) then raise exception 'permission_denied' using errcode = '42501'; end if;
end $$;

create or replace function public.commercial_validate_seller(p_org uuid, p_seller uuid)
returns jsonb language plpgsql security definer set search_path = public stable as $$
declare v_seller public.seller%rowtype;
begin
  if p_seller is null then return '{}'::jsonb; end if;
  select * into v_seller from public.seller where id = p_seller and organization_id = p_org and status = 'active';
  if not found then raise exception 'sales_seller_not_found' using errcode = 'P0002'; end if;
  return jsonb_build_object('id', v_seller.id, 'fullName', v_seller.full_name, 'shortName', v_seller.short_name);
end $$;

create or replace function public.commercial_validate_payment_method(p_org uuid, p_method uuid)
returns jsonb language plpgsql security definer set search_path = public stable as $$
declare v_method public.payment_method%rowtype;
begin
  if p_method is null then return '{}'::jsonb; end if;
  select * into v_method from public.payment_method where id = p_method and organization_id = p_org and status = 'active';
  if not found then raise exception 'sales_payment_method_not_found' using errcode = 'P0002'; end if;
  return jsonb_build_object('id', v_method.id, 'code', v_method.code, 'name', v_method.name, 'kind', v_method.kind);
end $$;

create or replace function public.create_seller(p_org uuid, p_branch uuid, p_user uuid, p_full_name text, p_short_name text, p_commission_rate numeric, p_salary_amount numeric, p_bonus_amount numeric, p_bonus_target_percentage numeric)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid := gen_random_uuid();
begin
  perform public.commercial_require_permission(p_org, 'sellers.manage');
  if p_branch is not null and not exists(select 1 from public.branch where id=p_branch and organization_id=p_org and status='active') then raise exception 'seller_branch_not_found' using errcode='P0002'; end if;
  if p_user is not null and not exists(select 1 from public.membership where organization_id=p_org and user_id=p_user and status='active') then raise exception 'seller_user_not_member' using errcode='P0002'; end if;
  insert into public.seller(id, organization_id, branch_id, user_id, full_name, short_name, commission_rate, salary_amount, bonus_amount, bonus_target_percentage, created_by, updated_by)
  values(v_id, p_org, p_branch, p_user, trim(p_full_name), trim(p_short_name), coalesce(p_commission_rate,0), coalesce(p_salary_amount,0), coalesce(p_bonus_amount,0), coalesce(p_bonus_target_percentage,0), auth.uid(), auth.uid());
  insert into public.seller_history(organization_id,seller_id,action,details,actor_user_id) values(p_org,v_id,'SellerCreated',jsonb_build_object('fullName',trim(p_full_name),'shortName',trim(p_short_name)),auth.uid());
  perform public.fundamental_record_audit(p_org,'Seller',v_id,'SellerCreated',null,jsonb_build_object('fullName',trim(p_full_name),'shortName',trim(p_short_name)));
  return v_id;
end $$;

create or replace function public.archive_seller(p_org uuid, p_seller uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_before jsonb;
begin
  perform public.commercial_require_permission(p_org, 'sellers.manage');
  select to_jsonb(s) into v_before from public.seller s where id=p_seller and organization_id=p_org and status='active' for update;
  if v_before is null then raise exception 'seller_not_found' using errcode='P0002'; end if;
  update public.seller set status='archived',archived_at=now(),archived_by=auth.uid(),updated_by=auth.uid() where id=p_seller;
  insert into public.seller_history(organization_id,seller_id,action,actor_user_id) values(p_org,p_seller,'SellerArchived',auth.uid());
  perform public.fundamental_record_audit(p_org,'Seller',p_seller,'SellerArchived',v_before,null);
end $$;

create or replace function public.list_sellers(p_org uuid)
returns table(id uuid, full_name text, short_name text, branch_id uuid, user_id uuid, status text) language sql security definer set search_path = public stable as $$
  select s.id,s.full_name,s.short_name,s.branch_id,s.user_id,s.status from public.seller s where s.organization_id=p_org and s.status='active' and public.commercial_has_permission(p_org,'sellers.read') order by s.full_name
$$;

create or replace function public.list_sellers_for_management(p_org uuid)
returns setof public.seller language sql security definer set search_path = public stable as $$
  select s.* from public.seller s where s.organization_id=p_org and public.commercial_has_permission(p_org,'sellers.manage') order by s.status,s.full_name
$$;

create or replace function public.list_seller_members(p_org uuid)
returns table(user_id uuid, role text) language sql security definer set search_path = public stable as $$
  select m.user_id,m.role from public.membership m where m.organization_id=p_org and m.status='active' and public.commercial_has_permission(p_org,'sellers.manage') order by m.role,m.user_id
$$;

create or replace function public.create_payment_method(p_org uuid, p_code text, p_name text, p_kind text, p_is_default boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid := gen_random_uuid();
begin
  perform public.commercial_require_permission(p_org, 'payment_methods.manage');
  if p_kind not in ('cash','pix','credit_card','debit_card','bank_transfer','other') then raise exception 'invalid_payment_method_kind' using errcode='22023'; end if;
  if p_is_default then update public.payment_method set is_default=false,updated_by=auth.uid() where organization_id=p_org and is_default; end if;
  insert into public.payment_method(id,organization_id,code,name,kind,is_default,created_by,updated_by) values(v_id,p_org,upper(trim(p_code)),trim(p_name),p_kind,p_is_default,auth.uid(),auth.uid());
  insert into public.payment_method_history(organization_id,payment_method_id,action,actor_user_id) values(p_org,v_id,'PaymentMethodCreated',auth.uid());
  perform public.fundamental_record_audit(p_org,'PaymentMethod',v_id,'PaymentMethodCreated',null,jsonb_build_object('code',upper(trim(p_code)),'name',trim(p_name),'kind',p_kind));
  return v_id;
end $$;

create or replace function public.list_payment_methods(p_org uuid)
returns setof public.payment_method language sql security definer set search_path = public stable as $$
  select p.* from public.payment_method p where p.organization_id=p_org and p.status='active' and public.commercial_has_permission(p_org,'payment_methods.read') order by p.is_default desc,p.name
$$;

-- A usable commercial workspace always has one immediate condition and one payment method.
with owners as (
  select o.id as organization_id, m.user_id
  from public.organization o join lateral (select user_id from public.membership where organization_id=o.id and status='active' and role='owner' order by created_at limit 1) m on true
), terms as (
  insert into public.payment_term(organization_id,code,name,kind,is_default,created_by,updated_by)
  select organization_id,'A_VISTA','À vista','immediate',true,user_id,user_id from owners
  where not exists(select 1 from public.payment_term t where t.organization_id=owners.organization_id and t.status='active')
  returning id,organization_id,created_by
)
insert into public.payment_term_installment(organization_id,payment_term_id,sequence,percentage,due_days,created_by,updated_by)
select organization_id,id,1,100,0,created_by,created_by from terms;

insert into public.payment_method(organization_id,code,name,kind,is_default,created_by,updated_by)
select o.id,'DINHEIRO','Dinheiro','cash',true,m.user_id,m.user_id
from public.organization o join lateral (select user_id from public.membership where organization_id=o.id and status='active' and role='owner' order by created_at limit 1) m on true
where not exists(select 1 from public.payment_method p where p.organization_id=o.id and p.status='active')
on conflict (organization_id, upper(code)) do nothing;

alter table public.seller enable row level security;
alter table public.seller_history enable row level security;
alter table public.payment_method enable row level security;
alter table public.payment_method_history enable row level security;
create policy seller_management_read on public.seller for select to authenticated using(public.commercial_has_permission(organization_id,'sellers.manage'));
create policy seller_history_management_read on public.seller_history for select to authenticated using(public.commercial_has_permission(organization_id,'sellers.manage'));
create policy payment_method_read on public.payment_method for select to authenticated using(public.commercial_has_permission(organization_id,'payment_methods.read'));
create policy payment_method_history_read on public.payment_method_history for select to authenticated using(public.commercial_has_permission(organization_id,'payment_methods.manage'));

create or replace function public.create_sales_order_with_commercial_context(p_org uuid,p_customer uuid,p_currency text,p_notes text,p_items jsonb,p_branch uuid default null,p_payment_term uuid default null,p_seller uuid default null,p_payment_method uuid default null,p_quotation uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_seller_snapshot jsonb; v_method_snapshot jsonb;
begin
  v_seller_snapshot:=public.commercial_validate_seller(p_org,p_seller);
  v_method_snapshot:=public.commercial_validate_payment_method(p_org,p_payment_method);
  v_id:=public.create_sales_order_with_context(p_org,p_customer,p_currency,p_notes,p_items,p_branch,p_payment_term,p_quotation);
  update public.sales_order set seller_id=p_seller,seller_snapshot=v_seller_snapshot,payment_method_id=p_payment_method,payment_method_snapshot=v_method_snapshot,updated_by=auth.uid() where id=v_id and organization_id=p_org;
  return v_id;
end $$;

create or replace function public.update_sales_order_with_commercial_context(p_org uuid,p_id uuid,p_currency text,p_notes text,p_items jsonb,p_branch uuid default null,p_payment_term uuid default null,p_seller uuid default null,p_payment_method uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_seller_snapshot jsonb; v_method_snapshot jsonb;
begin
  v_seller_snapshot:=public.commercial_validate_seller(p_org,p_seller);
  v_method_snapshot:=public.commercial_validate_payment_method(p_org,p_payment_method);
  v_id:=public.update_sales_order_with_context(p_org,p_id,p_currency,p_notes,p_items,p_branch,p_payment_term);
  update public.sales_order set seller_id=p_seller,seller_snapshot=v_seller_snapshot,payment_method_id=p_payment_method,payment_method_snapshot=v_method_snapshot,updated_by=auth.uid() where id=v_id and organization_id=p_org;
  return v_id;
end $$;

grant execute on function public.create_seller(uuid,uuid,uuid,text,text,numeric,numeric,numeric,numeric), public.archive_seller(uuid,uuid), public.list_sellers(uuid), public.list_sellers_for_management(uuid), public.list_seller_members(uuid), public.create_payment_method(uuid,text,text,text,boolean), public.list_payment_methods(uuid), public.create_sales_order_with_commercial_context(uuid,uuid,text,text,jsonb,uuid,uuid,uuid,uuid,uuid), public.update_sales_order_with_commercial_context(uuid,uuid,text,text,jsonb,uuid,uuid,uuid,uuid) to authenticated;
