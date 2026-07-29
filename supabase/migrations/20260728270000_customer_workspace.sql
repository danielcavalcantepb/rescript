-- Customer Workspace: additive expansion of the existing Customer aggregate.
-- Existing customers are preserved and receive the organization's default branch.

alter table public.customer
  add column if not exists company_id uuid references public.organization(id) on delete restrict,
  add column if not exists branch_id uuid references public.branch(id) on delete restrict,
  add column if not exists short_name text,
  add column if not exists secondary_phone text,
  add column if not exists instagram text,
  add column if not exists acquisition_source_id uuid,
  add column if not exists acquisition_source_other text,
  add column if not exists gender text,
  add column if not exists birth_day smallint,
  add column if not exists birth_month smallint,
  add column if not exists rg text,
  add column if not exists state_registration text,
  add column if not exists municipal_registration text,
  add column if not exists legal_representative text,
  add column if not exists commercial_phone text;

create table if not exists public.customer_acquisition_source (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 80),
  code text not null check (code ~ '^[a-z0-9_]+$'),
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  archived_at timestamptz,
  unique (organization_id, code)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'customer_acquisition_source_fk') then
    alter table public.customer add constraint customer_acquisition_source_fk
      foreign key (acquisition_source_id)
      references public.customer_acquisition_source(id) on delete restrict;
  end if;
end $$;

