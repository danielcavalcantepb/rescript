-- Sprint 029 — Accounts Payable Aggregate
-- Obligation to pay supplier after receiving. No payments / bank / settlement.

-- ---------------------------------------------------------------------------
-- Number allocator AP-000001 …
-- ---------------------------------------------------------------------------
create table public.accounts_payable_number_counter (
  organization_id uuid primary key references public.organization (id) on delete restrict,
  last_value bigint not null default 0 check (last_value >= 0)
);

alter table public.accounts_payable_number_counter enable row level security;

create policy accounts_payable_number_counter_select_member
  on public.accounts_payable_number_counter for select to authenticated
  using (public.is_org_member(organization_id));

grant select on public.accounts_payable_number_counter to authenticated;

create or replace function public.allocate_accounts_payable_number(p_organization_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_val bigint;
begin
  if auth.uid() is null or not public.is_org_member(p_organization_id) then
    raise exception 'not_org_member' using errcode = '42501';
  end if;

  insert into public.accounts_payable_number_counter (organization_id, last_value)
  values (p_organization_id, 1)
  on conflict (organization_id) do update
    set last_value = public.accounts_payable_number_counter.last_value + 1
  returning last_value into next_val;

  return 'AP-' || lpad(next_val::text, 6, '0');
end;
$$;

grant execute on function public.allocate_accounts_payable_number(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Accounts payable header
-- ---------------------------------------------------------------------------
create table public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  number text not null,
  -- Supplier snapshot (immutable)
  supplier_id uuid not null references public.supplier (id) on delete restrict,
  supplier_legal_name text not null,
  supplier_document text,
  supplier_email text,
  supplier_phone text,
  -- Purchase snapshot
  purchase_order_id uuid not null references public.purchase_order (id) on delete restrict,
  purchase_number text not null,
  -- Receiving snapshot
  goods_receipt_id uuid not null references public.goods_receipt (id) on delete restrict,
  goods_receipt_number text not null,
  goods_receipt_received_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'cancelled', 'archived')),
  previous_status text
    check (
      previous_status is null
      or previous_status in ('draft', 'approved', 'cancelled')
    ),
  currency text not null default 'BRL' check (char_length(currency) = 3),
  original_amount numeric(18, 4) not null check (original_amount >= 0),
  open_balance numeric(18, 4) not null check (open_balance >= 0),
  issue_date date not null default (timezone('utc', now()))::date,
  notes text check (notes is null or char_length(notes) <= 4000),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint accounts_payable_org_number_uidx unique (organization_id, number),
  constraint accounts_payable_org_receipt_uidx unique (organization_id, goods_receipt_id),
  constraint accounts_payable_balance_chk check (open_balance <= original_amount),
  constraint accounts_payable_archive_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null and archived_by is null)
  )
);

create index accounts_payable_org_status_idx
  on public.accounts_payable (organization_id, status);

create index accounts_payable_org_supplier_idx
  on public.accounts_payable (organization_id, supplier_id);

create index accounts_payable_org_issue_idx
  on public.accounts_payable (organization_id, issue_date desc);

create trigger accounts_payable_set_updated_at
  before update on public.accounts_payable
  for each row execute function public.set_updated_at();

comment on table public.accounts_payable is
  'Supplier payable obligation. Snapshots frozen. No payment/settlement in Sprint 029.';

-- ---------------------------------------------------------------------------
-- Installments
-- ---------------------------------------------------------------------------
create table public.payable_installment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  accounts_payable_id uuid not null references public.accounts_payable (id) on delete restrict,
  sequence integer not null check (sequence >= 1),
  due_date date not null,
  amount numeric(18, 4) not null check (amount > 0),
  open_balance numeric(18, 4) not null check (open_balance >= 0),
  status text not null default 'open'
    check (status in ('open', 'cancelled')),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint payable_installment_unique_seq
    unique (accounts_payable_id, sequence),
  constraint payable_installment_balance_chk check (open_balance <= amount)
);

create index payable_installment_org_due_idx
  on public.payable_installment (organization_id, due_date);

create index payable_installment_org_payable_idx
  on public.payable_installment (organization_id, accounts_payable_id);

create trigger payable_installment_set_updated_at
  before update on public.payable_installment
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- History (append-only)
-- ---------------------------------------------------------------------------
create table public.accounts_payable_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  accounts_payable_id uuid not null references public.accounts_payable (id) on delete restrict,
  action text not null,
  field_name text,
  old_value text,
  new_value text,
  reason text,
  actor_user_id uuid not null references auth.users (id),
  actor_ip text,
  created_at timestamptz not null default now()
);

create index accounts_payable_history_org_payable_created_idx
  on public.accounts_payable_history (organization_id, accounts_payable_id, created_at desc);

create or replace function public.deny_accounts_payable_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('payable.allow_history_admin', true) = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'accounts_payable_history_immutable' using errcode = '42501';
end;
$$;

create trigger accounts_payable_history_no_update
  before update on public.accounts_payable_history
  for each row execute function public.deny_accounts_payable_history_mutation();

create trigger accounts_payable_history_no_delete
  before delete on public.accounts_payable_history
  for each row execute function public.deny_accounts_payable_history_mutation();

