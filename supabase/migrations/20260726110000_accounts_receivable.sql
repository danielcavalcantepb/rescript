-- Accounts Receivable aggregate. Receipts/settlement are intentionally out of scope.
create table public.accounts_receivable_counter(
  organization_id uuid primary key references public.organization(id) on delete restrict,
  last_value bigint not null default 0 check(last_value>=0)
);
create table public.accounts_receivable(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organization(id) on delete restrict,
  number text not null, customer_id uuid not null references public.customer(id) on delete restrict,
  customer_name text not null, customer_document text, customer_email text, customer_phone text,
  origin_type text not null check(origin_type in('manual','sales')), origin_id uuid,
  status text not null default 'draft' check(status in('draft','open','partially_paid','paid','cancelled','archived')),
  issue_date date not null, due_date date not null, currency text not null default 'BRL' check(char_length(currency)=3),
  total_amount numeric(18,4) not null check(total_amount>0), open_amount numeric(18,4) not null check(open_amount>=0),
  paid_amount numeric(18,4) not null default 0 check(paid_amount>=0), notes text check(notes is null or char_length(notes)<=4000),
  archived_at timestamptz, created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),
  unique(organization_id,number), unique(organization_id,origin_type,origin_id),
  check(due_date>=issue_date),check(open_amount+paid_amount=total_amount)
);
create table public.receivable_installment(
  id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organization(id) on delete restrict,
  accounts_receivable_id uuid not null references public.accounts_receivable(id) on delete restrict,
  sequence integer not null check(sequence>0),due_date date not null,original_amount numeric(18,4) not null check(original_amount>0),
  open_amount numeric(18,4) not null check(open_amount>=0),paid_amount numeric(18,4) not null default 0 check(paid_amount>=0),
  status text not null default 'open' check(status in('open','partially_paid','paid','cancelled')),
  created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),
  unique(accounts_receivable_id,sequence),check(open_amount+paid_amount=original_amount)
);
create table public.accounts_receivable_history(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organization(id) on delete restrict,
 accounts_receivable_id uuid not null references public.accounts_receivable(id) on delete restrict,action text not null,
 old_value text,new_value text,reason text,actor_user_id uuid not null references auth.users(id),created_at timestamptz not null default now()
);
create table public.accounts_receivable_search(
 accounts_receivable_id uuid primary key references public.accounts_receivable(id) on delete cascade,
 organization_id uuid not null,
 number text not null,customer_id uuid not null,customer_name text not null,customer_document text,status text not null,
 due_date date not null,total_amount numeric(18,4) not null,open_amount numeric(18,4) not null,paid_amount numeric(18,4) not null,
 currency text not null,search_text text not null,updated_at timestamptz not null default now()
);
create index receivable_search_filters on public.accounts_receivable_search(organization_id,status,due_date);
create index receivable_search_text on public.accounts_receivable_search using gin(to_tsvector('simple',search_text));
create index receivable_installment_due on public.receivable_installment(organization_id,due_date);
create index receivable_history_created on public.accounts_receivable_history(organization_id,accounts_receivable_id,created_at desc);

create trigger accounts_receivable_updated before update on public.accounts_receivable for each row execute function public.set_updated_at();
create trigger receivable_installment_updated before update on public.receivable_installment for each row execute function public.set_updated_at();
create or replace function public.deny_receivable_history_mutation() returns trigger language plpgsql set search_path=public as $$begin raise exception 'receivable_history_immutable' using errcode='42501';end$$;
create trigger receivable_history_no_update before update on public.accounts_receivable_history for each row execute function public.deny_receivable_history_mutation();
create trigger receivable_history_no_delete before delete on public.accounts_receivable_history for each row execute function public.deny_receivable_history_mutation();

create or replace function public.can_manage_receivables(p_org uuid) returns boolean language sql security definer set search_path=public stable as $$
 select exists(select 1 from membership where organization_id=p_org and user_id=auth.uid() and status='active' and role in('owner','admin','manager','finance'));
