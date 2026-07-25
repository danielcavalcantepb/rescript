-- Organizations + Memberships (first persistence sprint)
-- Tables: organization, membership
-- Permissions catalog stays in application code (role presets → permission keys).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- organization
-- ---------------------------------------------------------------------------
create table public.organization (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  slug text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'canceled')),
  currency text not null default 'BRL' check (currency = 'BRL'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  version integer not null default 1 check (version >= 1),
  constraint organization_slug_unique unique (slug)
);

create index organization_created_by_idx on public.organization (created_by);
create index organization_status_idx on public.organization (status);

comment on table public.organization is 'Tenant root. Access only via active membership.';

-- ---------------------------------------------------------------------------
-- membership
-- ---------------------------------------------------------------------------
create table public.membership (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  role text not null
    check (role in ('owner', 'admin', 'manager', 'seller', 'inventory', 'finance', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'removed')),
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  constraint membership_owner_role_chk check (
    (is_owner = true and role = 'owner')
    or (is_owner = false and role <> 'owner')
  )
);

-- One non-removed membership per user per organization
create unique index membership_org_user_active_uidx
  on public.membership (organization_id, user_id)
  where status <> 'removed';

-- Exactly one owner membership per organization (active)
create unique index membership_one_owner_uidx
  on public.membership (organization_id)
  where is_owner = true and status = 'active';

create index membership_user_status_idx
  on public.membership (user_id, status);

create index membership_org_status_idx
  on public.membership (organization_id, status);

comment on table public.membership is 'User↔organization access. Role is a preset; permissions derived in app code.';

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organization_set_updated_at
  before update on public.organization
  for each row execute function public.set_updated_at();

create trigger membership_set_updated_at
  before update on public.membership
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS helpers (SECURITY DEFINER, locked search_path)
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membership m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

create or replace function public.is_org_owner(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membership m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.is_owner = true
  );
$$;

revoke all on function public.is_org_owner(uuid) from public;
grant execute on function public.is_org_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- create_organization — atomic first/next org + owner membership
-- Why SECURITY DEFINER: RLS would otherwise block INSERT of org/membership
-- before the membership that grants access exists (bootstrap problem).
-- ---------------------------------------------------------------------------
create or replace function public.create_organization(p_name text)
returns public.organization
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(p_name);
  v_slug text;
  v_org public.organization;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if v_name is null or char_length(v_name) < 2 then
    raise exception 'invalid_organization_name' using errcode = '22023';
  end if;

  -- Serialize retries / double-clicks per user
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  v_slug :=
    lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'org';
  end if;
  v_slug := left(v_slug, 48) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.organization (name, slug, status, currency, created_by)
  values (v_name, v_slug, 'active', 'BRL', v_uid)
  returning * into v_org;

  insert into public.membership (
    organization_id,
    user_id,
    role,
    status,
    is_owner,
    created_by
  ) values (
    v_org.id,
    v_uid,
    'owner',
    'active',
    true,
    v_uid
  );

  return v_org;
end;
$$;

revoke all on function public.create_organization(text) from public;
grant execute on function public.create_organization(text) to authenticated;

comment on function public.create_organization(text) is
  'Atomically creates organization + owner membership for auth.uid(). Client cannot supply user_id or role.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.organization enable row level security;
alter table public.membership enable row level security;

-- organization: members see their orgs; updates for owners only; no direct insert
create policy organization_select_member
  on public.organization
  for select
  to authenticated
  using (public.is_org_member(id));

create policy organization_update_owner
  on public.organization
  for update
  to authenticated
  using (public.is_org_owner(id))
  with check (public.is_org_owner(id));

-- membership: members of an org can list memberships of that org
create policy membership_select_same_org
  on public.membership
  for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Direct mutations blocked for clients — use secure functions later (invite, etc.)
-- No INSERT/UPDATE/DELETE policies for authenticated on membership/organization
-- (create_organization bypasses RLS as SECURITY DEFINER)

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, update on public.organization to authenticated;
grant select on public.membership to authenticated;