create table if not exists public.customer_dependent (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  company_id uuid not null references public.organization(id) on delete restrict,
  branch_id uuid not null references public.branch(id) on delete restrict,
  customer_id uuid not null references public.customer(id) on delete restrict,
  full_name text not null check (char_length(trim(full_name)) between 1 and 200),
  birth_day smallint check (birth_day between 1 and 31),
  birth_month smallint check (birth_month between 1 and 12),
  relationship text,
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'active' check (status in ('active','archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id)
);

-- Seed each organization with the canonical initial catalog once a member acts.
-- The application may create organization-specific sources; no global source is used.
create or replace function public.ensure_customer_acquisition_sources(p_org uuid, p_actor uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_org_member(p_org) then raise exception 'not_org_member' using errcode='42501'; end if;
  insert into public.customer_acquisition_source(organization_id,name,code,created_by,updated_by)
  values
    (p_org,'Instagram','instagram',p_actor,p_actor),
    (p_org,'Indicação','indication',p_actor,p_actor),
    (p_org,'Google','google',p_actor,p_actor),
    (p_org,'WhatsApp','whatsapp',p_actor,p_actor),
    (p_org,'Loja física','store',p_actor,p_actor),
    (p_org,'Evento','event',p_actor,p_actor),
    (p_org,'Campanha','campaign',p_actor,p_actor),
    (p_org,'Outro','other',p_actor,p_actor)
  on conflict (organization_id,code) do nothing;
end;
$$;

-- Preserve existing data with organization as the current company boundary and
-- the active default branch. A missing default branch is a migration failure.
update public.customer c
set company_id = c.organization_id,
    branch_id = b.id,
    short_name = coalesce(nullif(c.trade_name, ''), c.name)
from public.branch b
where b.organization_id = c.organization_id
  and b.is_default
  and b.status = 'active'
  and (c.company_id is null or c.branch_id is null or c.short_name is null);

do $$
begin
  if exists (select 1 from public.customer where company_id is null or branch_id is null or short_name is null) then
    raise exception 'customer_scope_backfill_requires_default_branch';
  end if;
end $$;

alter table public.customer
  alter column company_id set not null,
  alter column branch_id set not null,
  alter column short_name set not null,
  add constraint customer_short_name_chk check (char_length(trim(short_name)) between 1 and 200),
  add constraint customer_birth_day_chk check (birth_day is null or birth_day between 1 and 31),
  add constraint customer_birth_month_chk check (birth_month is null or birth_month between 1 and 12),
  add constraint customer_acquisition_other_chk check (
    acquisition_source_other is null or char_length(trim(acquisition_source_other)) between 1 and 240
  );

create index if not exists customer_scope_status_created_idx
  on public.customer(organization_id, company_id, branch_id, status, created_at desc);
create index if not exists customer_org_phone_idx
  on public.customer(organization_id, phone) where phone is not null and phone <> '';
create index if not exists customer_org_email_idx
  on public.customer(organization_id, lower(email)) where email is not null and email <> '';
create index if not exists customer_dependent_scope_customer_idx
  on public.customer_dependent(organization_id, company_id, branch_id, customer_id, status);

alter table public.customer_search
  add column if not exists short_name text,
  add column if not exists instagram text,
  add column if not exists city text;

create or replace function public.refresh_customer_search(p_customer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c public.customer%rowtype; contact_bits text;
begin
  select * into c from public.customer where id = p_customer_id;
  if not found then delete from public.customer_search where customer_id = p_customer_id; return; end if;
  select coalesce(string_agg(distinct concat_ws(' ', cc.name, cc.email, cc.phone), ' '), '') into contact_bits
  from public.customer_contact cc where cc.customer_id = p_customer_id and cc.status <> 'archived';
  insert into public.customer_search(customer_id, organization_id, legal_name, trade_name, short_name, document_digits, email, phone, instagram, city, status, search_text, updated_at)
  values (c.id, c.organization_id, c.name, c.trade_name, c.short_name, nullif(c.document, ''), c.email, c.phone, c.instagram, c.city, c.status,
    lower(concat_ws(' ', c.name, coalesce(c.short_name, ''), coalesce(c.trade_name, ''), coalesce(c.document, ''), coalesce(c.email, ''), coalesce(c.phone, ''), coalesce(c.instagram, ''), coalesce(c.city, ''), contact_bits)), now())
  on conflict (customer_id) do update set organization_id = excluded.organization_id, legal_name = excluded.legal_name, trade_name = excluded.trade_name, short_name = excluded.short_name, document_digits = excluded.document_digits, email = excluded.email, phone = excluded.phone, instagram = excluded.instagram, city = excluded.city, status = excluded.status, search_text = excluded.search_text, updated_at = now();
end;
$$;

select public.refresh_customer_search(id) from public.customer;

create or replace function public.customer_workspace_scope_guard()
returns trigger language plpgsql set search_path = public as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.branch where id = new.branch_id;
  if v_org is null or v_org <> new.organization_id or new.company_id <> new.organization_id then
    raise exception 'customer_scope_invalid' using errcode='22023';
  end if;
  if new.acquisition_source_id is not null and not exists (
    select 1 from public.customer_acquisition_source s
    where s.id = new.acquisition_source_id and s.organization_id = new.organization_id and s.status = 'active'
  ) then raise exception 'customer_acquisition_source_invalid' using errcode='22023'; end if;
  return new;
end;
$$;

drop trigger if exists customer_workspace_scope_guard on public.customer;
create trigger customer_workspace_scope_guard before insert or update on public.customer
for each row execute function public.customer_workspace_scope_guard();

create or replace function public.customer_dependent_scope_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (
    select 1 from public.customer c
    where c.id = new.customer_id and c.organization_id = new.organization_id
      and c.company_id = new.company_id and c.branch_id = new.branch_id
  ) then raise exception 'customer_dependent_scope_invalid' using errcode='22023'; end if;
  return new;
end;
$$;

create trigger customer_dependent_scope_guard before insert or update on public.customer_dependent
for each row execute function public.customer_dependent_scope_guard();

create trigger customer_acquisition_source_set_updated_at before update on public.customer_acquisition_source
for each row execute function public.set_updated_at();
create trigger customer_dependent_set_updated_at before update on public.customer_dependent
for each row execute function public.set_updated_at();

alter table public.customer_acquisition_source enable row level security;
alter table public.customer_dependent enable row level security;

create policy customer_acquisition_source_select on public.customer_acquisition_source
for select to authenticated using (public.is_org_member(organization_id));
create policy customer_acquisition_source_insert on public.customer_acquisition_source
for insert to authenticated with check (public.is_org_member(organization_id) and created_by = auth.uid() and updated_by = auth.uid());
create policy customer_acquisition_source_update on public.customer_acquisition_source
for update to authenticated using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id) and updated_by = auth.uid());
create policy customer_dependent_select on public.customer_dependent
for select to authenticated using (public.is_org_member(organization_id));
create policy customer_dependent_insert on public.customer_dependent
for insert to authenticated with check (public.is_org_member(organization_id) and created_by = auth.uid() and updated_by = auth.uid());
create policy customer_dependent_update on public.customer_dependent
for update to authenticated using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id) and updated_by = auth.uid());

grant select, insert, update on public.customer_acquisition_source, public.customer_dependent to authenticated;
grant execute on function public.ensure_customer_acquisition_sources(uuid,uuid) to authenticated;
