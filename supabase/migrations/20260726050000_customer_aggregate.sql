-- Sprint 025 — Customer Aggregate (Phase 6A)
-- Extends public.customer; adds contacts, addresses, history, search projection.
-- Never hard-delete customers. person_type immutable after insert.

-- ---------------------------------------------------------------------------
-- Status: draft | active | inactive | archived
-- ---------------------------------------------------------------------------
alter table public.customer drop constraint if exists customer_archive_status_chk;
alter table public.customer drop constraint if exists customer_status_check;
alter table public.customer drop constraint if exists customer_status_chk;

do $$
declare
  cname text;
begin
  for cname in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'customer'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.customer drop constraint if exists %I', cname);
  end loop;
end $$;

-- Map legacy inactive+archived → archived
update public.customer
set status = 'archived'
where status = 'inactive' and archived_at is not null;

alter table public.customer
  add constraint customer_status_chk
  check (status in ('draft', 'active', 'inactive', 'archived'));

alter table public.customer
  add constraint customer_archive_status_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null and archived_by is null)
  );

-- Immutable person_type
create or replace function public.deny_customer_person_type_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.person_type is distinct from new.person_type then
    raise exception 'customer_person_type_immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists customer_person_type_immutable on public.customer;
create trigger customer_person_type_immutable
  before update on public.customer
  for each row execute function public.deny_customer_person_type_change();

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------
create table public.customer_contact (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  customer_id uuid not null references public.customer (id) on delete restrict,
  name text not null check (
    char_length(trim(name)) >= 1 and char_length(name) <= 200
  ),
  role_title text check (role_title is null or char_length(role_title) <= 120),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  is_primary boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint customer_contact_archive_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null)
  )
);

create index customer_contact_org_customer_idx
  on public.customer_contact (organization_id, customer_id);

create unique index customer_contact_one_primary_uidx
  on public.customer_contact (customer_id)
  where is_primary = true and status <> 'archived';

create trigger customer_contact_set_updated_at
  before update on public.customer_contact
  for each row execute function public.set_updated_at();

comment on table public.customer_contact is
  'Customer contacts. Soft-archive only; never hard delete from app.';

-- ---------------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------------
create table public.customer_address (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  customer_id uuid not null references public.customer (id) on delete restrict,
  kind text not null check (kind in ('billing', 'shipping', 'other')),
  postal_code text not null check (
    char_length(trim(postal_code)) >= 1 and char_length(postal_code) <= 16
  ),
  street text not null check (
    char_length(trim(street)) >= 1 and char_length(street) <= 200
  ),
  number text check (number is null or char_length(number) <= 32),
  complement text check (complement is null or char_length(complement) <= 120),
  district text check (district is null or char_length(district) <= 120),
  city text not null check (
    char_length(trim(city)) >= 1 and char_length(city) <= 120
  ),
  state text not null check (
    char_length(trim(state)) >= 1 and char_length(state) <= 64
  ),
  country text not null default 'BR' check (
    char_length(trim(country)) >= 2 and char_length(country) <= 2
  ),
  is_primary boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint customer_address_archive_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null)
  )
);

create index customer_address_org_customer_idx
  on public.customer_address (organization_id, customer_id);

create unique index customer_address_one_primary_kind_uidx
  on public.customer_address (customer_id, kind)
  where is_primary = true and status <> 'archived';

create trigger customer_address_set_updated_at
  before update on public.customer_address
  for each row execute function public.set_updated_at();

comment on table public.customer_address is
  'Customer addresses (billing/shipping/other). Soft-archive only.';

-- ---------------------------------------------------------------------------
-- History (append-only audit)
-- ---------------------------------------------------------------------------
create table public.customer_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  customer_id uuid not null references public.customer (id) on delete restrict,
  action text not null,
  field_name text,
  old_value text,
  new_value text,
  reason text,
  actor_user_id uuid not null references auth.users (id),
  actor_ip text,
  created_at timestamptz not null default now()
);

create index customer_history_org_customer_created_idx
  on public.customer_history (organization_id, customer_id, created_at desc);

create or replace function public.deny_customer_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('customer.allow_history_admin', true) = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'customer_history_immutable' using errcode = '42501';
end;
$$;

create trigger customer_history_no_update
  before update on public.customer_history
  for each row execute function public.deny_customer_history_mutation();

create trigger customer_history_no_delete
  before delete on public.customer_history
  for each row execute function public.deny_customer_history_mutation();

comment on table public.customer_history is
  'Append-only customer audit trail. Soft delete forbidden.';

