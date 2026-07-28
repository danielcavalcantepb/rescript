-- Fundamental domain contracts: Branch, Payment Terms and Inventory Policy.
-- These aggregates are organization-scoped and intentionally do not change Sales,
-- Inventory, Finance, Purchasing or their operational effects.

create table if not exists public.branch (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  code text not null check (char_length(trim(code)) between 1 and 32),
  name text not null check (char_length(trim(name)) between 1 and 160),
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
create unique index if not exists branch_org_code_uidx on public.branch(organization_id, upper(code));
create unique index if not exists branch_org_default_uidx on public.branch(organization_id) where is_default and status = 'active';
create index if not exists branch_org_status_idx on public.branch(organization_id, status, name);

create table if not exists public.branch_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  branch_id uuid not null references public.branch(id) on delete restrict,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  actor_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists branch_history_idx on public.branch_history(organization_id, branch_id, created_at desc);

create table if not exists public.payment_term (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  code text not null check (char_length(trim(code)) between 1 and 40),
  name text not null check (char_length(trim(name)) between 1 and 160),
  kind text not null check (kind in ('single', 'installment', 'down_payment', 'immediate', 'custom')),
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
create unique index if not exists payment_term_org_code_uidx on public.payment_term(organization_id, upper(code));
create unique index if not exists payment_term_org_default_uidx on public.payment_term(organization_id) where is_default and status = 'active';
create index if not exists payment_term_org_status_idx on public.payment_term(organization_id, status, name);

create table if not exists public.payment_term_installment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  payment_term_id uuid not null references public.payment_term(id) on delete restrict,
  sequence integer not null check (sequence > 0),
  percentage numeric(9,6) not null check (percentage > 0 and percentage <= 100),
  due_days integer not null check (due_days >= 0 and due_days <= 36500),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  unique(payment_term_id, sequence)
);
create index if not exists payment_term_installment_org_term_idx on public.payment_term_installment(organization_id, payment_term_id, sequence);

create table if not exists public.payment_term_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  payment_term_id uuid not null references public.payment_term(id) on delete restrict,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  actor_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists payment_term_history_idx on public.payment_term_history(organization_id, payment_term_id, created_at desc);

create table if not exists public.inventory_policy (
  organization_id uuid primary key references public.organization(id) on delete restrict,
  allow_negative_stock boolean not null default false,
  automatic_reservation boolean not null default true,
  automatic_stock_decrease boolean not null default false,
  allow_confirmation_without_stock boolean not null default false,
  allow_partial_reservation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  check (not allow_negative_stock or allow_confirmation_without_stock)
);

create table if not exists public.inventory_policy_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  action text not null,
  before_state jsonb,
  after_state jsonb not null,
  actor_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists inventory_policy_history_idx on public.inventory_policy_history(organization_id, created_at desc);

create trigger branch_set_updated_at before update on public.branch for each row execute function public.set_updated_at();
create trigger payment_term_set_updated_at before update on public.payment_term for each row execute function public.set_updated_at();
create trigger payment_term_installment_set_updated_at before update on public.payment_term_installment for each row execute function public.set_updated_at();
create trigger inventory_policy_set_updated_at before update on public.inventory_policy for each row execute function public.set_updated_at();

create or replace function public.fundamental_has_permission(p_org uuid, p_permission text)
returns boolean language plpgsql security definer set search_path = public stable as $$
declare v_role text;
begin
  if auth.uid() is null then return false; end if;
  select role into v_role from public.membership where organization_id = p_org and user_id = auth.uid() and status = 'active';
  if v_role in ('owner', 'admin') then return true; end if;
  if p_permission in ('branches.read', 'payment_terms.read', 'inventory.policy.read') then return v_role in ('manager', 'seller', 'inventory', 'finance', 'viewer'); end if;
  if p_permission in ('branches.manage', 'payment_terms.manage', 'inventory.policy.manage') then return v_role = 'manager'; end if;
  return false;
end $$;

create or replace function public.fundamental_require_permission(p_org uuid, p_permission text)
returns void language plpgsql security definer set search_path = public stable as $$
begin
  if not public.fundamental_has_permission(p_org, p_permission) then raise exception 'permission_denied' using errcode = '42501'; end if;
end $$;

create or replace function public.fundamental_record_audit(p_org uuid, p_type text, p_id uuid, p_action text, p_before jsonb default null, p_after jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_event(organization_id, actor_user_id, aggregate_type, aggregate_id, action, before_state, after_state)
  values (p_org, auth.uid(), p_type, p_id, p_action, p_before, p_after);
end $$;

create or replace function public.ensure_default_branch(p_org uuid, p_actor uuid default auth.uid())
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.branch where organization_id = p_org and is_default and status = 'active';
  if v_id is not null then return v_id; end if;
  if p_actor is null then return null; end if;
  insert into public.branch(organization_id, code, name, is_default, created_by, updated_by)
  values(p_org, 'DEFAULT', 'Principal', true, p_actor, p_actor)
  on conflict (organization_id, upper(code)) do update set is_default = true, status = 'active', archived_at = null, archived_by = null, updated_by = excluded.updated_by
  returning id into v_id;
  return v_id;
end $$;

-- Existing organizations receive one active default branch. The owner is used as the actor;
-- organizations without an active owner are intentionally left untouched and are rejected by commands.
insert into public.branch(organization_id, code, name, is_default, created_by, updated_by)
select o.id, 'DEFAULT', 'Principal', true, m.user_id, m.user_id
from public.organization o
join lateral (select user_id from public.membership where organization_id = o.id and status = 'active' and role = 'owner' order by created_at limit 1) m on true
where not exists (select 1 from public.branch b where b.organization_id = o.id and b.is_default and b.status = 'active')
on conflict (organization_id, upper(code)) do nothing;

create or replace function public.trg_membership_default_branch()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' and new.role = 'owner' then
    perform public.ensure_default_branch(new.organization_id, new.user_id);
  end if;
  return new;
end $$;
create trigger membership_default_branch after insert on public.membership for each row execute function public.trg_membership_default_branch();

create or replace function public.create_branch(p_org uuid, p_code text, p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid := gen_random_uuid(); v_make_default boolean;
begin
  perform public.fundamental_require_permission(p_org, 'branches.manage');
  select not exists(select 1 from public.branch where organization_id = p_org and status = 'active') into v_make_default;
  insert into public.branch(id, organization_id, code, name, is_default, created_by, updated_by)
  values(v_id, p_org, upper(trim(p_code)), trim(p_name), v_make_default, auth.uid(), auth.uid());
  insert into public.branch_history(organization_id, branch_id, action, details, actor_user_id) values(p_org, v_id, 'BranchCreated', jsonb_build_object('code', upper(trim(p_code)), 'name', trim(p_name)), auth.uid());
  perform public.fundamental_record_audit(p_org, 'Branch', v_id, 'BranchCreated', null, jsonb_build_object('code', upper(trim(p_code)), 'name', trim(p_name)));
  return v_id;
end $$;

create or replace function public.update_branch(p_org uuid, p_branch uuid, p_code text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_before jsonb; v_after jsonb;
begin
  perform public.fundamental_require_permission(p_org, 'branches.manage');
  select to_jsonb(b) into v_before from public.branch b where id = p_branch and organization_id = p_org and status = 'active' for update;
  if v_before is null then raise exception 'branch_not_found' using errcode = 'P0002'; end if;
  update public.branch set code = upper(trim(p_code)), name = trim(p_name), updated_by = auth.uid() where id = p_branch;
  select to_jsonb(b) into v_after from public.branch b where b.id = p_branch;
  insert into public.branch_history(organization_id, branch_id, action, details, actor_user_id) values(p_org, p_branch, 'BranchUpdated', v_after, auth.uid());
  perform public.fundamental_record_audit(p_org, 'Branch', p_branch, 'BranchUpdated', v_before, v_after);
end $$;

create or replace function public.set_default_branch(p_org uuid, p_branch uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.fundamental_require_permission(p_org, 'branches.manage');
  if not exists(select 1 from public.branch where id = p_branch and organization_id = p_org and status = 'active' for update) then raise exception 'branch_not_found' using errcode = 'P0002'; end if;
  update public.branch set is_default = false, updated_by = auth.uid() where organization_id = p_org and is_default;
  update public.branch set is_default = true, updated_by = auth.uid() where id = p_branch;
  insert into public.branch_history(organization_id, branch_id, action, details, actor_user_id) values(p_org, p_branch, 'BranchDefaulted', '{}'::jsonb, auth.uid());
  perform public.fundamental_record_audit(p_org, 'Branch', p_branch, 'BranchDefaulted');
end $$;

create or replace function public.archive_branch(p_org uuid, p_branch uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_default boolean;
begin
  perform public.fundamental_require_permission(p_org, 'branches.manage');
  select is_default into v_default from public.branch where id = p_branch and organization_id = p_org and status = 'active' for update;
  if not found then raise exception 'branch_not_found' using errcode = 'P0002'; end if;
  if v_default then raise exception 'default_branch_cannot_be_archived' using errcode = '22023'; end if;
  update public.branch set status = 'archived', is_default = false, archived_at = now(), archived_by = auth.uid(), updated_by = auth.uid() where id = p_branch;
  insert into public.branch_history(organization_id, branch_id, action, actor_user_id) values(p_org, p_branch, 'BranchArchived', auth.uid());
  perform public.fundamental_record_audit(p_org, 'Branch', p_branch, 'BranchArchived');
end $$;

create or replace function public.create_payment_term(p_org uuid, p_code text, p_name text, p_kind text, p_installments jsonb, p_is_default boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid := gen_random_uuid(); v_sum numeric; v_count integer; v_immediate integer;
begin
  perform public.fundamental_require_permission(p_org, 'payment_terms.manage');
  if p_kind not in ('single', 'installment', 'down_payment', 'immediate', 'custom') or jsonb_typeof(p_installments) <> 'array' or jsonb_array_length(p_installments) = 0 then raise exception 'invalid_payment_term' using errcode = '22023'; end if;
  select sum((x.value->>'percentage')::numeric), count(*), count(*) filter(where coalesce((x.value->>'dueDays')::integer, -1) = 0) into v_sum, v_count, v_immediate from jsonb_array_elements(p_installments) as x(value);
  if round(coalesce(v_sum, 0), 6) <> 100 or v_count <> jsonb_array_length(p_installments) then raise exception 'payment_term_percentage_mismatch' using errcode = '22023'; end if;
  if p_kind = 'single' and v_count <> 1 then raise exception 'single_payment_term_requires_one_installment' using errcode = '22023'; end if;
  if p_kind = 'immediate' and (v_count <> 1 or v_immediate <> 1) then raise exception 'immediate_payment_term_requires_due_day_zero' using errcode = '22023'; end if;
  if p_is_default then update public.payment_term set is_default = false, updated_by = auth.uid() where organization_id = p_org and is_default; end if;
  insert into public.payment_term(id, organization_id, code, name, kind, is_default, created_by, updated_by) values(v_id, p_org, upper(trim(p_code)), trim(p_name), p_kind, p_is_default, auth.uid(), auth.uid());
  insert into public.payment_term_installment(organization_id, payment_term_id, sequence, percentage, due_days, created_by, updated_by)
  select p_org, v_id, x.ordinality, (x.value->>'percentage')::numeric, (x.value->>'dueDays')::integer, auth.uid(), auth.uid() from jsonb_array_elements(p_installments) with ordinality as x(value, ordinality);
  insert into public.payment_term_history(organization_id, payment_term_id, action, details, actor_user_id) values(p_org, v_id, 'PaymentTermCreated', jsonb_build_object('kind', p_kind, 'installmentCount', v_count), auth.uid());
  perform public.fundamental_record_audit(p_org, 'PaymentTerm', v_id, 'PaymentTermCreated', null, jsonb_build_object('kind', p_kind, 'installmentCount', v_count));
  return v_id;
end $$;

create or replace function public.archive_payment_term(p_org uuid, p_term uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_before jsonb;
begin
  perform public.fundamental_require_permission(p_org, 'payment_terms.manage');
  select to_jsonb(t) into v_before from public.payment_term t where id = p_term and organization_id = p_org and status = 'active' for update;
  if v_before is null then raise exception 'payment_term_not_found' using errcode = 'P0002'; end if;
  if coalesce((v_before->>'is_default')::boolean, false) then raise exception 'default_payment_term_cannot_be_archived' using errcode = '22023'; end if;
  update public.payment_term set status = 'archived', is_default = false, archived_at = now(), archived_by = auth.uid(), updated_by = auth.uid() where id = p_term;
  update public.payment_term_installment set status = 'archived', updated_by = auth.uid() where payment_term_id = p_term;
  insert into public.payment_term_history(organization_id, payment_term_id, action, actor_user_id) values(p_org, p_term, 'PaymentTermArchived', auth.uid());
  perform public.fundamental_record_audit(p_org, 'PaymentTerm', p_term, 'PaymentTermArchived', v_before, null);
end $$;

create or replace function public.update_payment_term(p_org uuid, p_term uuid, p_code text, p_name text, p_kind text, p_installments jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_before jsonb; v_sum numeric; v_count integer; v_immediate integer;
begin
  perform public.fundamental_require_permission(p_org, 'payment_terms.manage');
  select to_jsonb(t) into v_before from public.payment_term t where id = p_term and organization_id = p_org and status = 'active' for update;
  if v_before is null then raise exception 'payment_term_not_found' using errcode = 'P0002'; end if;
  if p_kind not in ('single', 'installment', 'down_payment', 'immediate', 'custom') or jsonb_typeof(p_installments) <> 'array' or jsonb_array_length(p_installments) = 0 then raise exception 'invalid_payment_term' using errcode = '22023'; end if;
  select sum((x.value->>'percentage')::numeric), count(*), count(*) filter(where coalesce((x.value->>'dueDays')::integer, -1) = 0) into v_sum, v_count, v_immediate from jsonb_array_elements(p_installments) as x(value);
  if round(coalesce(v_sum, 0), 6) <> 100 or v_count <> jsonb_array_length(p_installments) then raise exception 'payment_term_percentage_mismatch' using errcode = '22023'; end if;
  if p_kind = 'single' and v_count <> 1 then raise exception 'single_payment_term_requires_one_installment' using errcode = '22023'; end if;
  if p_kind = 'immediate' and (v_count <> 1 or v_immediate <> 1) then raise exception 'immediate_payment_term_requires_due_day_zero' using errcode = '22023'; end if;
  update public.payment_term set code = upper(trim(p_code)), name = trim(p_name), kind = p_kind, updated_by = auth.uid() where id = p_term;
  delete from public.payment_term_installment where payment_term_id = p_term and organization_id = p_org;
  insert into public.payment_term_installment(organization_id, payment_term_id, sequence, percentage, due_days, created_by, updated_by)
  select p_org, p_term, x.ordinality, (x.value->>'percentage')::numeric, (x.value->>'dueDays')::integer, auth.uid(), auth.uid() from jsonb_array_elements(p_installments) with ordinality as x(value, ordinality);
  insert into public.payment_term_history(organization_id, payment_term_id, action, details, actor_user_id) values(p_org, p_term, 'PaymentTermUpdated', jsonb_build_object('kind', p_kind, 'installmentCount', v_count), auth.uid());
  perform public.fundamental_record_audit(p_org, 'PaymentTerm', p_term, 'PaymentTermUpdated', v_before, jsonb_build_object('kind', p_kind, 'installmentCount', v_count));
end $$;

create or replace function public.resolve_payment_term(p_org uuid, p_term uuid, p_total numeric, p_issue_date date)
returns table(sequence integer, amount numeric(18,4), percentage numeric(9,6), due_date date, is_immediate boolean)
language plpgsql security definer set search_path = public stable as $$
begin
  perform public.fundamental_require_permission(p_org, 'payment_terms.read');
  if p_total <= 0 or p_issue_date is null then raise exception 'invalid_payment_schedule_input' using errcode = '22023'; end if;
  if not exists(select 1 from public.payment_term where id = p_term and organization_id = p_org and status = 'active') then raise exception 'payment_term_not_found' using errcode = 'P0002'; end if;
  return query select i.sequence, round(p_total * i.percentage / 100, 4), i.percentage, p_issue_date + i.due_days, i.due_days = 0
  from public.payment_term_installment i where i.organization_id = p_org and i.payment_term_id = p_term and i.status = 'active' order by i.sequence;
end $$;

create or replace function public.upsert_inventory_policy(p_org uuid, p_allow_negative boolean, p_auto_reservation boolean, p_auto_decrease boolean, p_allow_without_stock boolean, p_allow_partial boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_before jsonb; v_after jsonb;
begin
  perform public.fundamental_require_permission(p_org, 'inventory.policy.manage');
  select to_jsonb(p) into v_before from public.inventory_policy p where organization_id = p_org for update;
  insert into public.inventory_policy(organization_id, allow_negative_stock, automatic_reservation, automatic_stock_decrease, allow_confirmation_without_stock, allow_partial_reservation, created_by, updated_by)
  values(p_org, p_allow_negative, p_auto_reservation, p_auto_decrease, p_allow_without_stock, p_allow_partial, auth.uid(), auth.uid())
  on conflict(organization_id) do update set allow_negative_stock = excluded.allow_negative_stock, automatic_reservation = excluded.automatic_reservation, automatic_stock_decrease = excluded.automatic_stock_decrease, allow_confirmation_without_stock = excluded.allow_confirmation_without_stock, allow_partial_reservation = excluded.allow_partial_reservation, updated_by = excluded.updated_by;
  select to_jsonb(p) into v_after from public.inventory_policy p where p.organization_id = p_org;
  insert into public.inventory_policy_history(organization_id, action, before_state, after_state, actor_user_id) values(p_org, case when v_before is null then 'InventoryPolicyCreated' else 'InventoryPolicyUpdated' end, v_before, v_after, auth.uid());
  perform public.fundamental_record_audit(p_org, 'InventoryPolicy', p_org, case when v_before is null then 'InventoryPolicyCreated' else 'InventoryPolicyUpdated' end, v_before, v_after);
end $$;

create or replace function public.get_inventory_policy(p_org uuid)
returns public.inventory_policy language plpgsql security definer set search_path = public stable as $$
declare v_policy public.inventory_policy;
begin
  perform public.fundamental_require_permission(p_org, 'inventory.policy.read');
  select * into v_policy from public.inventory_policy where organization_id = p_org;
  if not found then raise exception 'inventory_policy_not_found' using errcode = 'P0002'; end if;
  return v_policy;
end $$;

-- Defaults guarantee that every organization ready to use the policy has an explicit policy.
insert into public.inventory_policy(organization_id, created_by, updated_by)
select o.id, m.user_id, m.user_id from public.organization o
join lateral (select user_id from public.membership where organization_id = o.id and status = 'active' and role = 'owner' order by created_at limit 1) m on true
on conflict(organization_id) do nothing;

create or replace function public.deny_fundamental_history_mutation()
returns trigger language plpgsql set search_path = public as $$ begin raise exception 'fundamental_history_immutable' using errcode = '42501'; end $$;
create trigger branch_history_no_update before update on public.branch_history for each row execute function public.deny_fundamental_history_mutation();
create trigger branch_history_no_delete before delete on public.branch_history for each row execute function public.deny_fundamental_history_mutation();
create trigger payment_term_history_no_update before update on public.payment_term_history for each row execute function public.deny_fundamental_history_mutation();
create trigger payment_term_history_no_delete before delete on public.payment_term_history for each row execute function public.deny_fundamental_history_mutation();
create trigger inventory_policy_history_no_update before update on public.inventory_policy_history for each row execute function public.deny_fundamental_history_mutation();
create trigger inventory_policy_history_no_delete before delete on public.inventory_policy_history for each row execute function public.deny_fundamental_history_mutation();

alter table public.branch enable row level security;
alter table public.branch_history enable row level security;
alter table public.payment_term enable row level security;
alter table public.payment_term_installment enable row level security;
alter table public.payment_term_history enable row level security;
alter table public.inventory_policy enable row level security;
alter table public.inventory_policy_history enable row level security;
create policy branch_read on public.branch for select to authenticated using(public.fundamental_has_permission(organization_id, 'branches.read'));
create policy branch_history_read on public.branch_history for select to authenticated using(public.fundamental_has_permission(organization_id, 'branches.read'));
create policy payment_term_read on public.payment_term for select to authenticated using(public.fundamental_has_permission(organization_id, 'payment_terms.read'));
create policy payment_term_installment_read on public.payment_term_installment for select to authenticated using(public.fundamental_has_permission(organization_id, 'payment_terms.read'));
create policy payment_term_history_read on public.payment_term_history for select to authenticated using(public.fundamental_has_permission(organization_id, 'payment_terms.read'));
create policy inventory_policy_read on public.inventory_policy for select to authenticated using(public.fundamental_has_permission(organization_id, 'inventory.policy.read'));
create policy inventory_policy_history_read on public.inventory_policy_history for select to authenticated using(public.fundamental_has_permission(organization_id, 'inventory.policy.read'));

create or replace function public.list_branches(p_org uuid, p_status text default 'active')
returns setof public.branch language sql security definer set search_path = public stable as $$
  select * from public.branch where organization_id = p_org and public.fundamental_has_permission(p_org, 'branches.read') and (p_status is null or status = p_status) order by is_default desc, name
$$;
create or replace function public.list_payment_terms(p_org uuid, p_status text default 'active')
returns setof public.payment_term language sql security definer set search_path = public stable as $$
  select * from public.payment_term where organization_id = p_org and public.fundamental_has_permission(p_org, 'payment_terms.read') and (p_status is null or status = p_status) order by is_default desc, name
$$;

revoke all on public.branch, public.branch_history, public.payment_term, public.payment_term_installment, public.payment_term_history, public.inventory_policy, public.inventory_policy_history from authenticated;
grant select on public.branch, public.branch_history, public.payment_term, public.payment_term_installment, public.payment_term_history, public.inventory_policy, public.inventory_policy_history to authenticated;
grant execute on function public.create_branch(uuid,text,text), public.update_branch(uuid,uuid,text,text), public.set_default_branch(uuid,uuid), public.archive_branch(uuid,uuid), public.list_branches(uuid,text), public.create_payment_term(uuid,text,text,text,jsonb,boolean), public.update_payment_term(uuid,uuid,text,text,text,jsonb), public.archive_payment_term(uuid,uuid), public.list_payment_terms(uuid,text), public.resolve_payment_term(uuid,uuid,numeric,date), public.upsert_inventory_policy(uuid,boolean,boolean,boolean,boolean,boolean), public.get_inventory_policy(uuid) to authenticated;
