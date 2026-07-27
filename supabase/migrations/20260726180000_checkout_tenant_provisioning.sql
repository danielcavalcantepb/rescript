-- Checkout & Tenant Provisioning Foundation
-- No gateway, no charge, no invoice, no ERP financial side effects.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- SaaS plans / entitlements foundation
-- ---------------------------------------------------------------------------
create table if not exists public.saas_plan (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('starter', 'growth', 'business', 'enterprise')),
  name text not null,
  marketing_label text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_plan_version (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.saas_plan(id) on delete restrict,
  version integer not null check (version >= 1),
  effective_from timestamptz not null default now(),
  trial_days integer not null default 14 check (trial_days >= 0),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  unique(plan_id, version)
);

create table if not exists public.saas_plan_price (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.saas_plan_version(id) on delete restrict,
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  currency text not null default 'BRL' check (currency = 'BRL'),
  amount numeric(18, 2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  unique(plan_version_id, billing_cycle, currency)
);

create table if not exists public.entitlement_definition (
  key text primary key,
  type text not null check (type in ('boolean', 'limit', 'quota')),
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saas_plan_entitlement (
  plan_version_id uuid not null references public.saas_plan_version(id) on delete cascade,
  entitlement_key text not null references public.entitlement_definition(key) on delete restrict,
  value jsonb not null,
  created_at timestamptz not null default now(),
  primary key (plan_version_id, entitlement_key)
);

create table if not exists public.organization_entitlement_override (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  entitlement_key text not null references public.entitlement_definition(key) on delete restrict,
  value jsonb not null,
  reason text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.feature_flag (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  scope text not null check (scope in ('global', 'organization')),
  organization_id uuid references public.organization(id) on delete restrict,
  enabled boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_flag_scope_chk check (
    (scope = 'global' and organization_id is null)
    or (scope = 'organization' and organization_id is not null)
  ),
  unique(key, scope, organization_id)
);

insert into public.saas_plan(code, name, marketing_label)
values
  ('starter', 'Starter', 'Para começar com controle'),
  ('growth', 'Growth', 'Para conectar áreas e crescer'),
  ('business', 'Business', 'Para operação com volume'),
  ('enterprise', 'Enterprise', 'Para governança avançada')
on conflict (code) do update
set name = excluded.name,
    marketing_label = excluded.marketing_label,
    updated_at = now();

insert into public.saas_plan_version(plan_id, version, trial_days)
select id, 1, 14 from public.saas_plan
on conflict (plan_id, version) do nothing;

insert into public.saas_plan_price(plan_version_id, billing_cycle, currency, amount)
select pv.id, cycle.billing_cycle, 'BRL', 0
from public.saas_plan_version pv
cross join (values ('monthly'), ('yearly')) as cycle(billing_cycle)
on conflict (plan_version_id, billing_cycle, currency) do nothing;

insert into public.entitlement_definition(key, type, description)
values
  ('module.crm', 'boolean', 'Relacionamento e cadastro de clientes'),
  ('module.sales', 'boolean', 'Fluxo comercial'),
  ('module.inventory', 'boolean', 'Controle operacional de estoque'),
  ('module.finance', 'boolean', 'Financeiro operacional'),
  ('max_users', 'limit', 'Limite de usuários ativos'),
  ('max_sales_per_month', 'quota', 'Limite de vendas mensais')
on conflict (key) do nothing;

insert into public.saas_plan_entitlement(plan_version_id, entitlement_key, value)
select pv.id, e.key, e.value
from public.saas_plan p
join public.saas_plan_version pv on pv.plan_id = p.id and pv.version = 1
join lateral (
  values
    ('module.crm', 'true'::jsonb),
    ('module.sales', 'true'::jsonb),
    ('module.inventory', 'true'::jsonb),
    ('module.finance', 'true'::jsonb),
    ('max_users',
      case p.code
        when 'starter' then '3'::jsonb
        when 'growth' then '10'::jsonb
        when 'business' then '30'::jsonb
        else '"unlimited"'::jsonb
      end
    ),
    ('max_sales_per_month',
      case p.code
        when 'starter' then '300'::jsonb
        when 'growth' then '1500'::jsonb
        when 'business' then '5000'::jsonb
        else '"unlimited"'::jsonb
      end
    )
) as e(key, value) on true
on conflict (plan_version_id, entitlement_key) do nothing;

-- ---------------------------------------------------------------------------
-- Subscription
-- ---------------------------------------------------------------------------
create table public.subscription (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  plan_version_id uuid not null references public.saas_plan_version(id) on delete restrict,
  status text not null check (status in ('trial', 'active', 'past_due', 'suspended', 'canceled')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  currency text not null default 'BRL' check (currency = 'BRL'),
  trial_ends_at timestamptz,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  external_billing_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  unique(organization_id)
);

create table public.subscription_event (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete restrict,
  subscription_id uuid not null references public.subscription(id) on delete restrict,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create trigger subscription_set_updated_at
  before update on public.subscription
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Checkout Session
-- ---------------------------------------------------------------------------
create table public.checkout_session (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null default gen_random_uuid(),
  status text not null default 'CREATED'
    check (status in ('CREATED', 'STARTED', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'FAILED')),
  selected_plan text not null check (selected_plan in ('starter', 'growth', 'business', 'enterprise')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  organization_name text check (organization_name is null or char_length(trim(organization_name)) >= 2),
  organization_slug text,
  owner_name text check (owner_name is null or char_length(trim(owner_name)) >= 2),
  owner_email text,
  phone text,
  country text not null default 'BR',
  language text not null default 'pt-BR',
  currency text not null default 'BRL' check (currency = 'BRL'),
  terms_accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  failed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  unique(public_token)
);

create table public.checkout_history (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.checkout_session(id) on delete restrict,
  action text not null,
  old_status text,
  new_status text,
  reason text,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.checkout_search (
  checkout_id uuid primary key references public.checkout_session(id) on delete cascade,
  public_token uuid not null,
  status text not null,
  selected_plan text not null,
  billing_cycle text not null,
  organization_name text,
  owner_name text,
  owner_email text,
  expires_at timestamptz not null,
  search_text text not null,
  updated_at timestamptz not null default now()
);

create index checkout_search_status_idx on public.checkout_search(status, updated_at desc);
create index checkout_search_text_idx on public.checkout_search using gin(to_tsvector('simple', search_text));

create trigger checkout_session_set_updated_at
  before update on public.checkout_session
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Provisioning
-- tenant_id is the logical tenant id and equals organization_id because the
-- canonical architecture defines organization as the tenant root.
-- ---------------------------------------------------------------------------
create table public.provisioning_run (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.checkout_session(id) on delete restrict,
  tenant_id uuid,
  organization_id uuid references public.organization(id) on delete restrict,
  owner_id uuid references auth.users(id),
  subscription_id uuid references public.subscription(id) on delete restrict,
  idempotency_key text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'ROLLBACK')),
  started_at timestamptz,
  completed_at timestamptz,
  failed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(checkout_id, idempotency_key)
);

create unique index provisioning_success_checkout_uidx
  on public.provisioning_run(checkout_id)
  where status = 'SUCCESS';

create table public.provisioning_history (
  id uuid primary key default gen_random_uuid(),
  provisioning_id uuid not null references public.provisioning_run(id) on delete restrict,
  checkout_id uuid not null references public.checkout_session(id) on delete restrict,
  organization_id uuid references public.organization(id) on delete restrict,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.organization_onboarding (
  organization_id uuid primary key references public.organization(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  checklist jsonb not null default '{"customer":false,"product":false,"inventory":false,"sale":false}'::jsonb,
  completed_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger provisioning_run_set_updated_at
  before update on public.provisioning_run
  for each row execute function public.set_updated_at();

create trigger organization_onboarding_set_updated_at
  before update on public.organization_onboarding
  for each row execute function public.set_updated_at();

create or replace function public.deny_checkout_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('checkout.allow_history_admin', true) = 'on' then
    return coalesce(new, old);
  end if;
  raise exception 'checkout_history_immutable' using errcode = '42501';
end;
$$;

create trigger checkout_history_no_update
  before update on public.checkout_history
  for each row execute function public.deny_checkout_history_mutation();
create trigger checkout_history_no_delete
  before delete on public.checkout_history
  for each row execute function public.deny_checkout_history_mutation();

create trigger provisioning_history_no_update
  before update on public.provisioning_history
  for each row execute function public.deny_checkout_history_mutation();
create trigger provisioning_history_no_delete
  before delete on public.provisioning_history
  for each row execute function public.deny_checkout_history_mutation();

create or replace function public.refresh_checkout_search(p_checkout_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.checkout_search (
    checkout_id, public_token, status, selected_plan, billing_cycle,
    organization_name, owner_name, owner_email, expires_at, search_text
  )
  select
    id,
    public_token,
    status,
    selected_plan,
    billing_cycle,
    organization_name,
    owner_name,
    owner_email,
    expires_at,
    lower(concat_ws(' ', public_token::text, status, selected_plan, billing_cycle, organization_name, owner_name, owner_email))
  from public.checkout_session
  where id = p_checkout_id
  on conflict (checkout_id) do update
  set status = excluded.status,
      selected_plan = excluded.selected_plan,
      billing_cycle = excluded.billing_cycle,
      organization_name = excluded.organization_name,
      owner_name = excluded.owner_name,
      owner_email = excluded.owner_email,
      expires_at = excluded.expires_at,
      search_text = excluded.search_text,
      updated_at = now();
end;
$$;

create or replace function public.trg_checkout_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_checkout_search(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create trigger checkout_search_refresh
  after insert or update on public.checkout_session
  for each row execute function public.trg_checkout_search();

create or replace function public.slugify_organization_name(p_name text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_slug text;
begin
  v_slug := lower(regexp_replace(trim(coalesce(p_name, '')), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'org';
  end if;
  return left(v_slug, 48);
end;
$$;

create or replace function public.create_checkout_session(
  p_selected_plan text,
  p_billing_cycle text,
  p_country text default 'BR',
  p_language text default 'pt-BR',
  p_currency text default 'BRL'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.checkout_session;
begin
  if p_selected_plan not in ('starter', 'growth', 'business', 'enterprise') then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;
  if p_billing_cycle not in ('monthly', 'yearly') then
    raise exception 'invalid_billing_cycle' using errcode = '22023';
  end if;
  if p_currency <> 'BRL' then
    raise exception 'invalid_currency' using errcode = '22023';
  end if;

  insert into public.checkout_session(selected_plan, billing_cycle, country, language, currency)
  values (p_selected_plan, p_billing_cycle, coalesce(nullif(trim(p_country), ''), 'BR'), coalesce(nullif(trim(p_language), ''), 'pt-BR'), p_currency)
  returning * into v_session;

  insert into public.checkout_history(checkout_id, action, new_status)
  values (v_session.id, 'CheckoutCreated', v_session.status);

  return to_jsonb(v_session);
end;
$$;

create or replace function public.start_checkout_session(
  p_public_token uuid,
  p_selected_plan text,
  p_billing_cycle text,
  p_organization_name text,
  p_owner_name text,
  p_owner_email text,
  p_phone text,
  p_country text,
  p_language text,
  p_currency text,
  p_terms_accepted boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.checkout_session;
  v_old_status text;
begin
  if p_selected_plan not in ('starter', 'growth', 'business', 'enterprise') then raise exception 'invalid_plan'; end if;
  if p_billing_cycle not in ('monthly', 'yearly') then raise exception 'invalid_billing_cycle'; end if;
  if p_currency <> 'BRL' then raise exception 'invalid_currency'; end if;
  if char_length(trim(p_organization_name)) < 2 then raise exception 'invalid_organization_name'; end if;
  if char_length(trim(p_owner_name)) < 2 then raise exception 'invalid_owner_name'; end if;
  if lower(trim(p_owner_email)) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_owner_email'; end if;
  if not p_terms_accepted then raise exception 'terms_not_accepted'; end if;
  if exists (select 1 from auth.users where lower(email) = lower(trim(p_owner_email))) then
    raise exception 'owner_email_already_exists' using errcode = '23505';
  end if;

  select * into v_session
  from public.checkout_session
  where public_token = p_public_token
  for update;

  if not found then raise exception 'checkout_not_found' using errcode = 'P0002'; end if;
  if v_session.status not in ('CREATED', 'STARTED') then raise exception 'checkout_not_editable'; end if;
  if v_session.expires_at <= now() then
    update public.checkout_session set status = 'EXPIRED' where id = v_session.id;
    insert into public.checkout_history(checkout_id, action, old_status, new_status, reason)
    values (v_session.id, 'CheckoutExpired', v_session.status, 'EXPIRED', 'expired_before_start');
    raise exception 'checkout_expired';
  end if;

  v_old_status := v_session.status;
  update public.checkout_session
  set status = 'STARTED',
      selected_plan = p_selected_plan,
      billing_cycle = p_billing_cycle,
      organization_name = trim(p_organization_name),
      organization_slug = public.slugify_organization_name(p_organization_name),
      owner_name = trim(p_owner_name),
      owner_email = lower(trim(p_owner_email)),
      phone = nullif(trim(p_phone), ''),
      country = coalesce(nullif(trim(p_country), ''), 'BR'),
      language = coalesce(nullif(trim(p_language), ''), 'pt-BR'),
      currency = p_currency,
      terms_accepted_at = now()
  where id = v_session.id
  returning * into v_session;

  insert into public.checkout_history(checkout_id, action, old_status, new_status)
  values (v_session.id, 'CheckoutStarted', v_old_status, v_session.status);

  return to_jsonb(v_session);
end;
$$;

create or replace function public.cancel_checkout_session(p_public_token uuid, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.checkout_session;
  v_old_status text;
begin
  select * into v_session from public.checkout_session where public_token = p_public_token for update;
  if not found then raise exception 'checkout_not_found'; end if;
  if v_session.status not in ('CREATED', 'STARTED') then raise exception 'checkout_not_cancellable'; end if;
  v_old_status := v_session.status;
  update public.checkout_session
  set status = 'CANCELLED', cancelled_at = now()
  where id = v_session.id
  returning * into v_session;
  insert into public.checkout_history(checkout_id, action, old_status, new_status, reason)
  values (v_session.id, 'CheckoutCancelled', v_old_status, 'CANCELLED', p_reason);
  return to_jsonb(v_session);
end;
$$;

create or replace function public.get_checkout_session_public(p_public_token uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select to_jsonb(s) from public.checkout_session s where s.public_token = p_public_token
$$;

create or replace function public.get_checkout_result(p_public_token uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'checkoutId', s.id,
    'tenantId', pr.tenant_id,
    'organizationId', pr.organization_id,
    'ownerId', pr.owner_id,
    'subscriptionId', pr.subscription_id,
    'status', pr.status
  )
  from public.checkout_session s
  join public.provisioning_run pr on pr.checkout_id = s.id and pr.status = 'SUCCESS'
  where s.public_token = p_public_token
$$;

create or replace function public.provision_checkout_session(
  p_public_token uuid,
  p_owner_user_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.checkout_session;
  v_result jsonb;
  v_plan_version_id uuid;
  v_trial_days integer;
  v_org_id uuid := gen_random_uuid();
  v_org_slug_base text;
  v_org_slug text;
  v_suffix integer := 0;
  v_subscription_id uuid := gen_random_uuid();
  v_provisioning_id uuid := gen_random_uuid();
  v_old_status text;
begin
  if p_owner_user_id is null then raise exception 'owner_required'; end if;
  if nullif(trim(p_idempotency_key), '') is null then raise exception 'idempotency_key_required'; end if;

  select public.get_checkout_result(p_public_token) into v_result;
  if v_result is not null then
    return v_result;
  end if;

  select * into v_session
  from public.checkout_session
  where public_token = p_public_token
  for update;

  if not found then raise exception 'checkout_not_found'; end if;
  if v_session.status <> 'STARTED' then raise exception 'checkout_not_ready'; end if;
  if v_session.expires_at <= now() then
    update public.checkout_session set status = 'EXPIRED' where id = v_session.id;
    insert into public.checkout_history(checkout_id, action, old_status, new_status, reason)
    values (v_session.id, 'CheckoutExpired', v_session.status, 'EXPIRED', 'expired_before_provisioning');
    raise exception 'checkout_expired';
  end if;
  if v_session.organization_name is null or v_session.owner_email is null or v_session.owner_name is null then
    raise exception 'checkout_incomplete';
  end if;
  if not exists (
    select 1 from auth.users u
    where u.id = p_owner_user_id and lower(u.email) = lower(v_session.owner_email)
  ) then
    raise exception 'owner_auth_user_mismatch';
  end if;

  select pv.id, pv.trial_days into v_plan_version_id, v_trial_days
  from public.saas_plan p
  join public.saas_plan_version pv on pv.plan_id = p.id
  where p.code = v_session.selected_plan
    and p.status = 'active'
    and pv.status = 'active'
  order by pv.version desc
  limit 1;
  if v_plan_version_id is null then raise exception 'plan_version_not_found'; end if;

  insert into public.provisioning_run(
    id, checkout_id, owner_id, idempotency_key, status, started_at
  )
  values (v_provisioning_id, v_session.id, p_owner_user_id, p_idempotency_key, 'RUNNING', now());
  insert into public.provisioning_history(provisioning_id, checkout_id, action)
  values (v_provisioning_id, v_session.id, 'ProvisioningStarted');

  v_org_slug_base := coalesce(v_session.organization_slug, public.slugify_organization_name(v_session.organization_name));
  v_org_slug := v_org_slug_base;
  while exists (select 1 from public.organization where slug = v_org_slug) loop
    v_suffix := v_suffix + 1;
    v_org_slug := left(v_org_slug_base, 44) || '-' || v_suffix::text;
  end loop;

  insert into public.organization(id, name, slug, status, currency, created_by)
  values (v_org_id, v_session.organization_name, v_org_slug, 'active', v_session.currency, p_owner_user_id);
  insert into public.provisioning_history(provisioning_id, checkout_id, organization_id, action, payload)
  values (v_provisioning_id, v_session.id, v_org_id, 'OrganizationCreated', jsonb_build_object('slug', v_org_slug));

  insert into public.membership(organization_id, user_id, role, status, is_owner, created_by)
  values (v_org_id, p_owner_user_id, 'owner', 'active', true, p_owner_user_id);
  insert into public.provisioning_history(provisioning_id, checkout_id, organization_id, action, payload)
  values (v_provisioning_id, v_session.id, v_org_id, 'OwnerCreated', jsonb_build_object('ownerId', p_owner_user_id));

  insert into public.subscription(
    id, organization_id, plan_version_id, status, billing_cycle, currency,
    trial_ends_at, current_period_start, current_period_end, created_by, updated_by
  )
  values (
    v_subscription_id, v_org_id, v_plan_version_id,
    case when v_trial_days > 0 then 'trial' else 'active' end,
    v_session.billing_cycle,
    v_session.currency,
    case when v_trial_days > 0 then now() + make_interval(days => v_trial_days) else null end,
    now(),
    case
      when v_session.billing_cycle = 'yearly' then now() + interval '1 year'
      else now() + interval '1 month'
    end,
    p_owner_user_id,
    p_owner_user_id
  );
  insert into public.subscription_event(organization_id, subscription_id, event_type, payload, actor_user_id)
  values (v_org_id, v_subscription_id, 'SubscriptionCreated', jsonb_build_object('source', 'checkout'), p_owner_user_id);
  insert into public.provisioning_history(provisioning_id, checkout_id, organization_id, action, payload)
  values (v_provisioning_id, v_session.id, v_org_id, 'SubscriptionCreated', jsonb_build_object('subscriptionId', v_subscription_id));

  insert into public.stock_location(organization_id, code, name, is_default, priority, created_by, updated_by)
  values (v_org_id, 'principal', 'Principal', true, 100, p_owner_user_id, p_owner_user_id)
  on conflict do nothing;

  insert into public.organization_onboarding(organization_id, status)
  values (v_org_id, 'pending');
  insert into public.provisioning_history(provisioning_id, checkout_id, organization_id, action)
  values (v_provisioning_id, v_session.id, v_org_id, 'InitialWorkspaceCreated');

  update public.provisioning_run
  set tenant_id = v_org_id,
      organization_id = v_org_id,
      subscription_id = v_subscription_id,
      status = 'SUCCESS',
      completed_at = now()
  where id = v_provisioning_id;
  insert into public.provisioning_history(provisioning_id, checkout_id, organization_id, action)
  values (v_provisioning_id, v_session.id, v_org_id, 'ProvisioningCompleted');

  v_old_status := v_session.status;
  update public.checkout_session
  set status = 'COMPLETED', completed_at = now()
  where id = v_session.id;
  insert into public.checkout_history(checkout_id, action, old_status, new_status)
  values (v_session.id, 'CheckoutCompleted', v_old_status, 'COMPLETED');

  return jsonb_build_object(
    'checkoutId', v_session.id,
    'tenantId', v_org_id,
    'organizationId', v_org_id,
    'ownerId', p_owner_user_id,
    'subscriptionId', v_subscription_id,
    'status', 'SUCCESS'
  );
end;
$$;

create or replace function public.record_checkout_failure(
  p_public_token uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.checkout_session;
  v_old_status text;
begin
  select * into v_session from public.checkout_session where public_token = p_public_token for update;
  if not found then return; end if;
  if v_session.status in ('COMPLETED', 'CANCELLED', 'EXPIRED') then return; end if;
  v_old_status := v_session.status;
  update public.checkout_session
  set status = 'FAILED', failed_reason = left(coalesce(p_reason, 'checkout_failed'), 500)
  where id = v_session.id;
  insert into public.checkout_history(checkout_id, action, old_status, new_status, reason)
  values (v_session.id, 'CheckoutFailed', v_old_status, 'FAILED', left(coalesce(p_reason, 'checkout_failed'), 500));
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------
alter table public.saas_plan enable row level security;
alter table public.saas_plan_version enable row level security;
alter table public.saas_plan_price enable row level security;
alter table public.entitlement_definition enable row level security;
alter table public.saas_plan_entitlement enable row level security;
alter table public.organization_entitlement_override enable row level security;
alter table public.feature_flag enable row level security;
alter table public.subscription enable row level security;
alter table public.subscription_event enable row level security;
alter table public.checkout_session enable row level security;
alter table public.checkout_history enable row level security;
alter table public.checkout_search enable row level security;
alter table public.provisioning_run enable row level security;
alter table public.provisioning_history enable row level security;
alter table public.organization_onboarding enable row level security;

create policy saas_plan_select_all on public.saas_plan for select to anon, authenticated using (status = 'active');
create policy saas_plan_version_select_all on public.saas_plan_version for select to anon, authenticated using (status = 'active');
create policy saas_plan_price_select_all on public.saas_plan_price for select to anon, authenticated using (true);
create policy entitlement_definition_select_auth on public.entitlement_definition for select to authenticated using (true);
create policy saas_plan_entitlement_select_auth on public.saas_plan_entitlement for select to authenticated using (true);
create policy organization_entitlement_override_select_member on public.organization_entitlement_override for select to authenticated using (public.is_org_member(organization_id));
create policy feature_flag_select_global_or_member on public.feature_flag for select to authenticated using (scope = 'global' or public.is_org_member(organization_id));
create policy subscription_select_member on public.subscription for select to authenticated using (public.is_org_member(organization_id));
create policy subscription_event_select_member on public.subscription_event for select to authenticated using (public.is_org_member(organization_id));
create policy organization_onboarding_select_member on public.organization_onboarding for select to authenticated using (public.is_org_member(organization_id));
create policy organization_onboarding_update_owner on public.organization_onboarding for update to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));

create policy checkout_search_select_platform on public.checkout_search for select to authenticated using (
  exists (select 1 from public.membership m where m.user_id = auth.uid() and m.status = 'active' and m.role in ('owner', 'admin'))
);
create policy provisioning_select_platform on public.provisioning_run for select to authenticated using (
  organization_id is not null and public.is_org_owner(organization_id)
);
create policy provisioning_history_select_platform on public.provisioning_history for select to authenticated using (
  organization_id is not null and public.is_org_owner(organization_id)
);

grant select on public.saas_plan, public.saas_plan_version, public.saas_plan_price to anon, authenticated;
grant select on public.entitlement_definition, public.saas_plan_entitlement to authenticated;
grant select on public.organization_entitlement_override, public.feature_flag, public.subscription, public.subscription_event, public.organization_onboarding to authenticated;
grant update on public.organization_onboarding to authenticated;
grant select on public.checkout_search, public.provisioning_run, public.provisioning_history to authenticated;

grant execute on function public.create_checkout_session(text, text, text, text, text) to anon, authenticated;
grant execute on function public.start_checkout_session(uuid, text, text, text, text, text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.cancel_checkout_session(uuid, text) to anon, authenticated;
grant execute on function public.get_checkout_session_public(uuid) to anon, authenticated;
grant execute on function public.get_checkout_result(uuid) to anon, authenticated;
grant execute on function public.provision_checkout_session(uuid, uuid, text) to service_role;
grant execute on function public.record_checkout_failure(uuid, text) to service_role;
