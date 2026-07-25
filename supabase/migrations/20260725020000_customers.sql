-- Customers bounded context (reference module)
-- Tenant isolation via is_org_member; app enforces customers.* permissions.

create table public.customer (
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
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint customer_archive_status_chk check (
    (status = 'inactive' and archived_at is not null)
    or (status = 'active' and archived_at is null and archived_by is null)
  )
);

create index customer_org_status_idx
  on public.customer (organization_id, status);

create index customer_org_name_idx
  on public.customer (organization_id, name);

create index customer_org_created_idx
  on public.customer (organization_id, created_at desc);

-- Unique document per org when present (normalized digits stored by app)
create unique index customer_org_document_uidx
  on public.customer (organization_id, document)
  where document is not null and document <> '';

create trigger customer_set_updated_at
  before update on public.customer
  for each row execute function public.set_updated_at();

comment on table public.customer is
  'Commercial customer aggregate. Soft-archive via status+archived_at; never hard delete.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.customer enable row level security;

create policy customer_select_member
  on public.customer
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy customer_insert_member
  on public.customer
  for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy customer_update_member
  on public.customer
  for update
  to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- No DELETE policy — archive via UPDATE only

grant select, insert, update on public.customer to authenticated;
