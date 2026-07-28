-- Financial integration: confirmed payment events publish immutable Cash Ledger entries.

alter table public.cash_entry drop constraint if exists cash_entry_entry_type_check;
alter table public.cash_entry add constraint cash_entry_entry_type_check check (entry_type in ('CREDIT','DEBIT','REVERSAL'));
drop index if exists public.cash_entry_source_origin_uidx;
create unique index cash_entry_source_origin_type_uidx on public.cash_entry(organization_id, origin, source_id, entry_type) where source_id is not null;
alter table public.cash_flow_search add column if not exists source_id uuid;
alter table public.cash_flow_search add column if not exists source_document text;
create index if not exists cash_flow_search_source_idx on public.cash_flow_search(organization_id, source_id);

create or replace function public.refresh_cash_flow_search(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare e public.cash_entry%rowtype; n text;
begin
  select * into e from public.cash_entry where id=p_id;
  if not found then delete from public.cash_flow_search where cash_entry_id=p_id; return; end if;
  select name into n from public.cash_account where id=e.account_id;
  insert into public.cash_flow_search(cash_entry_id,organization_id,number,account_id,entry_type,origin,amount,occurred_at,status,search_text,source_id,source_document,updated_at)
  values(e.id,e.organization_id,e.number,e.account_id,e.entry_type,e.origin,e.amount,e.occurred_at,e.status,lower(concat_ws(' ',e.number,n,e.source_document,e.description)),e.source_id,e.source_document,now())
  on conflict(cash_entry_id) do update set status=excluded.status,amount=excluded.amount,search_text=excluded.search_text,source_id=excluded.source_id,source_document=excluded.source_document,updated_at=now();
end; $$;

create or replace function public.ensure_default_cash_account(p_org uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare a uuid;
begin
  select id into a from public.cash_account where organization_id=p_org and status='active' order by created_at limit 1;
  if a is null then insert into public.cash_account(organization_id,code,name,account_type,created_by,updated_by) values(p_org,'DEFAULT','Conta financeira padrão','checking',auth.uid(),auth.uid()) returning id into a; end if;
  return a;
end; $$;

create or replace function public.publish_payment_to_cash(p_payment_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare p public.payment%rowtype; a uuid; e public.cash_entry; kind text; idem text;
begin
  select * into p from public.payment where id=p_payment_id for update;
  if not found or p.status not in ('confirmed','reversed') then return null; end if;
  a := public.ensure_default_cash_account(p.organization_id);
  kind := case when p.status='confirmed' then 'DEBIT' else 'REVERSAL' end;
  idem := 'payment:'||p.id::text||':'||lower(p.status);
  insert into public.cash_entry(organization_id,account_id,number,entry_type,origin,source_document,source_id,amount,occurred_at,description,status,post_idempotency_key,created_by,updated_by)
    values(p.organization_id,a,'CF-PAY-'||left(p.id::text,8),kind,'ACCOUNTS_PAYABLE','payment',p.id,p.net_amount,coalesce(p.confirmed_at,now()),'Payment '||p.id::text,'posted',idem,auth.uid(),auth.uid())
    on conflict (organization_id,origin,source_id,entry_type) do update set updated_at=now()
    returning * into e;
  if e.id is null then select * into e from public.cash_entry where organization_id=p.organization_id and origin='ACCOUNTS_PAYABLE' and source_id=p.id; end if;
  insert into public.cash_entry_history(organization_id,cash_entry_id,action,actor_user_id,details) values(p.organization_id,e.id,case when kind='REVERSAL' then 'CashIntegrationReversed' else 'CashIntegrationPosted' end,auth.uid(),jsonb_build_object('paymentId',p.id,'status',p.status)) on conflict do nothing;
  perform public.refresh_cash_flow_search(e.id); return e.id;
end; $$;

create or replace function public.trg_payment_cash_integration() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status in ('confirmed','reversed') and (old.status is distinct from new.status) then perform public.publish_payment_to_cash(new.id); end if;
  return new;
end; $$;
drop trigger if exists payment_cash_integration on public.payment;
create trigger payment_cash_integration after update of status on public.payment for each row execute function public.trg_payment_cash_integration();

grant execute on function public.publish_payment_to_cash(uuid),public.ensure_default_cash_account(uuid) to authenticated;