-- ---------------------------------------------------------------------------
-- Search projection (never reconstruct aggregate for list/search)
-- ---------------------------------------------------------------------------
create table public.customer_search (
  customer_id uuid primary key references public.customer (id) on delete cascade,
  organization_id uuid not null references public.organization (id) on delete restrict,
  legal_name text not null,
  trade_name text,
  document_digits text,
  email text,
  phone text,
  status text not null,
  search_text text not null default '',
  updated_at timestamptz not null default now()
);

create index customer_search_org_status_idx
  on public.customer_search (organization_id, status);

create index customer_search_org_legal_name_idx
  on public.customer_search (organization_id, legal_name);

create index customer_search_org_document_idx
  on public.customer_search (organization_id, document_digits)
  where document_digits is not null and document_digits <> '';

create index customer_search_org_search_text_idx
  on public.customer_search using gin (to_tsvector('simple', search_text));

create or replace function public.refresh_customer_search(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.customer%rowtype;
  contact_bits text;
begin
  select * into c from public.customer where id = p_customer_id;
  if not found then
    delete from public.customer_search where customer_id = p_customer_id;
    return;
  end if;

  select coalesce(
    string_agg(distinct concat_ws(' ', cc.name, cc.email, cc.phone), ' '),
    ''
  )
  into contact_bits
  from public.customer_contact cc
  where cc.customer_id = p_customer_id
    and cc.status <> 'archived';

  insert into public.customer_search (
    customer_id,
    organization_id,
    legal_name,
    trade_name,
    document_digits,
    email,
    phone,
    status,
    search_text,
    updated_at
  )
  values (
    c.id,
    c.organization_id,
    c.name,
    c.trade_name,
    nullif(c.document, ''),
    c.email,
    c.phone,
    c.status,
    lower(concat_ws(
      ' ',
      c.name,
      coalesce(c.trade_name, ''),
      coalesce(c.document, ''),
      coalesce(c.email, ''),
      coalesce(c.phone, ''),
      coalesce(c.city, ''),
      contact_bits
    )),
    now()
  )
  on conflict (customer_id) do update set
    organization_id = excluded.organization_id,
    legal_name = excluded.legal_name,
    trade_name = excluded.trade_name,
    document_digits = excluded.document_digits,
    email = excluded.email,
    phone = excluded.phone,
    status = excluded.status,
    search_text = excluded.search_text,
    updated_at = now();
end;
$$;

create or replace function public.trg_refresh_customer_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'customer_contact' then
    perform public.refresh_customer_search(coalesce(new.customer_id, old.customer_id));
  else
    perform public.refresh_customer_search(coalesce(new.id, old.id));
  end if;
  return coalesce(new, old);
end;
$$;

create trigger customer_search_refresh
  after insert or update on public.customer
  for each row execute function public.trg_refresh_customer_search();

create trigger customer_contact_search_refresh
  after insert or update on public.customer_contact
  for each row execute function public.trg_refresh_customer_search();

-- Backfill projection for existing rows
insert into public.customer_search (
  customer_id, organization_id, legal_name, trade_name, document_digits,
  email, phone, status, search_text, updated_at
)
select
  c.id,
  c.organization_id,
  c.name,
  c.trade_name,
  nullif(c.document, ''),
  c.email,
  c.phone,
  c.status,
  lower(concat_ws(
    ' ',
    c.name,
    coalesce(c.trade_name, ''),
    coalesce(c.document, ''),
    coalesce(c.email, ''),
    coalesce(c.phone, ''),
    coalesce(c.city, '')
  )),
  now()
from public.customer c
on conflict (customer_id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.customer_contact enable row level security;
alter table public.customer_address enable row level security;
alter table public.customer_history enable row level security;
alter table public.customer_search enable row level security;

create policy customer_contact_select_member
  on public.customer_contact for select to authenticated
  using (public.is_org_member(organization_id));

create policy customer_contact_insert_member
  on public.customer_contact for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy customer_contact_update_member
  on public.customer_contact for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy customer_address_select_member
  on public.customer_address for select to authenticated
  using (public.is_org_member(organization_id));

create policy customer_address_insert_member
  on public.customer_address for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy customer_address_update_member
  on public.customer_address for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy customer_history_select_member
  on public.customer_history for select to authenticated
  using (public.is_org_member(organization_id));

create policy customer_history_insert_member
  on public.customer_history for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and actor_user_id = auth.uid()
  );

create policy customer_search_select_member
  on public.customer_search for select to authenticated
  using (public.is_org_member(organization_id));

-- Search writes only via SECURITY DEFINER refresh; no client insert/update/delete.

grant select, insert, update on public.customer_contact to authenticated;
grant select, insert, update on public.customer_address to authenticated;
grant select, insert on public.customer_history to authenticated;
grant select on public.customer_search to authenticated;

grant execute on function public.refresh_customer_search(uuid) to authenticated;
