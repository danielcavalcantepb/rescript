-- CAP Sprint 3: Commercial Intent & Billing Foundation.
-- This migration deliberately creates no operational organization, tenant,
-- membership, subscription or provisioning side effect.

create extension if not exists pgcrypto;

create table public.subscription_intent (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null unique default gen_random_uuid(),
  onboarding_session_id uuid not null references public.onboarding_session(id) on delete restrict,
  selected_plan_id uuid not null references public.saas_plan(id) on delete restrict,
  selected_price_id uuid not null references public.saas_plan_price(id) on delete restrict,
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  currency text not null check (char_length(currency) = 3),
  subtotal numeric(18,2) not null check (subtotal >= 0),
  discount numeric(18,2) not null default 0 check (discount >= 0 and discount <= subtotal),
  total numeric(18,2) not null check (total >= 0),
  coupon_code text,
  campaign text,
  trial_days integer not null default 0 check (trial_days >= 0),
  status text not null default 'draft' check (status in (
    'draft','plan_selected','checkout_created','checkout_started','checkout_abandoned',
    'payment_processing','payment_confirmed','payment_failed','expired','cancelled'
  )),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (onboarding_session_id, idempotency_key),
  constraint subscription_intent_total_reconciliation_check check (total = subtotal - discount)
);

create index subscription_intent_onboarding_idx
  on public.subscription_intent(onboarding_session_id, created_at desc);
create index subscription_intent_status_idx
  on public.subscription_intent(status, updated_at desc);

create table public.billing_session (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null unique default gen_random_uuid(),
  subscription_intent_id uuid not null references public.subscription_intent(id) on delete restrict,
  gateway text not null,
  gateway_reference text,
  checkout_url text,
  status text not null default 'created' check (status in (
    'created','started','abandoned','expired','payment_processing',
    'payment_confirmed','payment_failed','cancelled'
  )),
  expires_at timestamptz,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_intent_id, idempotency_key)
);

create index billing_session_intent_idx
  on public.billing_session(subscription_intent_id, created_at desc);
create unique index billing_session_gateway_reference_unique
  on public.billing_session(gateway, gateway_reference)
  where gateway_reference is not null;

