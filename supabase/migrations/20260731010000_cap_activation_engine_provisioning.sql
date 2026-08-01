-- CAP Sprint 4: Activation Engine and tenant provisioning.
-- Payment gateways only register verified facts.  Activation is the sole
-- authority that can create a subscription and start a provisioning job.

create extension if not exists pgcrypto;

-- Sprint 2's approved relationship is made explicit here.  It is CAP data,
-- not an operational Customer or Company aggregate.
create table if not exists public.business_identity (
  id uuid primary key default gen_random_uuid(),
  onboarding_session_id uuid not null unique references public.onboarding_session(id) on delete restrict,
  legal_name text not null check (char_length(trim(legal_name)) >= 2),
  trade_name text,
  tax_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger business_identity_set_updated_at before update on public.business_identity
  for each row execute function public.set_updated_at();

-- Reuse the canonical Subscription aggregate.  Legacy subscriptions remain
-- valid; CAP provenance is nullable for records created before this flow.
alter table public.subscription
  add column if not exists onboarding_session_id uuid references public.onboarding_session(id) on delete restrict,
  add column if not exists subscription_intent_id uuid references public.subscription_intent(id) on delete restrict,
  add column if not exists billing_session_id uuid references public.billing_session(id) on delete restrict,
  add column if not exists plan_id uuid references public.saas_plan(id) on delete restrict,
  add column if not exists price_id uuid references public.saas_plan_price(id) on delete restrict,
  add column if not exists started_at timestamptz,
  add column if not exists next_billing_at timestamptz;
create unique index if not exists subscription_cap_intent_uidx on public.subscription(subscription_intent_id)
  where subscription_intent_id is not null;
create unique index if not exists subscription_cap_billing_uidx on public.subscription(billing_session_id)
  where billing_session_id is not null;

create table public.activation (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null unique default gen_random_uuid(),
  subscription_intent_id uuid not null references public.subscription_intent(id) on delete restrict,
  billing_session_id uuid not null references public.billing_session(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','validating','subscription_created','provisioning_started','provisioning_completed','completed','failed','cancelled','retrying')),
  attempt integer not null default 1 check (attempt >= 1),
  failure_reason text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(subscription_intent_id),
  unique(billing_session_id),
  unique(subscription_intent_id, idempotency_key)
);
create index activation_status_idx on public.activation(status, updated_at);
create trigger activation_set_updated_at before update on public.activation
  for each row execute function public.set_updated_at();

create table public.provisioning_job (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null unique default gen_random_uuid(),
  activation_id uuid not null unique references public.activation(id) on delete restrict,
  organization_id uuid references public.organization(id) on delete restrict,
  subscription_id uuid references public.subscription(id) on delete restrict,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','retrying','cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  attempt integer not null default 1 check (attempt >= 1),
  logs jsonb not null default '[]'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index provisioning_job_status_idx on public.provisioning_job(status, created_at);
create trigger provisioning_job_set_updated_at before update on public.provisioning_job
  for each row execute function public.set_updated_at();

-- Bootstrap metadata belongs to the new tenant.  The “final consumer” is a
-- tenant preference here, not a Customer aggregate: operational customers are
-- deliberately outside CAP activation.
create table public.tenant_provisioning_configuration (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organization(id) on delete restrict,
  default_final_consumer_label text not null default 'Consumidor final',
  preferences jsonb not null default '{"locale":"pt-BR","timezone":"America/Sao_Paulo"}'::jsonb,
  fiscal_parameters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id)
);
create trigger tenant_provisioning_configuration_set_updated_at before update on public.tenant_provisioning_configuration
  for each row execute function public.set_updated_at();

create table public.activation_event (
  id uuid primary key default gen_random_uuid(),
  activation_id uuid not null references public.activation(id) on delete restrict,
  event_type text not null check (event_type in ('PaymentConfirmed','ActivationStarted','SubscriptionCreated','ProvisioningQueued','ProvisioningStarted','ProvisioningCompleted','TenantActivated','ActivationFailed','ProvisioningRetry')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activation_event_timeline_idx on public.activation_event(activation_id, created_at);

-- This is a gateway inbox only.  Signature verification happens in the backend
-- adapter before this service-role RPC is called; it cannot provision a tenant.
create table public.billing_webhook_event (
  id uuid primary key default gen_random_uuid(),
  gateway text not null,
  external_event_id text not null,
  billing_session_id uuid references public.billing_session(id) on delete restrict,
  event_type text not null,
  signature_verified boolean not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(gateway, external_event_id)
);

create or replace function public.cap_activation_transition_allowed(p_from text, p_to text)
returns boolean language sql immutable as $$
  select (p_from, p_to) in (
    ('pending','validating'), ('pending','cancelled'),
    ('validating','subscription_created'), ('validating','failed'),
    ('subscription_created','provisioning_started'), ('subscription_created','failed'),
    ('provisioning_started','provisioning_completed'), ('provisioning_started','failed'),
    ('provisioning_completed','completed'), ('provisioning_completed','failed'),
    ('failed','retrying'), ('retrying','validating'), ('retrying','cancelled')
  )
$$;

create or replace function public.cap_guard_activation_transition()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status and not public.cap_activation_transition_allowed(old.status, new.status) then
    raise exception 'invalid_activation_transition' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger activation_transition_guard before update on public.activation
  for each row execute function public.cap_guard_activation_transition();

create or replace function public.cap_provisioning_transition_allowed(p_from text, p_to text)
returns boolean language sql immutable as $$
  select (p_from, p_to) in (
    ('queued','running'), ('queued','cancelled'),
    ('running','completed'), ('running','failed'),
    ('failed','retrying'), ('retrying','running'), ('retrying','cancelled')
  )
$$;
create or replace function public.cap_guard_provisioning_transition()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status and not public.cap_provisioning_transition_allowed(old.status, new.status) then
    raise exception 'invalid_provisioning_transition' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger provisioning_job_transition_guard before update on public.provisioning_job
  for each row execute function public.cap_guard_provisioning_transition();

create or replace function public.cap_activation_event(p_activation uuid, p_event text, p_payload jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.activation_event(activation_id, event_type, payload)
  values (p_activation, p_event, coalesce(p_payload, '{}'::jsonb));
end $$;

-- Service role is intentionally the only caller.  The application webhook
-- adapter validates its provider signature before asserting p_signature_verified.
create or replace function public.cap_record_verified_payment_webhook(
  p_gateway text, p_external_event_id text, p_billing_session_public_id uuid,
  p_event_type text, p_signature_verified boolean, p_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_billing public.billing_session; v_intent public.subscription_intent; v_session public.onboarding_session; v_event uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  if not p_signature_verified then raise exception 'webhook_signature_not_verified' using errcode = '42501'; end if;
  insert into public.billing_webhook_event(gateway, external_event_id, event_type, signature_verified, payload)
  values(lower(trim(p_gateway)), trim(p_external_event_id), trim(p_event_type), true, coalesce(p_payload, '{}'::jsonb))
  on conflict(gateway, external_event_id) do nothing returning id into v_event;
  if v_event is null then return jsonb_build_object('accepted', true, 'duplicate', true); end if;
  select * into v_billing from public.billing_session where public_id = p_billing_session_public_id for update;
  if not found then raise exception 'billing_session_not_found' using errcode = '22023'; end if;
  update public.billing_webhook_event set billing_session_id = v_billing.id, processed_at = now() where id = v_event;
  if p_event_type <> 'payment_succeeded' then return jsonb_build_object('accepted', true, 'duplicate', false, 'ignored', true); end if;
  select * into v_intent from public.subscription_intent where id = v_billing.subscription_intent_id for update;
  -- Advance one guarded transition at a time.  These writes acknowledge a
  -- verified payment fact; they never create an activation or tenant.
  if v_billing.status = 'created' then update public.billing_session set status = 'started' where id = v_billing.id; end if;
  select * into v_billing from public.billing_session where id = v_billing.id for update;
  if v_billing.status = 'started' then update public.billing_session set status = 'payment_processing' where id = v_billing.id; end if;
  select * into v_billing from public.billing_session where id = v_billing.id for update;
  if v_billing.status = 'payment_processing' then update public.billing_session set status = 'payment_confirmed' where id = v_billing.id; end if;
  if v_intent.status in ('checkout_created','checkout_started') then update public.subscription_intent set status = 'payment_processing' where id = v_intent.id; end if;
  select * into v_intent from public.subscription_intent where id = v_intent.id for update;
  if v_intent.status = 'payment_processing' then update public.subscription_intent set status = 'payment_confirmed' where id = v_intent.id; end if;
  select * into v_session from public.onboarding_session where id = v_intent.onboarding_session_id for update;
  if v_session.state = 'payment_pending' then update public.onboarding_session set state = 'payment_processing' where id = v_session.id; end if;
  select * into v_session from public.onboarding_session where id = v_session.id for update;
  if v_session.state = 'payment_processing' then update public.onboarding_session set state = 'payment_confirmed' where id = v_session.id; end if;
  insert into public.subscription_intent_event(subscription_intent_id, billing_session_id, event_type, payload)
  values(v_intent.id, v_billing.id, 'PaymentSucceeded', jsonb_build_object('gateway', p_gateway, 'eventId', p_external_event_id));
  return jsonb_build_object('accepted', true, 'duplicate', false, 'billingSessionId', v_billing.public_id);
end $$;

-- Idempotently creates the activation and its one job after an already-recorded
-- payment.  It is deliberately separate from webhook ingestion.
create or replace function public.cap_start_activation(p_billing_session_public_id uuid, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_billing public.billing_session; v_activation public.activation; v_session public.onboarding_session;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  if char_length(trim(p_idempotency_key)) < 8 then raise exception 'invalid_idempotency_key' using errcode = '22023'; end if;
  select * into v_billing from public.billing_session where public_id = p_billing_session_public_id for update;
  if not found or v_billing.status <> 'payment_confirmed' then raise exception 'payment_not_confirmed' using errcode = '22023'; end if;
  select a.* into v_activation from public.activation a where a.billing_session_id = v_billing.id for update;
  if found then return jsonb_build_object('activationId', v_activation.public_id, 'status', v_activation.status, 'duplicate', true); end if;
  select s.* into v_session from public.onboarding_session s join public.subscription_intent i on i.onboarding_session_id = s.id where i.id = v_billing.subscription_intent_id for update;
  insert into public.activation(subscription_intent_id, billing_session_id, idempotency_key) values(v_billing.subscription_intent_id, v_billing.id, trim(p_idempotency_key)) returning * into v_activation;
  if v_session.state = 'payment_confirmed' then update public.onboarding_session set state = 'provisioning_pending', updated_at = now() where id = v_session.id; end if;
  perform public.cap_activation_event(v_activation.id, 'PaymentConfirmed', jsonb_build_object('billingSessionId', v_billing.public_id));
  perform public.cap_activation_event(v_activation.id, 'ActivationStarted');
  insert into public.provisioning_job(activation_id, status, logs) values(v_activation.id, 'queued', jsonb_build_array(jsonb_build_object('event','queued','at',now())));
  perform public.cap_activation_event(v_activation.id, 'ProvisioningQueued');
  return jsonb_build_object('activationId', v_activation.public_id, 'status', v_activation.status, 'duplicate', false);
end $$;

-- No external calls occur here: PostgreSQL can therefore guarantee rollback of
-- the entire tenant bootstrap if any contract cannot be fulfilled.
create or replace function public.cap_execute_provisioning(p_activation_public_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.activation; j public.provisioning_job; b public.billing_session; i public.subscription_intent; s public.onboarding_session; bi public.business_identity;
  v_org uuid; v_branch uuid; v_subscription uuid; v_slug text; v_suffix integer := 0; v_version uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  select * into a from public.activation where public_id = p_activation_public_id for update;
  if not found then raise exception 'activation_not_found' using errcode = '22023'; end if;
  select * into j from public.provisioning_job where activation_id = a.id for update;
  if j.status = 'completed' then return jsonb_build_object('activationId', a.public_id, 'organizationId', j.organization_id, 'subscriptionId', j.subscription_id, 'idempotent', true); end if;
  if j.status not in ('queued','retrying') then raise exception 'provisioning_not_runnable' using errcode = '22023'; end if;
  select * into b from public.billing_session where id = a.billing_session_id; select * into i from public.subscription_intent where id = a.subscription_intent_id;
  select * into s from public.onboarding_session where id = i.onboarding_session_id; select * into bi from public.business_identity where onboarding_session_id = s.id;
  if bi.id is null or s.user_id is null then raise exception 'business_identity_or_owner_missing' using errcode = '22023'; end if;
  update public.activation set status = case when status = 'retrying' then 'validating' else 'validating' end, failure_reason = null where id = a.id;
  update public.provisioning_job set status = 'running', started_at = coalesce(started_at, now()), error = null, logs = logs || jsonb_build_array(jsonb_build_object('event','started','at',now())) where id = j.id;
  if s.state = 'provisioning_pending' then update public.onboarding_session set state = 'provisioning_processing', updated_at = now() where id = s.id; end if;
  v_slug := trim(both '-' from lower(regexp_replace(coalesce(nullif(bi.trade_name,''), bi.legal_name), '[^a-zA-Z0-9]+', '-', 'g')));
  if v_slug = '' then v_slug := 'rescript'; end if;
  while exists(select 1 from public.organization where slug = v_slug) loop v_suffix := v_suffix + 1; v_slug := left(v_slug, 42) || '-' || v_suffix; end loop;
  insert into public.organization(name, slug, status, currency, created_by) values(coalesce(nullif(bi.trade_name,''), bi.legal_name), v_slug, 'active', i.currency, s.user_id) returning id into v_org;
  insert into public.membership(organization_id,user_id,role,status,is_owner,created_by) values(v_org,s.user_id,'owner','active',true,s.user_id);
  select id into v_branch from public.branch where organization_id=v_org and is_default and status='active';
  if v_branch is null then select public.ensure_default_branch(v_org,s.user_id) into v_branch; end if;
  insert into public.stock_location(organization_id,code,name,is_default,priority,created_by,updated_by) values(v_org,'principal','Principal',true,100,s.user_id,s.user_id) on conflict (organization_id, lower(code)) do nothing;
  insert into public.inventory_policy(organization_id,created_by,updated_by) values(v_org,s.user_id,s.user_id) on conflict (organization_id) do nothing;
  insert into public.cash_account(organization_id,company_id,branch_id,code,name,account_type,status,created_by,updated_by) values(v_org,v_org,v_branch,'CAIXA','Caixa principal','cash','active',s.user_id,s.user_id) on conflict (organization_id,code) do nothing;
  insert into public.tenant_provisioning_configuration(organization_id,created_by,updated_by)
  values(v_org,s.user_id,s.user_id) on conflict (organization_id) do nothing;
  select plan_version_id into v_version from public.saas_plan_price where id=i.selected_price_id;
  insert into public.subscription(organization_id,plan_version_id,onboarding_session_id,subscription_intent_id,billing_session_id,plan_id,price_id,billing_cycle,currency,status,started_at,trial_ends_at,next_billing_at,current_period_start,current_period_end,created_by,updated_by)
  values(v_org,v_version,s.id,i.id,b.id,i.selected_plan_id,i.selected_price_id,i.billing_cycle,i.currency,case when i.trial_days > 0 then 'trial' else 'active' end,now(),case when i.trial_days > 0 then now()+make_interval(days=>i.trial_days) end,case when i.billing_cycle='yearly' then now()+interval '1 year' else now()+interval '1 month' end,now(),case when i.billing_cycle='yearly' then now()+interval '1 year' else now()+interval '1 month' end,s.user_id,s.user_id) returning id into v_subscription;
  insert into public.subscription_event(organization_id,subscription_id,event_type,payload,actor_user_id) values(v_org,v_subscription,'SubscriptionCreated',jsonb_build_object('source','activation_engine','billingSessionId',b.public_id),s.user_id);
  update public.activation set status='subscription_created' where id=a.id; perform public.cap_activation_event(a.id,'SubscriptionCreated',jsonb_build_object('subscriptionId',v_subscription));
  update public.activation set status='provisioning_started' where id=a.id; perform public.cap_activation_event(a.id,'ProvisioningStarted');
  update public.provisioning_job set organization_id=v_org,subscription_id=v_subscription,status='completed',finished_at=now(),logs=logs || jsonb_build_array(jsonb_build_object('event','completed','at',now())) where id=j.id;
  update public.activation set status='provisioning_completed' where id=a.id; perform public.cap_activation_event(a.id,'ProvisioningCompleted',jsonb_build_object('organizationId',v_org));
  update public.activation set status='completed' where id=a.id; perform public.cap_activation_event(a.id,'TenantActivated',jsonb_build_object('organizationId',v_org));
  if s.state='provisioning_processing' then update public.onboarding_session set state='provisioned',updated_at=now() where id=s.id; end if;
  return jsonb_build_object('activationId',a.public_id,'organizationId',v_org,'subscriptionId',v_subscription,'idempotent',false);
end $$;

-- External workers call this after a failed transaction or integration.  It
-- makes the failed state durable without leaving a partially provisioned
-- tenant, and only then allows a controlled retry.
create or replace function public.cap_fail_activation(p_activation_public_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.activation; j public.provisioning_job;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  if coalesce(nullif(trim(p_reason),''),'') = '' then raise exception 'failure_reason_required' using errcode = '22023'; end if;
  select * into a from public.activation where public_id=p_activation_public_id for update;
  select * into j from public.provisioning_job where activation_id=a.id for update;
  if a.status in ('completed','cancelled') then raise exception 'activation_not_failurable' using errcode = '22023'; end if;
  if a.status in ('pending','retrying') then update public.activation set status='validating' where id=a.id; end if;
  if a.status <> 'failed' then update public.activation set status='failed',failure_reason=left(trim(p_reason),2000) where id=a.id; end if;
  if j.status in ('queued','retrying') then update public.provisioning_job set status='running' where id=j.id; end if;
  if j.status <> 'failed' then update public.provisioning_job set status='failed',error=left(trim(p_reason),2000),finished_at=now() where id=j.id; end if;
  perform public.cap_activation_event(a.id,'ActivationFailed',jsonb_build_object('reason',left(trim(p_reason),500)));
  return jsonb_build_object('activationId',a.public_id,'status','failed');
end $$;

create or replace function public.cap_retry_provisioning(p_activation_public_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.activation; j public.provisioning_job;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  select * into a from public.activation where public_id=p_activation_public_id for update;
  select * into j from public.provisioning_job where activation_id=a.id for update;
  if a.status <> 'failed' or j.status <> 'failed' then raise exception 'activation_not_retryable' using errcode='22023'; end if;
  update public.activation set status='retrying',attempt=attempt+1,failure_reason=null where id=a.id;
  update public.provisioning_job set status='retrying',attempt=attempt+1,error=null where id=j.id;
  perform public.cap_activation_event(a.id,'ProvisioningRetry',jsonb_build_object('reason',left(coalesce(p_reason,'retry'),500)));
  return jsonb_build_object('activationId',a.public_id,'attempt',a.attempt+1);
end $$;

alter table public.business_identity enable row level security;
alter table public.activation enable row level security;
alter table public.provisioning_job enable row level security;
alter table public.activation_event enable row level security;
alter table public.billing_webhook_event enable row level security;
alter table public.tenant_provisioning_configuration enable row level security;

create policy business_identity_owner_read on public.business_identity for select to authenticated
  using (exists(select 1 from public.onboarding_session s where s.id=onboarding_session_id and s.user_id=auth.uid()));
create policy activation_owner_read on public.activation for select to authenticated using (exists(select 1 from public.subscription_intent i join public.onboarding_session s on s.id=i.onboarding_session_id where i.id=subscription_intent_id and s.user_id=auth.uid()));
create policy provisioning_job_owner_read on public.provisioning_job for select to authenticated using (exists(select 1 from public.activation a join public.subscription_intent i on i.id=a.subscription_intent_id join public.onboarding_session s on s.id=i.onboarding_session_id where a.id=activation_id and s.user_id=auth.uid()));
create policy activation_event_owner_read on public.activation_event for select to authenticated using (exists(select 1 from public.activation a join public.subscription_intent i on i.id=a.subscription_intent_id join public.onboarding_session s on s.id=i.onboarding_session_id where a.id=activation_id and s.user_id=auth.uid()));
create policy tenant_provisioning_configuration_owner_read on public.tenant_provisioning_configuration for select to authenticated using (public.is_org_member(organization_id));

revoke all on public.business_identity, public.activation, public.provisioning_job, public.activation_event, public.billing_webhook_event, public.tenant_provisioning_configuration from anon, authenticated;
grant select on public.business_identity, public.activation, public.provisioning_job, public.activation_event, public.tenant_provisioning_configuration to authenticated;
grant execute on function public.cap_record_verified_payment_webhook(text,text,uuid,text,boolean,jsonb), public.cap_start_activation(uuid,text), public.cap_execute_provisioning(uuid), public.cap_fail_activation(uuid,text), public.cap_retry_provisioning(uuid,text) to service_role;
comment on function public.cap_record_verified_payment_webhook(text,text,uuid,text,boolean,jsonb) is 'Gateway inbox only; signature verification is mandatory in the backend adapter and provisioning is never invoked here.';
