-- Finance operational domain. This migration evolves the preliminary finance
-- schema without replacing its read paths or deleting historical facts.

-- Organization is the current company boundary. Keep company_id explicit for
-- finance facts while constraining it to that canonical tenant root.
alter table public.accounts_receivable add column if not exists company_id uuid references public.organization(id) on delete restrict;
alter table public.accounts_receivable add column if not exists branch_id uuid references public.branch(id) on delete restrict;
alter table public.accounts_receivable add column if not exists cancelled_at timestamptz;
alter table public.accounts_receivable add column if not exists cancelled_by uuid references auth.users(id) on delete restrict;
alter table public.accounts_receivable add column if not exists cancellation_reason text;
alter table public.accounts_payable add column if not exists company_id uuid references public.organization(id) on delete restrict;
alter table public.accounts_payable add column if not exists company_id uuid references public.organization(id) on delete restrict;
alter table public.accounts_payable add column if not exists branch_id uuid references public.branch(id) on delete restrict;
alter table public.accounts_payable add column if not exists cancelled_at timestamptz;
alter table public.accounts_payable add column if not exists cancelled_by uuid references auth.users(id) on delete restrict;
alter table public.accounts_payable add column if not exists cancellation_reason text;
alter table public.payment add column if not exists company_id uuid references public.organization(id) on delete restrict;
alter table public.payment add column if not exists branch_id uuid references public.branch(id) on delete restrict;
alter table public.payment add column if not exists cash_account_id uuid references public.cash_account(id) on delete restrict;
alter table public.payment add column if not exists payment_type text check (payment_type in ('receipt','disbursement'));
alter table public.payment add column if not exists occurred_at timestamptz;
alter table public.payment add column if not exists posted_idempotency_key text;
alter table public.payment_allocation add column if not exists company_id uuid references public.organization(id) on delete restrict;
alter table public.payment_allocation add column if not exists branch_id uuid references public.branch(id) on delete restrict;
alter table public.payment_allocation add column if not exists receivable_installment_id uuid references public.receivable_installment(id) on delete restrict;
alter table public.payment_allocation add column if not exists accounts_receivable_id uuid references public.accounts_receivable(id) on delete restrict;
alter table public.payment_allocation add column if not exists idempotency_key text;
alter table public.payment_allocation add column if not exists reversed_at timestamptz;
alter table public.cash_account add column if not exists company_id uuid references public.organization(id) on delete restrict;
alter table public.cash_account add column if not exists branch_id uuid references public.branch(id) on delete restrict;
alter table public.cash_entry add column if not exists company_id uuid references public.organization(id) on delete restrict;
alter table public.cash_entry add column if not exists branch_id uuid references public.branch(id) on delete restrict;
alter table public.cash_entry add column if not exists payment_id uuid references public.payment(id) on delete restrict;
alter table public.cash_entry add column if not exists transfer_id uuid;
alter table public.cash_entry add column if not exists reversal_of_entry_id uuid references public.cash_entry(id) on delete restrict;
alter table public.cash_entry add column if not exists correlation_id uuid;
alter table public.cash_entry add column if not exists ledger_idempotency_key text;
alter table public.cash_flow_search add column if not exists company_id uuid;
alter table public.cash_flow_search add column if not exists branch_id uuid;

-- The legacy payment table was payable-only. The operational contract also
-- supports receipts, while preserving all existing payable payment rows.
alter table public.payment alter column supplier_id drop not null;
alter table public.payment alter column supplier_legal_name drop not null;
alter table public.payment alter column financial_account_id drop not null;
alter table public.payment alter column financial_account_name drop not null;
alter table public.payment_search alter column supplier_id drop not null;
alter table public.payment_search alter column supplier_legal_name drop not null;
alter table public.payment_search alter column financial_account_id drop not null;
alter table public.payment_search alter column financial_account_name drop not null;
alter table public.payment drop constraint if exists payment_method_check;
alter table public.payment add constraint payment_method_check
  check (method in ('cash','pix','pix_manual','bank_transfer','debit_card','credit_card','card_manual','boleto','boleto_manual','other'));
alter table public.cash_entry drop constraint if exists cash_entry_origin_check;
alter table public.cash_entry add constraint cash_entry_origin_check
  check (origin in ('ACCOUNTS_RECEIVABLE','ACCOUNTS_PAYABLE','MANUAL','PAYMENT_REVERSAL','TRANSFER'));