$$;
create or replace function public.refresh_receivable_search(p_id uuid) returns void language plpgsql security definer set search_path=public as $$begin
 insert into accounts_receivable_search(accounts_receivable_id,organization_id,number,customer_id,customer_name,customer_document,status,due_date,total_amount,open_amount,paid_amount,currency,search_text)
 select id,organization_id,number,customer_id,customer_name,customer_document,status,due_date,total_amount,open_amount,paid_amount,currency,
 lower(concat_ws(' ',number,customer_name,customer_document,total_amount::text)) from accounts_receivable where id=p_id
 on conflict(accounts_receivable_id) do update set customer_name=excluded.customer_name,customer_document=excluded.customer_document,status=excluded.status,due_date=excluded.due_date,
 total_amount=excluded.total_amount,open_amount=excluded.open_amount,paid_amount=excluded.paid_amount,search_text=excluded.search_text,updated_at=now();end$$;
create or replace function public.trg_receivable_search() returns trigger language plpgsql security definer set search_path=public as $$begin perform refresh_receivable_search(coalesce(new.id,old.id));return coalesce(new,old);end$$;
create trigger receivable_search_refresh after insert or update on public.accounts_receivable for each row execute function public.trg_receivable_search();

create or replace function public.create_receivable(p_organization_id uuid,p_customer_id uuid,p_issue_date date,p_due_date date,p_total numeric,p_currency text,p_notes text,p_installments jsonb,p_origin_type text default 'manual',p_origin_id uuid default null)
returns uuid language plpgsql security definer set search_path=public as $$declare v_id uuid:=gen_random_uuid();v_number text;v_customer customer%rowtype;v_sum numeric;v_count int;begin
 if not can_manage_receivables(p_organization_id) then raise exception 'permission_denied' using errcode='42501';end if;
 if p_total<=0 or p_due_date<p_issue_date then raise exception 'invalid_receivable';end if;
 select * into v_customer from customer where id=p_customer_id and organization_id=p_organization_id and status='active';if not found then raise exception 'customer_not_found';end if;
 select sum((x->>'amount')::numeric),count(*) into v_sum,v_count from jsonb_array_elements(p_installments)x where (x->>'amount')::numeric>0 and (x->>'dueDate')::date>=p_issue_date;
 if jsonb_array_length(p_installments)=0 or v_count<>jsonb_array_length(p_installments) or round(coalesce(v_sum,0),4)<>round(p_total,4) then raise exception 'installment_total_mismatch';end if;
 insert into accounts_receivable_counter values(p_organization_id,1) on conflict(organization_id) do update set last_value=accounts_receivable_counter.last_value+1 returning 'AR-'||lpad(last_value::text,6,'0') into v_number;
 insert into accounts_receivable(id,organization_id,number,customer_id,customer_name,customer_document,customer_email,customer_phone,origin_type,origin_id,issue_date,due_date,currency,total_amount,open_amount,notes,created_by,updated_by)
 values(v_id,p_organization_id,v_number,v_customer.id,v_customer.name,v_customer.document,v_customer.email,v_customer.phone,p_origin_type,p_origin_id,p_issue_date,p_due_date,p_currency,p_total,p_total,nullif(trim(p_notes),''),auth.uid(),auth.uid());
 insert into receivable_installment(organization_id,accounts_receivable_id,sequence,due_date,original_amount,open_amount,created_by,updated_by)
 select p_organization_id,v_id,ordinality,(x->>'dueDate')::date,(x->>'amount')::numeric,(x->>'amount')::numeric,auth.uid(),auth.uid() from jsonb_array_elements(p_installments) with ordinality t(x,ordinality);
 insert into accounts_receivable_history(organization_id,accounts_receivable_id,action,new_value,actor_user_id)values(p_organization_id,v_id,'ReceivableCreated',v_number,auth.uid());return v_id;end$$;

create or replace function public.update_receivable(p_organization_id uuid,p_id uuid,p_issue_date date,p_due_date date,p_notes text)returns uuid language plpgsql security definer set search_path=public as $$begin
 if not can_manage_receivables(p_organization_id) then raise exception 'permission_denied';end if;
 update accounts_receivable set issue_date=coalesce(p_issue_date,issue_date),due_date=coalesce(p_due_date,due_date),notes=nullif(trim(p_notes),''),updated_by=auth.uid()
 where id=p_id and organization_id=p_organization_id and status='draft' and coalesce(p_due_date,due_date)>=coalesce(p_issue_date,issue_date);if not found then raise exception 'receivable_not_editable';end if;
 insert into accounts_receivable_history(organization_id,accounts_receivable_id,action,actor_user_id)values(p_organization_id,p_id,'ReceivableUpdated',auth.uid());return p_id;end$$;