-- ---------------------------------------------------------------------------
-- Search projection
-- ---------------------------------------------------------------------------
create table public.accounts_payable_search (
  accounts_payable_id uuid primary key
    references public.accounts_payable (id) on delete cascade,
  organization_id uuid not null references public.organization (id) on delete restrict,
  number text not null,
  supplier_legal_name text not null,
  supplier_document text,
  purchase_number text not null,
  goods_receipt_number text not null,
  status text not null,
  currency text not null,
  original_amount numeric(18, 4) not null,
  open_balance numeric(18, 4) not null,
  issue_date date not null,
  next_due_date date,
  created_at timestamptz not null,
  search_text text not null default '',
  updated_at timestamptz not null default now()
);

create index accounts_payable_search_org_status_idx
  on public.accounts_payable_search (organization_id, status);

create index accounts_payable_search_org_due_idx
  on public.accounts_payable_search (organization_id, next_due_date);

create index accounts_payable_search_org_number_idx
  on public.accounts_payable_search (organization_id, number);

create index accounts_payable_search_org_search_text_idx
  on public.accounts_payable_search using gin (to_tsvector('simple', search_text));

create or replace function public.refresh_accounts_payable_search(p_accounts_payable_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ap public.accounts_payable%rowtype;
  v_next_due date;
begin
  select * into ap from public.accounts_payable where id = p_accounts_payable_id;
  if not found then
    delete from public.accounts_payable_search where accounts_payable_id = p_accounts_payable_id;
    return;
  end if;

  select min(due_date) into v_next_due
  from public.payable_installment
  where accounts_payable_id = ap.id
    and organization_id = ap.organization_id
    and status = 'open'
    and open_balance > 0;

  insert into public.accounts_payable_search (
    accounts_payable_id,
    organization_id,
    number,
    supplier_legal_name,
    supplier_document,
    purchase_number,
    goods_receipt_number,
    status,
    currency,
    original_amount,
    open_balance,
    issue_date,
    next_due_date,
    created_at,
    search_text,
    updated_at
  )
  values (
    ap.id,
    ap.organization_id,
    ap.number,
    ap.supplier_legal_name,
    ap.supplier_document,
    ap.purchase_number,
    ap.goods_receipt_number,
    ap.status,
    ap.currency,
    ap.original_amount,
    ap.open_balance,
    ap.issue_date,
    v_next_due,
    ap.created_at,
    lower(concat_ws(
      ' ',
      ap.number,
      ap.supplier_legal_name,
      coalesce(ap.supplier_document, ''),
      ap.purchase_number,
      ap.goods_receipt_number,
      coalesce(ap.notes, '')
    )),
    now()
  )
  on conflict (accounts_payable_id) do update set
    organization_id = excluded.organization_id,
    number = excluded.number,
    supplier_legal_name = excluded.supplier_legal_name,
    supplier_document = excluded.supplier_document,
    purchase_number = excluded.purchase_number,
    goods_receipt_number = excluded.goods_receipt_number,
    status = excluded.status,
    currency = excluded.currency,
    original_amount = excluded.original_amount,
    open_balance = excluded.open_balance,
    issue_date = excluded.issue_date,
    next_due_date = excluded.next_due_date,
    created_at = excluded.created_at,
    search_text = excluded.search_text,
    updated_at = now();
end;
$$;

create or replace function public.trg_refresh_accounts_payable_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_accounts_payable_search(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create trigger accounts_payable_search_refresh
  after insert or update on public.accounts_payable
  for each row execute function public.trg_refresh_accounts_payable_search();

create or replace function public.trg_refresh_accounts_payable_search_from_installment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_accounts_payable_search(
    coalesce(new.accounts_payable_id, old.accounts_payable_id)
  );
  return coalesce(new, old);
end;
$$;

create trigger payable_installment_search_refresh
  after insert or update or delete on public.payable_installment
  for each row execute function public.trg_refresh_accounts_payable_search_from_installment();

grant execute on function public.refresh_accounts_payable_search(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.accounts_payable enable row level security;
alter table public.payable_installment enable row level security;
alter table public.accounts_payable_history enable row level security;
alter table public.accounts_payable_search enable row level security;

create policy accounts_payable_select_member
  on public.accounts_payable for select to authenticated
  using (public.is_org_member(organization_id));

create policy accounts_payable_insert_member
  on public.accounts_payable for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy accounts_payable_update_member
  on public.accounts_payable for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy payable_installment_select_member
  on public.payable_installment for select to authenticated
  using (public.is_org_member(organization_id));

create policy payable_installment_insert_member
  on public.payable_installment for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy payable_installment_update_member
  on public.payable_installment for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy accounts_payable_history_select_member
  on public.accounts_payable_history for select to authenticated
  using (public.is_org_member(organization_id));

create policy accounts_payable_history_insert_member
  on public.accounts_payable_history for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and actor_user_id = auth.uid()
  );

create policy accounts_payable_search_select_member
  on public.accounts_payable_search for select to authenticated
  using (public.is_org_member(organization_id));

grant select, insert, update on public.accounts_payable to authenticated;
grant select, insert, update on public.payable_installment to authenticated;
grant select, insert on public.accounts_payable_history to authenticated;
grant select on public.accounts_payable_search to authenticated;