alter table public.accounts_payable drop constraint if exists accounts_payable_previous_status_check;
alter table public.accounts_payable add constraint accounts_payable_previous_status_check
  check (previous_status is null or previous_status in ('draft','approved','partially_paid','paid','cancelled'));

create table if not exists public.cash_entry_counter (
  organization_id uuid primary key references public.organization(id) on delete restrict,
  last_value bigint not null default 0 check (last_value >= 0)
);

create or replace function public.refresh_payment_search(p_payment_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  insert into public.payment_search(payment_id, organization_id, supplier_id, supplier_legal_name,
    financial_account_id, financial_account_name, method, status, net_amount, paid_at,
    external_reference, search_text)
  select id, organization_id, supplier_id, coalesce(supplier_legal_name, 'Recebimento'),
    financial_account_id, coalesce(financial_account_name, 'Conta de caixa'), method, status,
    net_amount, paid_at, external_reference,
    lower(concat_ws(' ', supplier_legal_name, financial_account_name, external_reference, payment_type))
  from public.payment where id=p_payment_id
  on conflict(payment_id) do update set
    status=excluded.status, net_amount=excluded.net_amount, paid_at=excluded.paid_at,
    supplier_legal_name=excluded.supplier_legal_name,
    financial_account_name=excluded.financial_account_name,
    external_reference=excluded.external_reference, search_text=excluded.search_text,
    updated_at=now();
end $$;

-- The foundation sprint creates the default branch. Backfill existing rows
-- deterministically with that branch; organizations without a valid default
-- branch cannot use finance commands.
update public.accounts_receivable r set company_id=r.organization_id, branch_id=b.id
from public.branch b where b.organization_id=r.organization_id and b.is_default and b.status='active' and (r.company_id is null or r.branch_id is null);
update public.accounts_payable p set company_id=p.organization_id, branch_id=b.id
from public.branch b where b.organization_id=p.organization_id and b.is_default and b.status='active' and (p.company_id is null or p.branch_id is null);
update public.cash_account a set company_id=a.organization_id, branch_id=b.id
from public.branch b where b.organization_id=a.organization_id and b.is_default and b.status='active' and (a.company_id is null or a.branch_id is null);
update public.payment p set company_id=p.organization_id, branch_id=coalesce(p.branch_id,a.branch_id), cash_account_id=coalesce(p.cash_account_id,a.id), payment_type=coalesce(p.payment_type,'disbursement'), occurred_at=coalesce(p.occurred_at,p.confirmed_at,p.created_at)
from public.cash_account a where a.organization_id=p.organization_id and a.status='active' and (p.cash_account_id is null or p.company_id is null or p.branch_id is null);
update public.payment_allocation a set company_id=p.company_id, branch_id=p.branch_id from public.payment p where p.id=a.payment_id and (a.company_id is null or a.branch_id is null);
update public.cash_entry e set company_id=e.organization_id, branch_id=a.branch_id, payment_id=coalesce(e.payment_id,e.source_id), correlation_id=coalesce(e.correlation_id,e.source_id)
from public.cash_account a where a.id=e.account_id and (e.company_id is null or e.branch_id is null or e.correlation_id is null);
update public.cash_flow_search s set company_id=e.company_id, branch_id=e.branch_id from public.cash_entry e where e.id=s.cash_entry_id and (s.company_id is null or s.branch_id is null);

alter table public.payment_allocation alter column payable_installment_id drop not null;
alter table public.payment_allocation alter column accounts_payable_id drop not null;
alter table public.payment_allocation drop constraint if exists payment_allocation_target_check;
alter table public.payment_allocation add constraint payment_allocation_target_check check (
  (accounts_payable_id is not null and payable_installment_id is not null and accounts_receivable_id is null and receivable_installment_id is null)
  or (accounts_receivable_id is not null and receivable_installment_id is not null and accounts_payable_id is null and payable_installment_id is null)
);
create unique index if not exists payment_allocation_idempotency_uidx on public.payment_allocation(organization_id,idempotency_key) where idempotency_key is not null;
create index if not exists payment_allocation_receivable_idx on public.payment_allocation(organization_id,accounts_receivable_id) where accounts_receivable_id is not null;
create index if not exists finance_receivable_branch_due_idx on public.accounts_receivable(organization_id,branch_id,status,due_date);
create index if not exists finance_payable_branch_due_idx on public.accounts_payable(organization_id,branch_id,status,issue_date);
create index if not exists cash_entry_finance_scope_idx on public.cash_entry(organization_id,company_id,branch_id,account_id,occurred_at desc);
create unique index if not exists cash_entry_ledger_idempotency_uidx on public.cash_entry(organization_id,ledger_idempotency_key) where ledger_idempotency_key is not null;
create unique index if not exists cash_entry_reversal_once_uidx on public.cash_entry(reversal_of_entry_id) where reversal_of_entry_id is not null;

create table if not exists public.financial_transfer (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  company_id uuid not null references public.organization(id) on delete restrict,
  source_cash_account_id uuid not null references public.cash_account(id) on delete restrict,
  destination_cash_account_id uuid not null references public.cash_account(id) on delete restrict,
  amount numeric(18,4) not null check (amount > 0),
  occurred_at timestamptz not null default now(),
  correlation_id uuid not null default gen_random_uuid(),
  idempotency_key text not null,
  reference text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  check (source_cash_account_id <> destination_cash_account_id),
  unique (organization_id,idempotency_key)
);
create index if not exists financial_transfer_scope_idx on public.financial_transfer(organization_id,company_id,occurred_at desc);

create or replace function public.finance_has_permission(p_org uuid, p_permission text)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.membership m where m.organization_id=p_org and m.user_id=auth.uid() and m.status='active'
    and (m.role in ('owner','admin','manager','finance') or (m.role='viewer' and p_permission in ('finance.receivables.read','finance.payables.read','finance.payments.read','finance.cash_accounts.read','finance.cash_ledger.read','finance.cash_flow.read'))));