create or replace function public.open_receivable(p_organization_id uuid,p_id uuid)returns uuid language plpgsql security definer set search_path=public as $$begin
 if not can_manage_receivables(p_organization_id) then raise exception 'permission_denied';end if;update accounts_receivable set status='open',updated_by=auth.uid() where id=p_id and organization_id=p_organization_id and status='draft';if not found then raise exception 'invalid_transition';end if;
 insert into accounts_receivable_history(organization_id,accounts_receivable_id,action,actor_user_id)values(p_organization_id,p_id,'ReceivableOpened',auth.uid());return p_id;end$$;
create or replace function public.cancel_receivable(p_organization_id uuid,p_id uuid,p_reason text)returns uuid language plpgsql security definer set search_path=public as $$begin
 if not can_manage_receivables(p_organization_id) then raise exception 'permission_denied';end if;update accounts_receivable set status='cancelled',updated_by=auth.uid() where id=p_id and organization_id=p_organization_id and status='open';if not found then raise exception 'invalid_transition';end if;
 update receivable_installment set status='cancelled',updated_by=auth.uid() where accounts_receivable_id=p_id;insert into accounts_receivable_history(organization_id,accounts_receivable_id,action,reason,actor_user_id)values(p_organization_id,p_id,'ReceivableCancelled',p_reason,auth.uid());return p_id;end$$;
create or replace function public.archive_receivable(p_organization_id uuid,p_id uuid)returns uuid language plpgsql security definer set search_path=public as $$begin
 if not can_manage_receivables(p_organization_id) then raise exception 'permission_denied';end if;update accounts_receivable set status='archived',archived_at=now(),updated_by=auth.uid() where id=p_id and organization_id=p_organization_id and status in('draft','paid','cancelled');if not found then raise exception 'invalid_transition';end if;
 insert into accounts_receivable_history(organization_id,accounts_receivable_id,action,actor_user_id)values(p_organization_id,p_id,'ReceivableArchived',auth.uid());return p_id;end$$;

create or replace function public.get_receivable(p_organization_id uuid,p_id uuid)returns jsonb language sql security definer set search_path=public stable as $$select jsonb_build_object('receivable',to_jsonb(r),'installments',coalesce((select jsonb_agg(to_jsonb(i) order by sequence)from receivable_installment i where i.accounts_receivable_id=r.id),'[]'),'history',coalesce((select jsonb_agg(to_jsonb(h)order by created_at desc)from accounts_receivable_history h where h.accounts_receivable_id=r.id),'[]'))from accounts_receivable r where r.id=p_id and r.organization_id=p_organization_id and is_org_member(p_organization_id)$$;
create or replace function public.list_receivables(p_organization_id uuid,p_query text default null,p_status text default null,p_due_from date default null,p_due_to date default null,p_limit int default 50)returns setof accounts_receivable_search language sql security definer set search_path=public stable as $$select * from accounts_receivable_search where organization_id=p_organization_id and is_org_member(p_organization_id) and(p_status is null or status=p_status)and(p_due_from is null or due_date>=p_due_from)and(p_due_to is null or due_date<=p_due_to)and(nullif(trim(p_query),'')is null or search_text like '%'||lower(trim(p_query))||'%')order by due_date,number limit least(greatest(p_limit,1),100)$$;

alter table public.accounts_receivable_counter enable row level security;alter table public.accounts_receivable enable row level security;alter table public.receivable_installment enable row level security;alter table public.accounts_receivable_history enable row level security;alter table public.accounts_receivable_search enable row level security;
create policy ar_member on public.accounts_receivable for select to authenticated using(is_org_member(organization_id));create policy ari_member on public.receivable_installment for select to authenticated using(is_org_member(organization_id));create policy arh_member on public.accounts_receivable_history for select to authenticated using(is_org_member(organization_id));create policy ars_member on public.accounts_receivable_search for select to authenticated using(is_org_member(organization_id));
grant select on public.accounts_receivable,public.receivable_installment,public.accounts_receivable_history,public.accounts_receivable_search to authenticated;
grant execute on function public.create_receivable(uuid,uuid,date,date,numeric,text,text,jsonb,text,uuid),public.update_receivable(uuid,uuid,date,date,text),public.open_receivable(uuid,uuid),public.cancel_receivable(uuid,uuid,text),public.archive_receivable(uuid,uuid),public.get_receivable(uuid,uuid),public.list_receivables(uuid,text,text,date,date,int) to authenticated;