create table public.subscription_intent_event (
  id uuid primary key default gen_random_uuid(),
  subscription_intent_id uuid not null references public.subscription_intent(id) on delete restrict,
  billing_session_id uuid references public.billing_session(id) on delete restrict,
  event_type text not null check (event_type in (
    'PlanSelected','SubscriptionIntentCreated','CheckoutCreated','CheckoutStarted',
    'CheckoutExpired','PaymentSucceeded','PaymentFailed','PlanViewed','CheckoutAbandoned',
    'CheckoutCompleted','CouponApplied','CouponRejected'
  )),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index subscription_intent_event_intent_idx
  on public.subscription_intent_event(subscription_intent_id, created_at desc);

create or replace function public.cap_subscription_intent_transition_allowed(p_from text, p_to text)
returns boolean language sql immutable as $$
  select (p_from, p_to) in (
    ('draft','plan_selected'), ('draft','cancelled'), ('draft','expired'),
    ('plan_selected','checkout_created'), ('plan_selected','cancelled'), ('plan_selected','expired'),
    ('checkout_created','checkout_started'), ('checkout_created','checkout_abandoned'),
    ('checkout_created','payment_processing'), ('checkout_created','cancelled'), ('checkout_created','expired'),
    ('checkout_started','checkout_abandoned'), ('checkout_started','payment_processing'),
    ('checkout_started','cancelled'), ('checkout_started','expired'),
    ('checkout_abandoned','checkout_created'), ('checkout_abandoned','plan_selected'),
    ('checkout_abandoned','cancelled'), ('checkout_abandoned','expired'),
    ('payment_processing','payment_confirmed'), ('payment_processing','payment_failed'),
    ('payment_failed','checkout_created'), ('payment_failed','checkout_started'),
    ('payment_failed','cancelled'), ('payment_failed','expired')
  )
$$;

create or replace function public.cap_guard_subscription_intent_transition()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status and not public.cap_subscription_intent_transition_allowed(old.status, new.status) then
    raise exception 'invalid_subscription_intent_transition' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end
$$;
create trigger subscription_intent_transition_guard before update on public.subscription_intent
  for each row execute function public.cap_guard_subscription_intent_transition();

create or replace function public.cap_guard_billing_session_transition()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status and not ((old.status, new.status) in (
    ('created','started'), ('created','cancelled'), ('created','expired'),
    ('started','abandoned'), ('started','payment_processing'), ('started','cancelled'), ('started','expired'),
    ('payment_processing','payment_confirmed'), ('payment_processing','payment_failed'),
    ('payment_failed','started'), ('payment_failed','cancelled'), ('payment_failed','expired')
  )) then
    raise exception 'invalid_billing_session_transition' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end
$$;
create trigger billing_session_transition_guard before update on public.billing_session
  for each row execute function public.cap_guard_billing_session_transition();

-- Resolve the current public price exclusively in PostgreSQL.  Callers never
-- supply monetary amounts, discount values, or trial values.
create or replace function public.cap_resolve_subscription_price(
  p_plan_id uuid, p_billing_cycle text, p_currency text default 'BRL'
)
returns table (
  plan_id uuid, price_id uuid, plan_name text, marketing_label text,
  billing_cycle text, currency text, amount numeric, trial_days integer,
  trial_mode text, features jsonb
) language plpgsql security definer set search_path = public as $$
begin
  if p_billing_cycle not in ('monthly','yearly') then
    raise exception 'invalid_billing_cycle' using errcode = '22023';
  end if;
  return query
  select p.id, price.id, p.name, p.marketing_label, price.billing_cycle, price.currency,
    price.amount, version.trial_days,
    case when version.trial_days > 0 then 'optional' else 'none' end,
    coalesce(jsonb_object_agg(entitlement.entitlement_key, entitlement.value)
      filter (where entitlement.entitlement_key is not null), '{}'::jsonb)
  from public.saas_plan p
  join lateral (
    select v.* from public.saas_plan_version v
    where v.plan_id = p.id and v.status = 'active' and v.effective_from <= now()
    order by v.version desc limit 1
  ) version on true
  join public.saas_plan_price price on price.plan_version_id = version.id
  left join public.saas_plan_entitlement entitlement on entitlement.plan_version_id = version.id
  where p.id = p_plan_id and p.status = 'active'
    and price.billing_cycle = p_billing_cycle and price.currency = upper(p_currency)
  group by p.id, price.id, version.id;
  if not found then
    raise exception 'plan_or_price_not_available' using errcode = '22023';
  end if;
end
$$;

create or replace function public.cap_get_plans(p_currency text default 'BRL')
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(plan order by (plan->>'name')), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', p.id, 'code', p.code, 'name', p.name, 'label', p.marketing_label,
      'trialDays', version.trial_days,
      'trialMode', case when version.trial_days > 0 then 'optional' else 'none' end,
      'prices', coalesce((select jsonb_agg(jsonb_build_object(
          'id', price.id, 'billingCycle', price.billing_cycle,
          'currency', price.currency, 'amount', price.amount
        ) order by price.billing_cycle)
        from public.saas_plan_price price
        where price.plan_version_id = version.id and price.currency = upper(p_currency)), '[]'::jsonb),
      'features', coalesce((select jsonb_object_agg(entitlement.entitlement_key, entitlement.value)
        from public.saas_plan_entitlement entitlement where entitlement.plan_version_id = version.id), '{}'::jsonb)
    ) plan
    from public.saas_plan p
    join lateral (
      select v.* from public.saas_plan_version v where v.plan_id = p.id
        and v.status = 'active' and v.effective_from <= now() order by v.version desc limit 1
    ) version on true
    where p.status = 'active'
  ) list
$$;

create or replace function public.cap_get_prices(p_plan_id uuid, p_currency text default 'BRL')
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', price.id, 'billingCycle', price.billing_cycle, 'currency', price.currency,
    'amount', price.amount, 'trialDays', version.trial_days
  ) order by price.billing_cycle), '[]'::jsonb)
  from public.saas_plan_price price
  join public.saas_plan_version version on version.id = price.plan_version_id
  join public.saas_plan plan on plan.id = version.plan_id
  where plan.id = p_plan_id and plan.status = 'active' and version.status = 'active'
    and price.currency = upper(p_currency)
$$;

