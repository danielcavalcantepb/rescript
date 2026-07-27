-- Payments for Accounts Payable. Confirm/reverse are atomic and idempotent.

alter table public.accounts_payable drop constraint if exists accounts_payable_status_check;
alter table public.accounts_payable add constraint accounts_payable_status_check
  check (status in ('draft', 'approved', 'partially_paid', 'paid', 'cancelled', 'archived'));
alter table public.accounts_payable drop constraint if exists accounts_payable_previous_status_check;
alter table public.accounts_payable add constraint accounts_payable_previous_status_check
  check (previous_status is null or previous_status in ('draft','approved','partially_paid','paid','cancelled'));

alter table public.payable_installment drop constraint if exists payable_installment_status_check;
alter table public.payable_installment add constraint payable_installment_status_check
  check (status in ('open', 'partially_paid', 'paid', 'cancelled'));

create table public.financial_account (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 160),
  type text not null check (type in ('bank', 'cash', 'other')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  unique (organization_id, name)
);

create trigger financial_account_set_updated_at before update on public.financial_account
for each row execute function public.set_updated_at();

create table public.payment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  supplier_id uuid not null references public.supplier(id) on delete restrict,
  supplier_legal_name text not null,
  financial_account_id uuid not null references public.financial_account(id) on delete restrict,
  financial_account_name text not null,
  method text not null check (method in ('cash','bank_transfer','pix_manual','boleto_manual','card_manual','other')),
  status text not null default 'draft' check (status in ('draft','confirmed','reversed','archived')),
  gross_amount numeric(18,4) not null check (gross_amount >= 0),
  discount_amount numeric(18,4) not null default 0 check (discount_amount >= 0),
  interest_amount numeric(18,4) not null default 0 check (interest_amount >= 0),
  penalty_amount numeric(18,4) not null default 0 check (penalty_amount >= 0),
  fee_amount numeric(18,4) not null default 0 check (fee_amount >= 0),
  net_amount numeric(18,4) generated always as
    (gross_amount - discount_amount + interest_amount + penalty_amount + fee_amount) stored,
  paid_at date not null,
  confirmed_at timestamptz,
  reversed_at timestamptz,
  archived_at timestamptz,
  external_reference text check (external_reference is null or char_length(external_reference) <= 200),
  notes text check (notes is null or char_length(notes) <= 4000),
  reversal_reason text,
  reverses_payment_id uuid references public.payment(id) on delete restrict,
  confirmation_idempotency_key text,
  reversal_idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  check (net_amount > 0),
  check ((status = 'confirmed' and confirmed_at is not null) or status <> 'confirmed'),
  check ((status = 'reversed' and reversed_at is not null) or status <> 'reversed'),
  unique (organization_id, confirmation_idempotency_key),
  unique (organization_id, reversal_idempotency_key)
);

create unique index payment_single_reversal_idx on public.payment(reverses_payment_id)
  where reverses_payment_id is not null;
create index payment_org_paid_idx on public.payment(organization_id, paid_at desc, id desc);
create index payment_org_supplier_idx on public.payment(organization_id, supplier_id);
create index payment_org_account_idx on public.payment(organization_id, financial_account_id);
create index payment_org_status_idx on public.payment(organization_id, status);

create trigger payment_set_updated_at before update on public.payment
for each row execute function public.set_updated_at();

create table public.payment_allocation (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  payment_id uuid not null references public.payment(id) on delete restrict,
  payable_installment_id uuid not null references public.payable_installment(id) on delete restrict,
  accounts_payable_id uuid not null references public.accounts_payable(id) on delete restrict,
  amount numeric(18,4) not null check (amount > 0),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  unique(payment_id, payable_installment_id)
);
create index payment_allocation_org_installment_idx
  on public.payment_allocation(organization_id, payable_installment_id);

create table public.payment_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  payment_id uuid not null references public.payment(id) on delete restrict,
  action text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  actor_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index payment_history_org_payment_idx
  on public.payment_history(organization_id, payment_id, created_at desc);

