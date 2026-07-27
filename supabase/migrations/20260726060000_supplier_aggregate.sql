-- Sprint 026 — Supplier Aggregate (Phase 6B)
-- Mirrors Customer Aggregate; independent procurement party master data.
-- Never hard-delete suppliers. person_type immutable after insert.

create table public.supplier (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  name text not null check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 200
  ),
  trade_name text check (
    trade_name is null or char_length(trade_name) <= 200
  ),
  person_type text not null check (person_type in ('PF', 'PJ')),
  document text check (
    document is null or document = '' or char_length(document) <= 32
  ),
  email text check (
    email is null or char_length(email) <= 254
  ),
  phone text check (
    phone is null or char_length(phone) <= 40
  ),
  city text check (
    city is null or char_length(city) <= 120
  ),
  notes text check (
    notes is null or char_length(notes) <= 2000
  ),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'inactive', 'archived')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint supplier_archive_status_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null and archived_by is null)
  )
);

create index supplier_org_status_idx
  on public.supplier (organization_id, status);

create index supplier_org_name_idx
  on public.supplier (organization_id, name);

create index supplier_org_created_idx
  on public.supplier (organization_id, created_at desc);

create unique index supplier_org_document_uidx
  on public.supplier (organization_id, document)
  where document is not null and document <> '';

create trigger supplier_set_updated_at
  before update on public.supplier
  for each row execute function public.set_updated_at();

comment on table public.supplier is
  'Procurement supplier aggregate. Soft-archive via status+archived_at; never hard delete.';

create or replace function public.deny_supplier_person_type_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.person_type is distinct from new.person_type then
    raise exception 'supplier_person_type_immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger supplier_person_type_immutable
  before update on public.supplier
  for each row execute function public.deny_supplier_person_type_change();

alter table public.supplier enable row level security;

create policy supplier_select_member
  on public.supplier for select to authenticated
  using (public.is_org_member(organization_id));

create policy supplier_insert_member
  on public.supplier for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy supplier_update_member
  on public.supplier for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

grant select, insert, update on public.supplier to authenticated;

-- Contacts
-- ---------------------------------------------------------------------------
create table public.supplier_contact (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  supplier_id uuid not null references public.supplier (id) on delete restrict,
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
  constraint supplier_contact_archive_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null)
  )
);

create index supplier_contact_org_supplier_idx
  on public.supplier_contact (organization_id, supplier_id);

create unique index supplier_contact_one_primary_uidx
  on public.supplier_contact (supplier_id)
  where is_primary = true and status <> 'archived';

create trigger supplier_contact_set_updated_at
  before update on public.supplier_contact
  for each row execute function public.set_updated_at();

comment on table public.supplier_contact is
  'Supplier contacts. Soft-archive only; never hard delete from app.';

-- ---------------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------------
create table public.supplier_address (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  supplier_id uuid not null references public.supplier (id) on delete restrict,
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
  constraint supplier_address_archive_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null)
  )
);

create index supplier_address_org_supplier_idx
  on public.supplier_address (organization_id, supplier_id);

create unique index supplier_address_one_primary_kind_uidx
  on public.supplier_address (supplier_id, kind)
  where is_primary = true and status <> 'archived';

create trigger supplier_address_set_updated_at
  before update on public.supplier_address
  for each row execute function public.set_updated_at();

comment on table public.supplier_address is
  'Supplier addresses (billing/shipping/other). Soft-archive only.';

-- ---------------------------------------------------------------------------
-- History (append-only audit)
-- ---------------------------------------------------------------------------
create table public.supplier_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  supplier_id uuid not null references public.supplier (id) on delete restrict,
  action text not null,
  field_name text,
  old_value text,
  new_value text,
  reason text,
  actor_user_id uuid not null references auth.users (id),
  actor_ip text,
  created_at timestamptz not null default now()
);

create index supplier_history_org_supplier_created_idx
  on public.supplier_history (organization_id, supplier_id, created_at desc);

