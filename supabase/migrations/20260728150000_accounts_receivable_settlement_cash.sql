-- Receivable settlement publishes CREDIT only after the aggregate reaches Paid.

alter table public.cash_flow_search add column if not exists receivable_id uuid;
alter table public.cash_flow_search add column if not exists customer_name text;
alter table public.cash_flow_search add column if not exists settlement_date timestamptz;
alter table public.cash_flow_search add column if not exists payment_reference text;
create index if not exists cash_flow_search_receivable_idx on public.cash_flow_search(organization_id,receivable_id);

create or replace function public.publish_receivable_settlement_to_cash(p_receivable_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare r public.accounts_receivable%rowtype; a uuid; e public.cash_entry; idem text;
begin
  select * into r from public.accounts_receivable where id=p_receivable_id for update;
  if not found or r.status <> 'paid' then return null; end if;
  a := public.ensure_default_cash_account(r.organization_id); idem := 'receivable:'||r.id::text||':settled';
  insert into public.cash_entry(organization_id,account_id,number,entry_type,origin,source_document,source_id,amount,occurred_at,description,status,post_idempotency_key,created_by,updated_by)
    values(r.organization_id,a,'CF-AR-'||left(r.id::text,8),'CREDIT','ACCOUNTS_RECEIVABLE',r.number,r.id,r.paid_amount,now(),'Settlement '||r.number,'posted',idem,auth.uid(),auth.uid())
    on conflict(organization_id,origin,source_id,entry_type) do update set updated_at=now()
    returning * into e;
  insert into public.cash_entry_history(organization_id,cash_entry_id,action,actor_user_id,details) values(r.organization_id,e.id,'CashPublished',auth.uid(),jsonb_build_object('receivableId',r.id,'event','ReceivableSettled')) on conflict do nothing;
  perform public.refresh_cash_flow_search(e.id);
  update public.cash_flow_search set receivable_id=r.id,customer_name=r.customer_name,settlement_date=now(),payment_reference=r.number where cash_entry_id=e.id;
  return e.id;
end; $$;

create or replace function public.trg_receivable_settlement_cash() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='paid' and old.status is distinct from new.status then
    insert into public.accounts_receivable_history(organization_id,accounts_receivable_id,action,new_value,actor_user_id) values(new.organization_id,new.id,'ReceivableSettled','paid',auth.uid());
    perform public.publish_receivable_settlement_to_cash(new.id);
  end if;
  return new;
end; $$;
drop trigger if exists accounts_receivable_settlement_cash on public.accounts_receivable;
create trigger accounts_receivable_settlement_cash after update of status on public.accounts_receivable for each row execute function public.trg_receivable_settlement_cash();

create or replace function public.settle_receivable(p_organization_id uuid,p_receivable_id uuid) returns public.accounts_receivable language plpgsql security definer set search_path=public as $$
declare r public.accounts_receivable;
begin
  if not public.is_org_member(p_organization_id) then raise exception 'not_org_member' using errcode='42501'; end if;
  select * into r from public.accounts_receivable where id=p_receivable_id and organization_id=p_organization_id for update;
  if not found or r.status not in('open','partially_paid') then raise exception 'invalid_settlement_state'; end if;
  update public.receivable_installment set open_amount=0,paid_amount=original_amount,status='paid',updated_at=now(),updated_by=auth.uid() where accounts_receivable_id=r.id;
  update public.accounts_receivable set open_amount=0,paid_amount=total_amount,status='paid',updated_by=auth.uid() where id=r.id returning * into r;
  return r;
end; $$;
grant execute on function public.settle_receivable(uuid,uuid),public.publish_receivable_settlement_to_cash(uuid) to authenticated;