create or replace function public.deny_payment_history_mutation() returns trigger
language plpgsql set search_path=public as $$
begin raise exception 'payment_history_immutable' using errcode='42501'; end $$;
create trigger payment_history_no_update before update on public.payment_history
for each row execute function public.deny_payment_history_mutation();
create trigger payment_history_no_delete before delete on public.payment_history
for each row execute function public.deny_payment_history_mutation();

create table public.payment_search (
  payment_id uuid primary key references public.payment(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete restrict,
  supplier_id uuid not null,
  supplier_legal_name text not null,
  financial_account_id uuid not null,
  financial_account_name text not null,
  method text not null,
  status text not null,
  net_amount numeric(18,4) not null,
  paid_at date not null,
  external_reference text,
  search_text text not null default '',
  updated_at timestamptz not null default now()
);
create index payment_search_filters_idx on public.payment_search
  (organization_id, status, paid_at desc);
create index payment_search_text_idx on public.payment_search
  using gin(to_tsvector('simple', search_text));

create or replace function public.refresh_payment_search(p_payment_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  insert into payment_search(payment_id, organization_id, supplier_id, supplier_legal_name,
    financial_account_id, financial_account_name, method, status, net_amount, paid_at,
    external_reference, search_text)
  select id, organization_id, supplier_id, supplier_legal_name, financial_account_id,
    financial_account_name, method, status, net_amount, paid_at, external_reference,
    lower(concat_ws(' ', supplier_legal_name, financial_account_name, external_reference))
  from payment where id=p_payment_id
  on conflict(payment_id) do update set
    status=excluded.status, net_amount=excluded.net_amount, paid_at=excluded.paid_at,
    financial_account_name=excluded.financial_account_name,
    external_reference=excluded.external_reference, search_text=excluded.search_text,
    updated_at=now();
end $$;

create or replace function public.trg_refresh_payment_search() returns trigger
language plpgsql security definer set search_path=public as $$
begin perform public.refresh_payment_search(coalesce(new.id,old.id)); return coalesce(new,old); end $$;
create trigger payment_search_refresh after insert or update on public.payment
for each row execute function public.trg_refresh_payment_search();

create or replace function public.can_manage_payments(p_organization_id uuid) returns boolean
language sql security definer set search_path=public stable as $$
  select exists(select 1 from membership where organization_id=p_organization_id
    and user_id=auth.uid() and status='active' and role in ('owner','admin','manager','finance'));
$$;

create or replace function public.create_payment(
  p_organization_id uuid, p_financial_account_id uuid, p_method text, p_paid_at date,
  p_gross_amount numeric, p_discount_amount numeric, p_interest_amount numeric,
  p_penalty_amount numeric, p_fee_amount numeric, p_allocations jsonb,
  p_external_reference text default null, p_notes text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid:=gen_random_uuid(); v_supplier uuid; v_supplier_name text; v_account text;
  v_sum numeric; v_net numeric; v_count int;
begin
  if auth.uid() is null or not public.can_manage_payments(p_organization_id) then
    raise exception 'not_org_member' using errcode='42501'; end if;
  if least(p_gross_amount,p_discount_amount,p_interest_amount,p_penalty_amount,p_fee_amount)<0 then
    raise exception 'negative_amount'; end if;
  v_net:=p_gross_amount-p_discount_amount+p_interest_amount+p_penalty_amount+p_fee_amount;
  if v_net<=0 then raise exception 'invalid_net_amount'; end if;
  select name into v_account from financial_account
    where id=p_financial_account_id and organization_id=p_organization_id and active for share;
  if not found then raise exception 'financial_account_not_found'; end if;
  select count(*), sum((x->>'amount')::numeric), min(ap.supplier_id::text)::uuid, min(ap.supplier_legal_name)
    into v_count,v_sum,v_supplier,v_supplier_name
  from jsonb_array_elements(p_allocations) x
  join payable_installment pi on pi.id=(x->>'installmentId')::uuid
    and pi.organization_id=p_organization_id
  join accounts_payable ap on ap.id=pi.accounts_payable_id and ap.organization_id=p_organization_id
  where (x->>'amount')::numeric>0 and pi.status in ('open','partially_paid')
    and ap.status in ('approved','partially_paid');
  if v_count<>jsonb_array_length(p_allocations) or v_count=0 then raise exception 'invalid_allocation'; end if;
  if exists(select 1 from jsonb_array_elements(p_allocations) x
    join payable_installment pi on pi.id=(x->>'installmentId')::uuid
    join accounts_payable ap on ap.id=pi.accounts_payable_id
    where ap.supplier_id<>v_supplier or (x->>'amount')::numeric>pi.open_balance)
    then raise exception 'allocation_exceeds_balance_or_mixed_supplier'; end if;
  if round(v_sum,4)<>round(v_net,4) then raise exception 'allocation_total_mismatch'; end if;
  insert into payment(id,organization_id,supplier_id,supplier_legal_name,financial_account_id,
    financial_account_name,method,gross_amount,discount_amount,interest_amount,penalty_amount,
    fee_amount,paid_at,external_reference,notes,created_by,updated_by)
  values(v_id,p_organization_id,v_supplier,v_supplier_name,p_financial_account_id,v_account,p_method,
    p_gross_amount,p_discount_amount,p_interest_amount,p_penalty_amount,p_fee_amount,p_paid_at,
    nullif(trim(p_external_reference),''),nullif(trim(p_notes),''),auth.uid(),auth.uid());
  insert into payment_allocation(organization_id,payment_id,payable_installment_id,accounts_payable_id,amount,created_by)
  select p_organization_id,v_id,pi.id,pi.accounts_payable_id,(x->>'amount')::numeric,auth.uid()
  from jsonb_array_elements(p_allocations) x join payable_installment pi on pi.id=(x->>'installmentId')::uuid;
  insert into payment_history(organization_id,payment_id,action,actor_user_id)
    values(p_organization_id,v_id,'PaymentCreated',auth.uid());
  return v_id;
end $$;

create or replace function public.confirm_payment(p_organization_id uuid,p_payment_id uuid,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path=public as $$
declare p payment%rowtype; a record; v_existing uuid;
begin
  if auth.uid() is null or not public.can_manage_payments(p_organization_id) then raise exception 'permission_denied' using errcode='42501'; end if;
  select * into p from payment where id=p_payment_id and organization_id=p_organization_id for update;
  if not found then raise exception 'payment_not_found'; end if;
  if p.confirmation_idempotency_key=p_idempotency_key and p_idempotency_key is not null then return p.id; end if;
  if p.status<>'draft' then raise exception 'payment_not_draft'; end if;
  if p_idempotency_key is null or trim(p_idempotency_key)='' then raise exception 'idempotency_key_required'; end if;
  for a in select pa.*,pi.open_balance from payment_allocation pa join payable_installment pi
    on pi.id=pa.payable_installment_id where pa.payment_id=p.id order by pa.payable_installment_id for update of pi
  loop
    if a.amount>a.open_balance then raise exception 'allocation_exceeds_balance'; end if;
    update payable_installment set open_balance=open_balance-a.amount,
      status=case when open_balance-a.amount=0 then 'paid' else 'partially_paid' end,
      updated_by=auth.uid() where id=a.payable_installment_id;
    insert into payment_history(organization_id,payment_id,action,metadata,actor_user_id)
      values(p_organization_id,p.id,case when a.open_balance-a.amount=0 then 'PayableInstallmentPaid' else 'PayableInstallmentPartiallyPaid' end,
      jsonb_build_object('installmentId',a.payable_installment_id,'amount',a.amount),auth.uid());
    update accounts_payable ap set open_balance=(select coalesce(sum(open_balance),0) from payable_installment where accounts_payable_id=ap.id),
      status=case when (select coalesce(sum(open_balance),0) from payable_installment where accounts_payable_id=ap.id)=0 then 'paid' else 'partially_paid' end,
      updated_by=auth.uid() where id=a.accounts_payable_id;
  end loop;
  update payment set status='confirmed',confirmed_at=now(),confirmation_idempotency_key=p_idempotency_key,updated_by=auth.uid() where id=p.id;
  insert into payment_history(organization_id,payment_id,action,actor_user_id) values(p_organization_id,p.id,'PaymentConfirmed',auth.uid());
  insert into payment_history(organization_id,payment_id,action,metadata,actor_user_id)
    select p_organization_id,p.id,'PaymentAllocated',jsonb_build_object('installmentId',payable_installment_id,'amount',amount),auth.uid()
    from payment_allocation where payment_id=p.id;
  return p.id;
exception when unique_violation then
  select id into v_existing from payment where organization_id=p_organization_id and confirmation_idempotency_key=p_idempotency_key;
  if v_existing=p.id then return v_existing; end if;
  raise exception 'idempotency_key_conflict';
end $$;

create or replace function public.reverse_payment(p_organization_id uuid,p_payment_id uuid,p_reason text,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path=public as $$
declare p payment%rowtype; r_id uuid:=gen_random_uuid(); a record;
begin
  if auth.uid() is null or not public.can_manage_payments(p_organization_id) then raise exception 'permission_denied' using errcode='42501'; end if;
  select * into p from payment where id=p_payment_id and organization_id=p_organization_id for update;
  if not found then raise exception 'payment_not_found'; end if;
  select id into r_id from payment where organization_id=p_organization_id and reversal_idempotency_key=p_idempotency_key;
  if found then return r_id; end if;
  if p.status<>'confirmed' then raise exception 'payment_not_confirmed'; end if;
  if trim(coalesce(p_reason,''))='' or trim(coalesce(p_idempotency_key,''))='' then raise exception 'reason_and_idempotency_required'; end if;
  r_id:=gen_random_uuid();
  insert into payment(id,organization_id,supplier_id,supplier_legal_name,financial_account_id,financial_account_name,
    method,status,gross_amount,discount_amount,interest_amount,penalty_amount,fee_amount,paid_at,confirmed_at,reversed_at,
    external_reference,notes,reversal_reason,reverses_payment_id,reversal_idempotency_key,created_by,updated_by)
  values(r_id,p.organization_id,p.supplier_id,p.supplier_legal_name,p.financial_account_id,p.financial_account_name,
    p.method,'reversed',p.gross_amount,p.discount_amount,p.interest_amount,p.penalty_amount,p.fee_amount,current_date,now(),now(),
    p.external_reference,p.notes,p_reason,p.id,p_idempotency_key,auth.uid(),auth.uid());
  for a in select * from payment_allocation where payment_id=p.id order by payable_installment_id loop
    perform 1 from payable_installment where id=a.payable_installment_id for update;
    update payable_installment set open_balance=open_balance+a.amount,
      status=case when open_balance+a.amount=amount then 'open' else 'partially_paid' end,updated_by=auth.uid()
      where id=a.payable_installment_id;
    update accounts_payable ap set open_balance=(select sum(open_balance) from payable_installment where accounts_payable_id=ap.id),
      status=case when (select sum(open_balance) from payable_installment where accounts_payable_id=ap.id)=original_amount then 'approved' else 'partially_paid' end,
      updated_by=auth.uid() where id=a.accounts_payable_id;
  end loop;
  update payment set status='reversed',reversed_at=now(),updated_by=auth.uid() where id=p.id;
  insert into payment_history(organization_id,payment_id,action,reason,metadata,actor_user_id)
    values(p_organization_id,p.id,'PaymentReversed',p_reason,jsonb_build_object('reversalPaymentId',r_id),auth.uid()),
          (p_organization_id,r_id,'PaymentCreated',p_reason,jsonb_build_object('reversesPaymentId',p.id),auth.uid());
  return r_id;
end $$;

create or replace function public.archive_payment(p_organization_id uuid,p_payment_id uuid) returns uuid
language plpgsql security definer set search_path=public as $$
begin
  if not public.can_manage_payments(p_organization_id) then raise exception 'permission_denied' using errcode='42501'; end if;
  update payment set status='archived',archived_at=now(),updated_by=auth.uid()
    where id=p_payment_id and organization_id=p_organization_id and status in ('draft','reversed');
  if not found then raise exception 'payment_not_archivable'; end if;
  insert into payment_history(organization_id,payment_id,action,actor_user_id)
    values(p_organization_id,p_payment_id,'PaymentArchived',auth.uid()); return p_payment_id;
end $$;

create or replace function public.list_financial_accounts(p_organization_id uuid)
returns setof public.financial_account language sql security definer set search_path=public stable as $$
  select * from financial_account where organization_id=p_organization_id and active
    and public.is_org_member(p_organization_id) order by name;
$$;

create or replace function public.create_financial_account(p_organization_id uuid,p_name text,p_type text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if auth.uid() is null or not public.can_manage_payments(p_organization_id) then raise exception 'permission_denied' using errcode='42501'; end if;
  insert into financial_account(organization_id,name,type,created_by,updated_by)
  values(p_organization_id,trim(p_name),p_type,auth.uid(),auth.uid()) returning id into v_id;
  return v_id;
end $$;

create or replace function public.get_payment(p_organization_id uuid,p_payment_id uuid)
returns jsonb language sql security definer set search_path=public stable as $$
  select jsonb_build_object(
    'payment',to_jsonb(p),
    'allocations',coalesce((select jsonb_agg(jsonb_build_object(
      'id',a.id,'payable_installment_id',a.payable_installment_id,
      'accounts_payable_id',a.accounts_payable_id,'amount',a.amount,
      'installment_sequence',pi.sequence,'payable_number',ap.number
    ) order by a.created_at) from payment_allocation a
      join payable_installment pi on pi.id=a.payable_installment_id
      join accounts_payable ap on ap.id=a.accounts_payable_id
      where a.payment_id=p.id),'[]'::jsonb),
    'history',coalesce((select jsonb_agg(to_jsonb(h) order by h.created_at desc) from payment_history h where h.payment_id=p.id),'[]'::jsonb)
  ) from payment p where p.organization_id=p_organization_id and p.id=p_payment_id
    and public.is_org_member(p_organization_id);
$$;

create or replace function public.list_payments(
  p_organization_id uuid,p_query text default null,p_supplier_id uuid default null,
  p_financial_account_id uuid default null,p_method text default null,p_status text default null,
  p_from date default null,p_to date default null,p_limit integer default 50
) returns setof public.payment_search language sql security definer set search_path=public stable as $$
  select * from payment_search s where s.organization_id=p_organization_id
    and public.is_org_member(p_organization_id)
    and (p_supplier_id is null or s.supplier_id=p_supplier_id)
    and (p_financial_account_id is null or s.financial_account_id=p_financial_account_id)
    and (p_method is null or s.method=p_method) and (p_status is null or s.status=p_status)
    and (p_from is null or s.paid_at>=p_from) and (p_to is null or s.paid_at<=p_to)
    and (nullif(trim(p_query),'') is null or s.search_text like '%'||lower(trim(p_query))||'%')
  order by s.paid_at desc,s.payment_id desc limit least(greatest(p_limit,1),100);
$$;

alter table public.financial_account enable row level security;
alter table public.payment enable row level security;
alter table public.payment_allocation enable row level security;
alter table public.payment_history enable row level security;
alter table public.payment_search enable row level security;

create policy financial_account_member on public.financial_account for select to authenticated using(public.is_org_member(organization_id));
create policy financial_account_write on public.financial_account for all to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id) and created_by=auth.uid() and updated_by=auth.uid());
create policy payment_member on public.payment for select to authenticated using(public.is_org_member(organization_id));
create policy allocation_member on public.payment_allocation for select to authenticated using(public.is_org_member(organization_id));
create policy payment_history_member on public.payment_history for select to authenticated using(public.is_org_member(organization_id));
create policy payment_search_member on public.payment_search for select to authenticated using(public.is_org_member(organization_id));

grant select,insert,update on public.financial_account to authenticated;
grant select on public.payment,public.payment_allocation,public.payment_history,public.payment_search to authenticated;
grant execute on function public.create_payment(uuid,uuid,text,date,numeric,numeric,numeric,numeric,numeric,jsonb,text,text) to authenticated;
grant execute on function public.confirm_payment(uuid,uuid,text) to authenticated;
grant execute on function public.reverse_payment(uuid,uuid,text,text) to authenticated;
grant execute on function public.archive_payment(uuid,uuid) to authenticated;
grant execute on function public.list_financial_accounts(uuid) to authenticated;
grant execute on function public.create_financial_account(uuid,text,text) to authenticated;
grant execute on function public.get_payment(uuid,uuid) to authenticated;
grant execute on function public.list_payments(uuid,text,uuid,uuid,text,text,date,date,integer) to authenticated;