create or replace function public.deny_supplier_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('supplier.allow_history_admin', true) = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'supplier_history_immutable' using errcode = '42501';
end;
$$;

create trigger supplier_history_no_update
  before update on public.supplier_history
  for each row execute function public.deny_supplier_history_mutation();

create trigger supplier_history_no_delete
  before delete on public.supplier_history
  for each row execute function public.deny_supplier_history_mutation();

comment on table public.supplier_history is
  'Append-only supplier audit trail. Soft delete forbidden.';

-- ---------------------------------------------------------------------------
-- Search projection (never reconstruct aggregate for list/search)
-- ---------------------------------------------------------------------------
create table public.supplier_search (
  supplier_id uuid primary key references public.supplier (id) on delete cascade,
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

create index supplier_search_org_status_idx
  on public.supplier_search (organization_id, status);

create index supplier_search_org_legal_name_idx
  on public.supplier_search (organization_id, legal_name);

create index supplier_search_org_document_idx
  on public.supplier_search (organization_id, document_digits)
  where document_digits is not null and document_digits <> '';

create index supplier_search_org_search_text_idx
  on public.supplier_search using gin (to_tsvector('simple', search_text));

create or replace function public.refresh_supplier_search(p_supplier_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.supplier%rowtype;
  contact_bits text;
begin
  select * into c from public.supplier where id = p_supplier_id;
  if not found then
    delete from public.supplier_search where supplier_id = p_supplier_id;
    return;
  end if;

  select coalesce(
    string_agg(distinct concat_ws(' ', cc.name, cc.email, cc.phone), ' '),
    ''
  )
  into contact_bits
  from public.supplier_contact cc
  where cc.supplier_id = p_supplier_id
    and cc.status <> 'archived';

  insert into public.supplier_search (
    supplier_id,
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
  on conflict (supplier_id) do update set
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

create or replace function public.trg_refresh_supplier_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'supplier_contact' then
    perform public.refresh_supplier_search(coalesce(new.supplier_id, old.supplier_id));
  else
    perform public.refresh_supplier_search(coalesce(new.id, old.id));
  end if;
  return coalesce(new, old);
end;
$$;

create trigger supplier_search_refresh
  after insert or update on public.supplier
  for each row execute function public.trg_refresh_supplier_search();

create trigger supplier_contact_search_refresh
  after insert or update on public.supplier_contact
  for each row execute function public.trg_refresh_supplier_search();

-- Backfill projection for existing rows
insert into public.supplier_search (
  supplier_id, organization_id, legal_name, trade_name, document_digits,
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
from public.supplier c
on conflict (supplier_id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.supplier_contact enable row level security;
alter table public.supplier_address enable row level security;
alter table public.supplier_history enable row level security;
alter table public.supplier_search enable row level security;

create policy supplier_contact_select_member
  on public.supplier_contact for select to authenticated
  using (public.is_org_member(organization_id));

create policy supplier_contact_insert_member
  on public.supplier_contact for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy supplier_contact_update_member
  on public.supplier_contact for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy supplier_address_select_member
  on public.supplier_address for select to authenticated
  using (public.is_org_member(organization_id));

create policy supplier_address_insert_member
  on public.supplier_address for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy supplier_address_update_member
  on public.supplier_address for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy supplier_history_select_member
  on public.supplier_history for select to authenticated
  using (public.is_org_member(organization_id));

create policy supplier_history_insert_member
  on public.supplier_history for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and actor_user_id = auth.uid()
  );

create policy supplier_search_select_member
  on public.supplier_search for select to authenticated
  using (public.is_org_member(organization_id));

-- Search writes only via SECURITY DEFINER refresh; no client insert/update/delete.

grant select, insert, update on public.supplier_contact to authenticated;
grant select, insert, update on public.supplier_address to authenticated;
grant select, insert on public.supplier_history to authenticated;
grant select on public.supplier_search to authenticated;

grant execute on function public.refresh_supplier_search(uuid) to authenticated;
