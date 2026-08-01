-- CAP commercial consolidation: one Rescript plan with two billing cycles.
-- This is an additive, forward-only migration. Existing paid/operational
-- subscriptions are never reassigned or deleted by this migration.

do $$
begin
  if exists (
    select 1
    from public.subscription s
    join public.saas_plan_version pv on pv.id = s.plan_version_id
    join public.saas_plan p on p.id = pv.plan_id
    where p.code <> 'rescript'
  ) then
    raise exception 'legacy_plan_subscriptions_must_be_migrated_before_consolidation'
      using errcode = '55000';
  end if;

  if exists (
    select 1 from public.checkout_session where selected_plan <> 'rescript'
  ) then
    raise exception 'legacy_checkout_sessions_must_be_closed_before_consolidation'
      using errcode = '55000';
  end if;

  if to_regclass('public.subscription_intent') is not null and exists (
    select 1
    from public.subscription_intent intent
    join public.saas_plan plan on plan.id = intent.selected_plan_id
    where plan.code <> 'rescript'
  ) then
    raise exception 'legacy_subscription_intents_must_be_migrated_before_consolidation'
      using errcode = '55000';
  end if;
end
$$;

-- The legacy plan rows are safe to remove only after the checks above.
delete from public.saas_plan_entitlement entitlement
using public.saas_plan_version version
join public.saas_plan plan on plan.id = version.plan_id
where entitlement.plan_version_id = version.id
  and plan.code <> 'rescript';

delete from public.saas_plan_price price
using public.saas_plan_version version
join public.saas_plan plan on plan.id = version.plan_id
where price.plan_version_id = version.id
  and plan.code <> 'rescript';

delete from public.saas_plan_version version
using public.saas_plan plan
where version.plan_id = plan.id
  and plan.code <> 'rescript';

delete from public.saas_plan where code <> 'rescript';

alter table public.saas_plan drop constraint if exists saas_plan_code_check;
alter table public.saas_plan
  add constraint saas_plan_code_check check (code = 'rescript');

alter table public.checkout_session drop constraint if exists checkout_session_selected_plan_check;
alter table public.checkout_session
  add constraint checkout_session_selected_plan_check check (selected_plan = 'rescript');

insert into public.saas_plan(code, name, marketing_label, status)
values ('rescript', 'Rescript', 'Plano Rescript', 'active')
on conflict (code) do update
  set name = excluded.name,
      marketing_label = excluded.marketing_label,
      status = excluded.status,
      updated_at = now();

insert into public.saas_plan_version(plan_id, version, trial_days, status)
select id, 1, 0, 'active'
from public.saas_plan
where code = 'rescript'
on conflict (plan_id, version) do update
  set trial_days = excluded.trial_days,
      status = excluded.status;

insert into public.saas_plan_price(plan_version_id, billing_cycle, currency, amount)
select version.id, price.billing_cycle, 'BRL', price.amount
from public.saas_plan plan
join public.saas_plan_version version on version.plan_id = plan.id and version.version = 1
join (values
  ('monthly'::text, 289.90::numeric),
  ('yearly'::text, 2899.00::numeric)
) as price(billing_cycle, amount) on true
where plan.code = 'rescript'
on conflict (plan_version_id, billing_cycle, currency) do update
  set amount = excluded.amount;

insert into public.saas_plan_entitlement(plan_version_id, entitlement_key, value)
select version.id, definition.key,
  case definition.key
    when 'module.crm' then 'true'::jsonb
    when 'module.sales' then 'true'::jsonb
    when 'module.inventory' then 'true'::jsonb
    when 'module.finance' then 'true'::jsonb
    when 'max_users' then '"unlimited"'::jsonb
    when 'max_sales_per_month' then '"unlimited"'::jsonb
  end
from public.saas_plan plan
join public.saas_plan_version version on version.plan_id = plan.id and version.version = 1
join public.entitlement_definition definition on definition.key in (
  'module.crm', 'module.sales', 'module.inventory', 'module.finance',
  'max_users', 'max_sales_per_month'
)
where plan.code = 'rescript'
on conflict (plan_version_id, entitlement_key) do update set value = excluded.value;

