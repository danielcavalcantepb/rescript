-- Cash Flow foundation. Balances are always derived from cash_entry (ledger).

create table public.cash_account (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('cash','checking','investment')),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
  unique (organization_id, code)
);

create table public.cash_entry (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  account_id uuid not null references public.cash_account(id) on delete restrict,
  number text not null,
  entry_type text not null check (entry_type in ('CREDIT','DEBIT')),
  origin text not null check (origin in ('ACCOUNTS_RECEIVABLE','ACCOUNTS_PAYABLE','MANUAL')),
  source_document text,
  source_id uuid,
  amount numeric(18,2) not null check (amount > 0),
  occurred_at timestamptz not null default now(),
  description text not null check (char_length(trim(description)) between 1 and 2000),
  status text not null default 'draft' check (status in ('draft','posted','reversed','cancelled')),
  post_idempotency_key text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
  unique (organization_id, number)
);

create unique index cash_entry_idempotency_uidx on public.cash_entry(organization_id, post_idempotency_key) where post_idempotency_key is not null;
create index cash_entry_org_occurred_idx on public.cash_entry(organization_id, occurred_at desc);
create index cash_entry_org_status_idx on public.cash_entry(organization_id, status);

create table public.cash_entry_history (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organization(id) on delete restrict,
  cash_entry_id uuid not null references public.cash_entry(id) on delete restrict, action text not null,
  actor_user_id uuid not null references auth.users(id), details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index cash_entry_history_idx on public.cash_entry_history(organization_id,cash_entry_id,created_at desc);

create table public.cash_flow_search (
  cash_entry_id uuid primary key references public.cash_entry(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete restrict,
  number text not null, account_id uuid not null, entry_type text not null, origin text not null,
  amount numeric(18,2) not null, occurred_at timestamptz not null, status text not null, search_text text not null default '', updated_at timestamptz not null default now()
);
create index cash_flow_search_org_idx on public.cash_flow_search(organization_id,occurred_at desc);
create index cash_flow_search_text_idx on public.cash_flow_search using gin(to_tsvector('simple',search_text));

create or replace function public.cash_has_permission(p_org uuid,p_permission text)
returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from public.membership m where m.organization_id=p_org and m.user_id=auth.uid() and m.status='active' and (m.role in('owner','admin') or (m.role='manager' and p_permission in('cash.read','cash.create','cash.post','cash.reverse','cash.cancel')) or (m.role in('finance','viewer') and p_permission='cash.read'))); $$;

create or replace function public.refresh_cash_flow_search(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare e public.cash_entry%rowtype; n text;
begin select * into e from public.cash_entry where id=p_id; if not found then delete from public.cash_flow_search where cash_entry_id=p_id; return; end if;
select name into n from public.cash_account where id=e.account_id;
insert into public.cash_flow_search values(e.id,e.organization_id,e.number,e.account_id,e.entry_type,e.origin,e.amount,e.occurred_at,e.status,lower(concat_ws(' ',e.number,n,e.source_document,e.description)),now()) on conflict(cash_entry_id) do update set status=excluded.status,amount=excluded.amount,search_text=excluded.search_text,updated_at=now(); end; $$;

create or replace function public.create_cash_account(p_org uuid,p_code text,p_name text,p_type text) returns public.cash_account language plpgsql security definer set search_path=public as $$
declare a public.cash_account; begin if not public.cash_has_permission(p_org,'cash.create') then raise exception 'permission_denied' using errcode='42501'; end if;
insert into public.cash_account(organization_id,code,name,account_type,created_by,updated_by) values(p_org,trim(p_code),trim(p_name),lower(p_type),auth.uid(),auth.uid()) returning * into a; return a; end; $$;

create or replace function public.create_cash_entry(p_org uuid,p_account uuid,p_type text,p_origin text,p_amount numeric,p_description text,p_source_document text default null,p_source_id uuid default null) returns public.cash_entry language plpgsql security definer set search_path=public as $$
declare e public.cash_entry; n text;
begin if not public.cash_has_permission(p_org,'cash.create') then raise exception 'permission_denied' using errcode='42501'; end if;
select 'CF-'||lpad((count(*)+1)::text,6,'0') into n from public.cash_entry where organization_id=p_org;
insert into public.cash_entry(organization_id,account_id,number,entry_type,origin,source_document,source_id,amount,description,created_by,updated_by) values(p_org,p_account, n,upper(p_type),upper(p_origin),p_source_document,p_source_id,p_amount,trim(p_description),auth.uid(),auth.uid()) returning * into e;
insert into public.cash_entry_history(organization_id,cash_entry_id,action,actor_user_id) values(p_org,e.id,'CashEntryCreated',auth.uid()); perform public.refresh_cash_flow_search(e.id); return e; end; $$;

create or replace function public.post_cash_entry(p_org uuid,p_entry uuid,p_idempotency text) returns public.cash_entry language plpgsql security definer set search_path=public as $$
declare e public.cash_entry;
begin if not public.cash_has_permission(p_org,'cash.post') then raise exception 'permission_denied' using errcode='42501'; end if; if nullif(trim(p_idempotency),'') is null then raise exception 'invalid_idempotency_key'; end if;
select * into e from public.cash_entry where id=p_entry and organization_id=p_org for update; if not found then raise exception 'cash_entry_not_found'; end if; if e.status='posted' then return e; end if; if e.status <> 'draft' then raise exception 'invalid_transition'; end if;
update public.cash_entry set status='posted',post_idempotency_key=p_idempotency,updated_by=auth.uid() where id=e.id returning * into e;
insert into public.cash_entry_history(organization_id,cash_entry_id,action,actor_user_id) values(p_org,e.id,'CashEntryPosted',auth.uid()); perform public.refresh_cash_flow_search(e.id); return e; end; $$;

create or replace function public.reverse_cash_entry(p_org uuid,p_entry uuid) returns public.cash_entry language plpgsql security definer set search_path=public as $$
declare e public.cash_entry; begin if not public.cash_has_permission(p_org,'cash.reverse') then raise exception 'permission_denied'; end if; update public.cash_entry set status='reversed',updated_by=auth.uid() where id=p_entry and organization_id=p_org and status='posted' returning * into e; if not found then raise exception 'invalid_transition'; end if; insert into public.cash_entry_history(organization_id,cash_entry_id,action,actor_user_id) values(p_org,e.id,'CashEntryReversed',auth.uid()); perform public.refresh_cash_flow_search(e.id); return e; end; $$;

create or replace function public.cancel_cash_entry(p_org uuid,p_entry uuid) returns public.cash_entry language plpgsql security definer set search_path=public as $$
declare e public.cash_entry; begin if not public.cash_has_permission(p_org,'cash.cancel') then raise exception 'permission_denied'; end if; update public.cash_entry set status='cancelled',updated_by=auth.uid() where id=p_entry and organization_id=p_org and status='draft' returning * into e; if not found then raise exception 'invalid_transition'; end if; insert into public.cash_entry_history(organization_id,cash_entry_id,action,actor_user_id) values(p_org,e.id,'CashEntryCancelled',auth.uid()); perform public.refresh_cash_flow_search(e.id); return e; end; $$;

alter table public.cash_account enable row level security; alter table public.cash_entry enable row level security; alter table public.cash_entry_history enable row level security; alter table public.cash_flow_search enable row level security;
create policy cash_account_read on public.cash_account for select to authenticated using(public.cash_has_permission(organization_id,'cash.read'));
create policy cash_entry_read on public.cash_entry for select to authenticated using(public.cash_has_permission(organization_id,'cash.read'));
create policy cash_history_read on public.cash_entry_history for select to authenticated using(public.cash_has_permission(organization_id,'cash.read'));
create policy cash_search_read on public.cash_flow_search for select to authenticated using(public.cash_has_permission(organization_id,'cash.read'));
revoke all on public.cash_account,public.cash_entry,public.cash_entry_history,public.cash_flow_search from authenticated;
grant select on public.cash_account,public.cash_entry,public.cash_entry_history,public.cash_flow_search to authenticated;
grant execute on function public.create_cash_account(uuid,text,text,text),public.create_cash_entry(uuid,uuid,text,text,numeric,text,text,uuid),public.post_cash_entry(uuid,uuid,text),public.reverse_cash_entry(uuid,uuid),public.cancel_cash_entry(uuid,uuid) to authenticated;