$$;

create or replace function public.finance_record_audit(p_org uuid, p_type text, p_id uuid, p_action text, p_payload jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  if to_regclass('public.audit_event') is not null then
    insert into public.audit_event(organization_id, actor_user_id, aggregate_type, aggregate_id, action, payload, created_at)
    values(p_org, auth.uid(), p_type, p_id, p_action, coalesce(p_payload, '{}'::jsonb), now());
  end if;
exception when undefined_table or undefined_column then null;
end $$;

create or replace function public.finance_require_branch(p_org uuid, p_branch uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare b uuid := coalesce(p_branch, public.ensure_default_branch(p_org,auth.uid()));
begin
  if b is null or not exists(select 1 from public.branch where id=b and organization_id=p_org and status='active') then raise exception 'finance_branch_not_found' using errcode='22023'; end if;
  return b;
end $$;

create or replace function public.finance_next_ledger_number(p_org uuid)
returns text language plpgsql security definer set search_path=public as $$
declare n bigint;
begin
  insert into public.cash_entry_counter(organization_id,last_value) values(p_org,1)
  on conflict(organization_id) do update set last_value=public.cash_entry_counter.last_value+1
  returning last_value into n;
  return 'CL-'||lpad(n::text,6,'0');
end $$;

create or replace function public.create_finance_cash_account(p_org uuid,p_branch uuid,p_code text,p_name text,p_type text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_branch uuid; v_id uuid;
begin
  if not public.finance_has_permission(p_org,'finance.cash_accounts.manage') then raise exception 'permission_denied' using errcode='42501'; end if;
  if lower(p_type) not in ('cash','checking','investment') or nullif(trim(p_code),'') is null or nullif(trim(p_name),'') is null then raise exception 'invalid_cash_account' using errcode='22023'; end if;
  v_branch:=public.finance_require_branch(p_org,p_branch);
  insert into public.cash_account(organization_id,company_id,branch_id,code,name,account_type,created_by,updated_by)
  values(p_org,p_org,v_branch,upper(trim(p_code)),trim(p_name),lower(p_type),auth.uid(),auth.uid()) returning id into v_id;
  perform public.finance_record_audit(p_org,'cash_account',v_id,'CashAccountCreated',jsonb_build_object('branchId',v_branch,'type',lower(p_type)));
  return v_id;
end $$;

-- Existing cash_entry is the CashLedger. Once posted, no command can mutate or
-- delete it; correction is a distinct reversal entry.
create or replace function public.deny_posted_cash_ledger_mutation()
returns trigger language plpgsql set search_path=public as $$
begin
  if tg_op='DELETE' or old.status='posted' then raise exception 'cash_ledger_immutable' using errcode='42501'; end if;
  return new;
end $$;
drop trigger if exists cash_entry_ledger_no_update on public.cash_entry;
drop trigger if exists cash_entry_ledger_no_delete on public.cash_entry;
create trigger cash_entry_ledger_no_update before update on public.cash_entry for each row execute function public.deny_posted_cash_ledger_mutation();
create trigger cash_entry_ledger_no_delete before delete on public.cash_entry for each row execute function public.deny_posted_cash_ledger_mutation();

create or replace function public.finance_record_cash_ledger(
  p_org uuid,p_company uuid,p_branch uuid,p_account uuid,p_entry_type text,p_amount numeric,p_source_type text,p_source_id uuid,p_payment_id uuid,p_transfer_id uuid,p_reversal_of uuid,p_correlation uuid,p_idempotency text,p_description text,p_occurred_at timestamptz
) returns uuid language plpgsql security definer set search_path=public as $$
declare e uuid;
begin
  if p_amount<=0 or upper(p_entry_type) not in ('CREDIT','DEBIT','REVERSAL') then raise exception 'invalid_cash_ledger_entry' using errcode='22023'; end if;
  if not exists(select 1 from public.cash_account where id=p_account and organization_id=p_org and company_id=p_company and branch_id=p_branch and status='active') then raise exception 'cash_account_scope_invalid' using errcode='22023'; end if;
  insert into public.cash_entry(organization_id,company_id,branch_id,account_id,number,entry_type,origin,source_id,payment_id,transfer_id,reversal_of_entry_id,correlation_id,ledger_idempotency_key,amount,occurred_at,description,status,post_idempotency_key,created_by,updated_by)
  values(p_org,p_company,p_branch,p_account,public.finance_next_ledger_number(p_org),upper(p_entry_type),upper(p_source_type),p_source_id,p_payment_id,p_transfer_id,p_reversal_of,p_correlation,p_idempotency,p_amount,coalesce(p_occurred_at,now()),trim(p_description),'posted',p_idempotency,auth.uid(),auth.uid())
  on conflict(organization_id,ledger_idempotency_key) where ledger_idempotency_key is not null do nothing returning id into e;
  if e is null then select id into e from public.cash_entry where organization_id=p_org and ledger_idempotency_key=p_idempotency; end if;
  insert into public.cash_entry_history(organization_id,cash_entry_id,action,actor_user_id,details) values(p_org,e,'CashLedgerEntryCreated',auth.uid(),jsonb_build_object('entryType',upper(p_entry_type),'sourceType',upper(p_source_type))) on conflict do nothing;
  perform public.finance_record_audit(p_org,'cash_ledger',e,'CashLedgerEntryCreated',jsonb_build_object('entryType',upper(p_entry_type),'sourceType',upper(p_source_type),'amount',p_amount));
  perform public.refresh_cash_flow_search(e);
  return e;
end $$;

create or replace function public.post_finance_payment(
  p_org uuid,p_branch uuid,p_cash_account uuid,p_type text,p_method text,p_occurred_at timestamptz,p_amount numeric,p_allocations jsonb,p_reference text default null,p_idempotency text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_branch uuid; v_payment uuid:=gen_random_uuid(); x record; v_sum numeric:=0; v_open numeric; v_target uuid; v_kind text; v_status text; v_ledger uuid;
begin
  if not public.finance_has_permission(p_org,'finance.payments.post') then raise exception 'permission_denied' using errcode='42501'; end if;
  if lower(p_type) not in ('receipt','disbursement') or p_amount<=0 or nullif(trim(p_idempotency),'') is null then raise exception 'invalid_payment' using errcode='22023'; end if;
  select id into v_payment from public.payment where organization_id=p_org and posted_idempotency_key=p_idempotency;
  if found then return v_payment; end if;
  v_branch:=public.finance_require_branch(p_org,p_branch);
  if not exists(select 1 from public.cash_account where id=p_cash_account and organization_id=p_org and company_id=p_org and branch_id=v_branch and status='active') then raise exception 'cash_account_scope_invalid' using errcode='22023'; end if;
  if jsonb_typeof(p_allocations)<>'array' or jsonb_array_length(p_allocations)=0 then raise exception 'allocations_required' using errcode='22023'; end if;
  insert into public.payment(id,organization_id,company_id,branch_id,cash_account_id,payment_type,method,status,gross_amount,discount_amount,interest_amount,penalty_amount,fee_amount,paid_at,occurred_at,confirmed_at,posted_idempotency_key,external_reference,created_by,updated_by)
  values(v_payment,p_org,p_org,v_branch,p_cash_account,lower(p_type),lower(p_method),'confirmed',p_amount,0,0,0,0,(coalesce(p_occurred_at,now()))::date,coalesce(p_occurred_at,now()),now(),p_idempotency,nullif(trim(p_reference),''),auth.uid(),auth.uid());
  for x in select value from jsonb_array_elements(p_allocations) loop
    if coalesce((x.value->>'amount')::numeric,0)<=0 then raise exception 'invalid_allocation' using errcode='22023'; end if;
    if lower(p_type)='receipt' then
      select ri.open_amount,ri.accounts_receivable_id into v_open,v_target from public.receivable_installment ri join public.accounts_receivable r on r.id=ri.accounts_receivable_id where ri.id=(x.value->>'installmentId')::uuid and r.organization_id=p_org and r.branch_id=v_branch and r.status in ('open','partially_paid') for update;
      if not found or (x.value->>'amount')::numeric>v_open then raise exception 'allocation_exceeds_balance' using errcode='22023'; end if;
      update public.receivable_installment set open_amount=open_amount-(x.value->>'amount')::numeric,paid_amount=paid_amount+(x.value->>'amount')::numeric,status=case when open_amount-(x.value->>'amount')::numeric=0 then 'paid' else 'partially_paid' end,updated_by=auth.uid() where id=(x.value->>'installmentId')::uuid;
      insert into public.payment_allocation(organization_id,company_id,branch_id,payment_id,receivable_installment_id,accounts_receivable_id,amount,idempotency_key,created_by) values(p_org,p_org,v_branch,v_payment,(x.value->>'installmentId')::uuid,v_target,(x.value->>'amount')::numeric,p_idempotency||':'||(x.value->>'installmentId'),auth.uid());
      select case when sum(open_amount)=0 then 'paid' when sum(open_amount)<sum(original_amount) then 'partially_paid' else 'open' end into v_status from public.receivable_installment where accounts_receivable_id=v_target;
      update public.accounts_receivable set open_amount=(select sum(open_amount) from public.receivable_installment where accounts_receivable_id=v_target),paid_amount=(select sum(paid_amount) from public.receivable_installment where accounts_receivable_id=v_target),status=v_status,updated_by=auth.uid() where id=v_target;
      insert into public.accounts_receivable_history(organization_id,accounts_receivable_id,action,new_value,actor_user_id) values(p_org,v_target,case when v_status='paid' then 'AccountsReceivableSettled' else 'AccountsReceivablePartiallySettled' end,v_status,auth.uid());
    else
      select pi.open_balance,pi.accounts_payable_id into v_open,v_target from public.payable_installment pi join public.accounts_payable a on a.id=pi.accounts_payable_id where pi.id=(x.value->>'installmentId')::uuid and a.organization_id=p_org and a.branch_id=v_branch and a.status in ('approved','partially_paid') for update;
      if not found or (x.value->>'amount')::numeric>v_open then raise exception 'allocation_exceeds_balance' using errcode='22023'; end if;
      update public.payable_installment set open_balance=open_balance-(x.value->>'amount')::numeric,status=case when open_balance-(x.value->>'amount')::numeric=0 then 'paid' else 'partially_paid' end,updated_by=auth.uid() where id=(x.value->>'installmentId')::uuid;
      insert into public.payment_allocation(organization_id,company_id,branch_id,payment_id,payable_installment_id,accounts_payable_id,amount,idempotency_key,created_by) values(p_org,p_org,v_branch,v_payment,(x.value->>'installmentId')::uuid,v_target,(x.value->>'amount')::numeric,p_idempotency||':'||(x.value->>'installmentId'),auth.uid());
      select case when sum(open_balance)=0 then 'paid' when sum(open_balance)<sum(amount) then 'partially_paid' else 'approved' end into v_status from public.payable_installment where accounts_payable_id=v_target;
      update public.accounts_payable set open_balance=(select sum(open_balance) from public.payable_installment where accounts_payable_id=v_target),status=v_status,updated_by=auth.uid() where id=v_target;
      insert into public.accounts_payable_history(organization_id,accounts_payable_id,action,new_value,actor_user_id) values(p_org,v_target,case when v_status='paid' then 'AccountsPayableSettled' else 'AccountsPayablePartiallySettled' end,v_status,auth.uid());
    end if;
    v_sum:=v_sum+(x.value->>'amount')::numeric;
  end loop;
  if round(v_sum,4)<>round(p_amount,4) then raise exception 'allocation_total_mismatch' using errcode='22023'; end if;
  v_ledger:=public.finance_record_cash_ledger(p_org,p_org,v_branch,p_cash_account,case when lower(p_type)='receipt' then 'CREDIT' else 'DEBIT' end,p_amount,'ACCOUNTS_'||upper(case when lower(p_type)='receipt' then 'RECEIVABLE' else 'PAYABLE' end),v_payment,v_payment,null,null,v_payment,p_idempotency,'Payment '||v_payment::text,p_occurred_at);
  insert into public.payment_history(organization_id,payment_id,action,actor_user_id,metadata) values(p_org,v_payment,'PaymentPosted',auth.uid(),jsonb_build_object('cashLedgerId',v_ledger,'type',p_type)),(p_org,v_payment,'PaymentAllocated',auth.uid(),jsonb_build_object('amount',v_sum));
  perform public.finance_record_audit(p_org,'payment',v_payment,'PaymentPosted',jsonb_build_object('type',p_type,'amount',p_amount));
  return v_payment;
end $$;

create or replace function public.reverse_finance_payment(p_org uuid,p_payment uuid,p_reason text,p_idempotency text)
returns uuid language plpgsql security definer set search_path=public as $$
declare p public.payment%rowtype; a record; v_ledger uuid;
begin
  if not public.finance_has_permission(p_org,'finance.payments.reverse') then raise exception 'permission_denied' using errcode='42501'; end if;
  if nullif(trim(p_reason),'') is null or nullif(trim(p_idempotency),'') is null then raise exception 'reason_and_idempotency_required' using errcode='22023'; end if;
  select * into p from public.payment where id=p_payment and organization_id=p_org for update;
  if not found then raise exception 'payment_not_found' using errcode='P0002'; end if;
  if p.status='reversed' then return p.id; end if;
  if p.status<>'confirmed' then raise exception 'payment_not_posted' using errcode='22023'; end if;
  for a in select * from public.payment_allocation where payment_id=p.id and reversed_at is null order by id for update loop
    if a.accounts_receivable_id is not null then
      update public.receivable_installment set open_amount=open_amount+a.amount,paid_amount=paid_amount-a.amount,status=case when paid_amount-a.amount=0 then 'open' else 'partially_paid' end,updated_by=auth.uid() where id=a.receivable_installment_id;
      update public.accounts_receivable set open_amount=(select sum(open_amount) from public.receivable_installment where accounts_receivable_id=a.accounts_receivable_id),paid_amount=(select sum(paid_amount) from public.receivable_installment where accounts_receivable_id=a.accounts_receivable_id),status=case when (select sum(paid_amount) from public.receivable_installment where accounts_receivable_id=a.accounts_receivable_id)=0 then 'open' else 'partially_paid' end,updated_by=auth.uid() where id=a.accounts_receivable_id;
    else
      update public.payable_installment set open_balance=open_balance+a.amount,status=case when open_balance+a.amount=amount then 'open' else 'partially_paid' end,updated_by=auth.uid() where id=a.payable_installment_id;
      update public.accounts_payable set open_balance=(select sum(open_balance) from public.payable_installment where accounts_payable_id=a.accounts_payable_id),status=case when (select sum(open_balance) from public.payable_installment where accounts_payable_id=a.accounts_payable_id)=original_amount then 'approved' else 'partially_paid' end,updated_by=auth.uid() where id=a.accounts_payable_id;
    end if;
    update public.payment_allocation set reversed_at=now() where id=a.id;
  end loop;
  update public.payment set status='reversed',reversed_at=now(),reversal_reason=p_reason,updated_by=auth.uid() where id=p.id;
  v_ledger:=public.finance_record_cash_ledger(p_org,p.company_id,p.branch_id,p.cash_account_id,'REVERSAL',p.net_amount,'PAYMENT_REVERSAL',p.id,p.id,null,(select id from public.cash_entry where payment_id=p.id and entry_type in ('CREDIT','DEBIT') order by created_at limit 1),p.id,p_idempotency,'Payment reversal: '||p_reason,now());
  insert into public.payment_history(organization_id,payment_id,action,reason,actor_user_id,metadata) values(p_org,p.id,'PaymentReversed',p_reason,auth.uid(),jsonb_build_object('cashLedgerId',v_ledger));
  perform public.finance_record_audit(p_org,'payment',p.id,'PaymentReversed',jsonb_build_object('reason',p_reason));
  return p.id;
end $$;

create or replace function public.create_financial_transfer(p_org uuid,p_source_account uuid,p_destination_account uuid,p_amount numeric,p_occurred_at timestamptz,p_reference text,p_idempotency text)
returns uuid language plpgsql security definer set search_path=public as $$
declare s public.cash_account%rowtype; d public.cash_account%rowtype; t uuid:=gen_random_uuid(); c uuid:=gen_random_uuid();
begin
  if not public.finance_has_permission(p_org,'finance.transfers.create') then raise exception 'permission_denied' using errcode='42501'; end if;
  if p_source_account=p_destination_account or p_amount<=0 or nullif(trim(p_idempotency),'') is null then raise exception 'invalid_transfer' using errcode='22023'; end if;
  select id into t from public.financial_transfer where organization_id=p_org and idempotency_key=p_idempotency; if found then return t; end if;
  select * into s from public.cash_account where id=p_source_account and organization_id=p_org and status='active' for update;
  select * into d from public.cash_account where id=p_destination_account and organization_id=p_org and status='active' for update;
  if s.id is null or d.id is null or s.company_id<>d.company_id then raise exception 'transfer_scope_invalid' using errcode='22023'; end if;
  insert into public.financial_transfer(id,organization_id,company_id,source_cash_account_id,destination_cash_account_id,amount,occurred_at,correlation_id,idempotency_key,reference,created_by) values(t,p_org,s.company_id,s.id,d.id,p_amount,coalesce(p_occurred_at,now()),c,p_idempotency,nullif(trim(p_reference),''),auth.uid());
  perform public.finance_record_cash_ledger(p_org,s.company_id,s.branch_id,s.id,'DEBIT',p_amount,'TRANSFER',t,null,t,null,c,p_idempotency||':debit',coalesce(p_reference,'Transferência'),p_occurred_at);
  perform public.finance_record_cash_ledger(p_org,d.company_id,d.branch_id,d.id,'CREDIT',p_amount,'TRANSFER',t,null,t,null,c,p_idempotency||':credit',coalesce(p_reference,'Transferência'),p_occurred_at);
  perform public.finance_record_audit(p_org,'financial_transfer',t,'FinancialTransferCompleted',jsonb_build_object('amount',p_amount,'sourceAccountId',s.id,'destinationAccountId',d.id));
  return t;
end $$;

create or replace function public.cancel_finance_receivable(p_org uuid,p_receivable uuid,p_reason text)
returns uuid language plpgsql security definer set search_path=public as $$
declare r public.accounts_receivable%rowtype;
begin
  if not public.finance_has_permission(p_org,'finance.receivables.cancel') or nullif(trim(p_reason),'') is null then raise exception 'permission_denied_or_reason_required' using errcode='42501'; end if;
  select * into r from public.accounts_receivable where id=p_receivable and organization_id=p_org for update;
  if not found or r.status not in ('open','partially_paid') or r.paid_amount<>0 or exists(select 1 from public.payment_allocation where accounts_receivable_id=r.id and reversed_at is null) then raise exception 'receivable_not_cancellable' using errcode='22023'; end if;
  update public.receivable_installment set status='cancelled',updated_by=auth.uid() where accounts_receivable_id=r.id;
  update public.accounts_receivable set status='cancelled',cancelled_at=now(),cancelled_by=auth.uid(),cancellation_reason=p_reason,updated_by=auth.uid() where id=r.id;
  insert into public.accounts_receivable_history(organization_id,accounts_receivable_id,action,reason,actor_user_id) values(p_org,r.id,'AccountsReceivableCancelled',p_reason,auth.uid());
  perform public.finance_record_audit(p_org,'accounts_receivable',r.id,'AccountsReceivableCancelled',jsonb_build_object('reason',p_reason));
  return r.id;
end $$;

create or replace function public.cancel_finance_payable(p_org uuid,p_payable uuid,p_reason text)
returns uuid language plpgsql security definer set search_path=public as $$
declare a public.accounts_payable%rowtype;
begin
  if not public.finance_has_permission(p_org,'finance.payables.cancel') or nullif(trim(p_reason),'') is null then raise exception 'permission_denied_or_reason_required' using errcode='42501'; end if;
  select * into a from public.accounts_payable where id=p_payable and organization_id=p_org for update;
  if not found or a.status not in ('draft','approved','partially_paid') or a.open_balance<>a.original_amount or exists(select 1 from public.payment_allocation where accounts_payable_id=a.id and reversed_at is null) then raise exception 'payable_not_cancellable' using errcode='22023'; end if;
  update public.payable_installment set status='cancelled',updated_by=auth.uid() where accounts_payable_id=a.id;
  update public.accounts_payable set status='cancelled',previous_status=a.status,cancelled_at=now(),cancelled_by=auth.uid(),cancellation_reason=p_reason,updated_by=auth.uid() where id=a.id;
  insert into public.accounts_payable_history(organization_id,accounts_payable_id,action,reason,actor_user_id) values(p_org,a.id,'AccountsPayableCancelled',p_reason,auth.uid());
  perform public.finance_record_audit(p_org,'accounts_payable',a.id,'AccountsPayableCancelled',jsonb_build_object('reason',p_reason));
  return a.id;
end $$;

create or replace function public.get_finance_cash_flow(p_org uuid,p_branch uuid default null,p_account uuid default null,p_from date default current_date,p_to date default current_date+30,p_grain text default 'day')
returns jsonb language plpgsql security definer set search_path=public stable as $$
declare v_branch uuid:=coalesce(p_branch,(select id from public.branch where organization_id=p_org and is_default and status='active')); v_realized numeric; v_forecast_in numeric; v_forecast_out numeric;
begin
  if not public.finance_has_permission(p_org,'finance.cash_flow.read') then raise exception 'permission_denied' using errcode='42501'; end if;
  select coalesce(sum(case when entry_type='CREDIT' then amount when entry_type='DEBIT' then -amount when entry_type='REVERSAL' then case when exists(select 1 from public.cash_entry o where o.id=e.reversal_of_entry_id and o.entry_type='CREDIT') then -amount else amount end else 0 end),0) into v_realized from public.cash_entry e where e.organization_id=p_org and (p_account is null or e.account_id=p_account) and (v_branch is null or e.branch_id=v_branch) and e.status='posted' and e.occurred_at::date<=p_to;
  select coalesce(sum(open_amount),0) into v_forecast_in from public.accounts_receivable where organization_id=p_org and (v_branch is null or branch_id=v_branch) and status in('open','partially_paid') and due_date between p_from and p_to;
  select coalesce(sum(open_balance),0) into v_forecast_out from public.accounts_payable where organization_id=p_org and (v_branch is null or branch_id=v_branch) and status in('approved','partially_paid') and issue_date between p_from and p_to;
  return jsonb_build_object('realizedBalance',v_realized,'forecastIn',v_forecast_in,'forecastOut',v_forecast_out,'projectedBalance',v_realized+v_forecast_in-v_forecast_out,'from',p_from,'to',p_to,'grain',p_grain);
end $$;

alter table public.financial_transfer enable row level security;
create policy financial_transfer_read on public.financial_transfer for select to authenticated using(public.finance_has_permission(organization_id,'finance.cash_ledger.read'));
revoke all on public.financial_transfer from authenticated;
grant select on public.financial_transfer to authenticated;
grant execute on function public.create_finance_cash_account(uuid,uuid,text,text,text),public.post_finance_payment(uuid,uuid,uuid,text,text,timestamptz,numeric,jsonb,text,text),public.reverse_finance_payment(uuid,uuid,text,text),public.create_financial_transfer(uuid,uuid,uuid,numeric,timestamptz,text,text),public.get_finance_cash_flow(uuid,uuid,uuid,date,date,text) to authenticated;
grant execute on function public.cancel_finance_receivable(uuid,uuid,text),public.cancel_finance_payable(uuid,uuid,text) to authenticated;