-- Legacy public checkout remains readable for compatibility, but its public
-- input is now constrained to the single canonical Rescript plan.
create or replace function public.create_checkout_session(
  p_selected_plan text,
  p_billing_cycle text,
  p_country text default 'BR',
  p_language text default 'pt-BR',
  p_currency text default 'BRL'
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session public.checkout_session;
begin
  if p_selected_plan <> 'rescript' then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;
  if p_billing_cycle not in ('monthly', 'yearly') then
    raise exception 'invalid_billing_cycle' using errcode = '22023';
  end if;
  if p_currency <> 'BRL' then
    raise exception 'invalid_currency' using errcode = '22023';
  end if;
  insert into public.checkout_session(selected_plan, billing_cycle, country, language, currency)
  values ('rescript', p_billing_cycle, coalesce(nullif(trim(p_country), ''), 'BR'),
    coalesce(nullif(trim(p_language), ''), 'pt-BR'), p_currency)
  returning * into v_session;
  insert into public.checkout_history(checkout_id, action, new_status)
  values (v_session.id, 'CheckoutCreated', v_session.status);
  return to_jsonb(v_session);
end;
$$;

create or replace function public.start_checkout_session(
  p_public_token uuid, p_selected_plan text, p_billing_cycle text,
  p_organization_name text, p_owner_name text, p_owner_email text, p_phone text,
  p_country text, p_language text, p_currency text, p_terms_accepted boolean
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session public.checkout_session; v_old_status text;
begin
  if p_selected_plan <> 'rescript' then raise exception 'invalid_plan' using errcode = '22023'; end if;
  if p_billing_cycle not in ('monthly', 'yearly') then raise exception 'invalid_billing_cycle' using errcode = '22023'; end if;
  if p_currency <> 'BRL' then raise exception 'invalid_currency' using errcode = '22023'; end if;
  if char_length(trim(p_organization_name)) < 2 then raise exception 'invalid_organization_name' using errcode = '22023'; end if;
  if char_length(trim(p_owner_name)) < 2 then raise exception 'invalid_owner_name' using errcode = '22023'; end if;
  if lower(trim(p_owner_email)) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_owner_email' using errcode = '22023'; end if;
  if not p_terms_accepted then raise exception 'terms_not_accepted' using errcode = '22023'; end if;
  if exists (select 1 from auth.users where lower(email) = lower(trim(p_owner_email))) then raise exception 'owner_email_already_exists' using errcode = '23505'; end if;
  select * into v_session from public.checkout_session where public_token = p_public_token for update;
  if not found then raise exception 'checkout_not_found' using errcode = 'P0002'; end if;
  if v_session.status not in ('CREATED', 'STARTED') then raise exception 'checkout_not_editable' using errcode = '22023'; end if;
  if v_session.expires_at <= now() then
    update public.checkout_session set status = 'EXPIRED' where id = v_session.id;
    insert into public.checkout_history(checkout_id, action, old_status, new_status, reason)
    values (v_session.id, 'CheckoutExpired', v_session.status, 'EXPIRED', 'expired_before_start');
    raise exception 'checkout_expired' using errcode = '22023';
  end if;
  v_old_status := v_session.status;
  update public.checkout_session set status = 'STARTED', selected_plan = 'rescript', billing_cycle = p_billing_cycle,
    organization_name = trim(p_organization_name), organization_slug = public.slugify_organization_name(p_organization_name),
    owner_name = trim(p_owner_name), owner_email = lower(trim(p_owner_email)), phone = nullif(trim(p_phone), ''),
    country = coalesce(nullif(trim(p_country), ''), 'BR'), language = coalesce(nullif(trim(p_language), ''), 'pt-BR'),
    currency = p_currency, terms_accepted_at = now()
  where id = v_session.id returning * into v_session;
  insert into public.checkout_history(checkout_id, action, old_status, new_status)
  values (v_session.id, 'CheckoutStarted', v_old_status, v_session.status);
  return to_jsonb(v_session);
end;
$$;