-- Coupon services are contracts only in Sprint 3.  There is no promotional
-- catalog yet, therefore no discount can be applied.
create or replace function public.cap_validate_coupon(p_coupon_code text default null)
returns jsonb language sql security definer set search_path = public as $$
  select case when nullif(trim(p_coupon_code), '') is null
    then jsonb_build_object('valid', true, 'discount', 0)
    else jsonb_build_object('valid', false, 'reason', 'coupon_not_available', 'discount', 0)
  end
$$;

create or replace function public.cap_calculate_pricing(
  p_plan_id uuid, p_billing_cycle text, p_coupon_code text default null, p_currency text default 'BRL'
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v record; v_coupon jsonb;
begin
  select * into v from public.cap_resolve_subscription_price(p_plan_id, p_billing_cycle, p_currency);
  v_coupon := public.cap_validate_coupon(p_coupon_code);
  return jsonb_build_object('planId', v.plan_id, 'priceId', v.price_id,
    'billingCycle', v.billing_cycle, 'currency', v.currency, 'subtotal', v.amount,
    'discount', 0, 'total', v.amount, 'trialDays', v.trial_days, 'trialMode', v.trial_mode,
    'coupon', v_coupon, 'features', v.features);
end
$$;

create or replace function public.cap_assert_onboarding_owner(p_onboarding_id uuid)
returns public.onboarding_session language plpgsql security definer set search_path = public as $$
declare v public.onboarding_session;
begin
  select * into v from public.onboarding_session where id = p_onboarding_id for update;
  if not found then raise exception 'onboarding_not_found' using errcode = '22023'; end if;
  if v.user_id is null or auth.uid() is distinct from v.user_id then
    raise exception 'onboarding_access_denied' using errcode = '42501';
  end if;
  return v;
end
$$;

create or replace function public.cap_create_subscription_intent(
  p_onboarding_public_id uuid, p_plan_id uuid, p_billing_cycle text,
  p_idempotency_key text, p_coupon_code text default null, p_currency text default 'BRL'
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session public.onboarding_session; v_price jsonb; v_intent public.subscription_intent;
begin
  select * into v_session from public.onboarding_session
    where public_id = p_onboarding_public_id and expires_at > now() for update;
  if not found then raise exception 'onboarding_not_found' using errcode = '22023'; end if;
  perform public.cap_assert_onboarding_owner(v_session.id);
  if v_session.state not in ('company_profile_completed','plan_selection_pending','plan_selected') then
    raise exception 'onboarding_not_ready_for_plan_selection' using errcode = '22023';
  end if;
  if length(trim(p_idempotency_key)) < 8 then raise exception 'invalid_idempotency_key' using errcode = '22023'; end if;
  select * into v_intent from public.subscription_intent
    where onboarding_session_id = v_session.id and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('publicId', v_intent.public_id, 'status', v_intent.status,
      'subtotal', v_intent.subtotal, 'discount', v_intent.discount, 'total', v_intent.total,
      'currency', v_intent.currency, 'trialDays', v_intent.trial_days);
  end if;
  v_price := public.cap_calculate_pricing(p_plan_id, p_billing_cycle, p_coupon_code, p_currency);
  insert into public.subscription_intent(
    onboarding_session_id, selected_plan_id, selected_price_id, billing_cycle, currency,
    subtotal, discount, total, coupon_code, campaign, trial_days, status, idempotency_key
  ) values (
    v_session.id, p_plan_id, (v_price->>'priceId')::uuid, p_billing_cycle, v_price->>'currency',
    (v_price->>'subtotal')::numeric, (v_price->>'discount')::numeric, (v_price->>'total')::numeric,
    nullif(trim(p_coupon_code), ''), v_session.utm_campaign, (v_price->>'trialDays')::integer,
    'plan_selected', p_idempotency_key
  ) returning * into v_intent;
  if v_session.state = 'company_profile_completed' then
    update public.onboarding_session set state = 'plan_selection_pending', current_step = 'plano', updated_at = now() where id = v_session.id;
  end if;
  if v_session.state in ('company_profile_completed','plan_selection_pending') then
    update public.onboarding_session set state = 'plan_selected', current_step = 'pagamento', last_activity_at = now(), updated_at = now() where id = v_session.id;
  end if;
  insert into public.subscription_intent_event(subscription_intent_id, event_type, payload)
  values (v_intent.id, 'SubscriptionIntentCreated', jsonb_build_object('planId', p_plan_id)),
         (v_intent.id, 'PlanSelected', jsonb_build_object('billingCycle', p_billing_cycle));
  return jsonb_build_object('publicId', v_intent.public_id, 'status', v_intent.status,
    'subtotal', v_intent.subtotal, 'discount', v_intent.discount, 'total', v_intent.total,
    'currency', v_intent.currency, 'trialDays', v_intent.trial_days);
end
$$;

create or replace function public.cap_update_subscription_intent(
  p_intent_public_id uuid, p_plan_id uuid, p_billing_cycle text, p_coupon_code text default null, p_currency text default 'BRL'
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_intent public.subscription_intent; v_price jsonb;
begin
  select intent.* into v_intent from public.subscription_intent intent
    join public.onboarding_session session on session.id = intent.onboarding_session_id
    where intent.public_id = p_intent_public_id for update;
  if not found then raise exception 'subscription_intent_not_found' using errcode = '22023'; end if;
  perform public.cap_assert_onboarding_owner(v_intent.onboarding_session_id);
  if v_intent.status not in ('draft','plan_selected','checkout_abandoned') then raise exception 'intent_not_editable' using errcode = '22023'; end if;
  v_price := public.cap_calculate_pricing(p_plan_id, p_billing_cycle, p_coupon_code, p_currency);
  update public.subscription_intent set selected_plan_id = p_plan_id, selected_price_id = (v_price->>'priceId')::uuid,
    billing_cycle = p_billing_cycle, currency = v_price->>'currency', subtotal = (v_price->>'subtotal')::numeric,
    discount = (v_price->>'discount')::numeric, total = (v_price->>'total')::numeric,
    coupon_code = nullif(trim(p_coupon_code), ''), trial_days = (v_price->>'trialDays')::integer
  where id = v_intent.id returning * into v_intent;
  insert into public.subscription_intent_event(subscription_intent_id, event_type, payload)
  values (v_intent.id, 'PlanSelected', jsonb_build_object('planId', p_plan_id, 'billingCycle', p_billing_cycle));
  return jsonb_build_object('publicId', v_intent.public_id, 'status', v_intent.status,
    'subtotal', v_intent.subtotal, 'discount', v_intent.discount, 'total', v_intent.total, 'currency', v_intent.currency);
end
$$;

create or replace function public.cap_create_billing_session(
  p_intent_public_id uuid, p_gateway text, p_idempotency_key text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_intent public.subscription_intent; v_session public.billing_session;
begin
  select * into v_intent from public.subscription_intent where public_id = p_intent_public_id for update;
  if not found then raise exception 'subscription_intent_not_found' using errcode = '22023'; end if;
  perform public.cap_assert_onboarding_owner(v_intent.onboarding_session_id);
  if v_intent.status not in ('plan_selected','checkout_abandoned') then raise exception 'intent_not_ready_for_checkout' using errcode = '22023'; end if;
  if nullif(trim(p_gateway), '') is null then raise exception 'invalid_gateway' using errcode = '22023'; end if;
  select * into v_session from public.billing_session where subscription_intent_id = v_intent.id and idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('publicId', v_session.public_id, 'status', v_session.status, 'checkoutUrl', v_session.checkout_url, 'expiresAt', v_session.expires_at); end if;
  insert into public.billing_session(subscription_intent_id, gateway, status, expires_at, idempotency_key)
  values(v_intent.id, lower(trim(p_gateway)), 'created', now() + interval '30 minutes', p_idempotency_key)
  returning * into v_session;
  update public.subscription_intent set status = 'checkout_created' where id = v_intent.id;
  insert into public.subscription_intent_event(subscription_intent_id, billing_session_id, event_type)
  values(v_intent.id, v_session.id, 'CheckoutCreated');
  return jsonb_build_object('publicId', v_session.public_id, 'status', v_session.status, 'checkoutUrl', null, 'expiresAt', v_session.expires_at);
end
$$;

-- Coupon support is intentionally only a contract at this stage. No campaign,
-- promotion or discount rules are introduced until a dedicated domain exists.
create or replace function public.cap_apply_coupon(p_intent_public_id uuid, p_coupon_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_intent public.subscription_intent; v_coupon jsonb;
begin
  select * into v_intent from public.subscription_intent where public_id = p_intent_public_id for update;
  if not found then raise exception 'subscription_intent_not_found' using errcode = '22023'; end if;
  perform public.cap_assert_onboarding_owner(v_intent.onboarding_session_id);
  if v_intent.status not in ('draft', 'plan_selected', 'checkout_abandoned') then raise exception 'intent_not_editable' using errcode = '22023'; end if;
  v_coupon := public.cap_validate_coupon(p_coupon_code);
  if not coalesce((v_coupon->>'valid')::boolean, false) then
    insert into public.subscription_intent_event(subscription_intent_id, event_type, payload)
    values (v_intent.id, 'CouponRejected', jsonb_build_object('coupon', p_coupon_code, 'reason', v_coupon->>'reason'));
    raise exception 'coupon_not_available' using errcode = '22023';
  end if;
  update public.subscription_intent set coupon_code = nullif(trim(p_coupon_code), ''), updated_at = now() where id = v_intent.id;
  insert into public.subscription_intent_event(subscription_intent_id, event_type, payload)
  values (v_intent.id, 'CouponApplied', jsonb_build_object('coupon', p_coupon_code, 'discount', 0));
  return jsonb_build_object('publicId', v_intent.public_id, 'coupon', nullif(trim(p_coupon_code), ''), 'discount', 0);
end
$$;

create or replace function public.cap_remove_coupon(p_intent_public_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_intent public.subscription_intent; v_price jsonb;
begin
  select * into v_intent from public.subscription_intent where public_id = p_intent_public_id for update;
  if not found then raise exception 'subscription_intent_not_found' using errcode = '22023'; end if;
  perform public.cap_assert_onboarding_owner(v_intent.onboarding_session_id);
  if v_intent.status not in ('draft', 'plan_selected', 'checkout_abandoned') then raise exception 'intent_not_editable' using errcode = '22023'; end if;
  v_price := public.cap_calculate_pricing(v_intent.selected_plan_id, v_intent.billing_cycle, null, v_intent.currency);
  update public.subscription_intent set coupon_code = null, discount = (v_price->>'discount')::numeric,
    total = (v_price->>'total')::numeric, updated_at = now() where id = v_intent.id;
  return jsonb_build_object('publicId', v_intent.public_id, 'discount', (v_price->>'discount')::numeric, 'total', (v_price->>'total')::numeric);
end
$$;

alter table public.subscription_intent enable row level security;
alter table public.billing_session enable row level security;
alter table public.subscription_intent_event enable row level security;
create policy subscription_intent_owner_read on public.subscription_intent for select to authenticated using (
  exists (select 1 from public.onboarding_session session where session.id = onboarding_session_id and session.user_id = auth.uid())
);
create policy billing_session_owner_read on public.billing_session for select to authenticated using (
  exists (select 1 from public.subscription_intent intent join public.onboarding_session session on session.id = intent.onboarding_session_id where intent.id = subscription_intent_id and session.user_id = auth.uid())
);
create policy subscription_intent_event_owner_read on public.subscription_intent_event for select to authenticated using (
  exists (select 1 from public.subscription_intent intent join public.onboarding_session session on session.id = intent.onboarding_session_id where intent.id = subscription_intent_id and session.user_id = auth.uid())
);

revoke all on public.subscription_intent, public.billing_session, public.subscription_intent_event from anon, authenticated;
revoke all on function public.cap_create_subscription_intent(uuid,uuid,text,text,text,text), public.cap_update_subscription_intent(uuid,uuid,text,text,text), public.cap_create_billing_session(uuid,text,text), public.cap_apply_coupon(uuid,text), public.cap_remove_coupon(uuid) from public;
grant execute on function public.cap_get_plans(text), public.cap_get_prices(uuid,text), public.cap_validate_coupon(text), public.cap_calculate_pricing(uuid,text,text,text) to anon, authenticated;
grant execute on function public.cap_create_subscription_intent(uuid,uuid,text,text,text,text), public.cap_update_subscription_intent(uuid,uuid,text,text,text), public.cap_create_billing_session(uuid,text,text), public.cap_apply_coupon(uuid,text), public.cap_remove_coupon(uuid) to authenticated;

comment on table public.subscription_intent is 'CAP commercial decision only; never an active subscription or operational tenant.';
comment on table public.billing_session is 'CAP payment attempt only; gateway adapter contract is intentionally provider-agnostic.';
