-- CAP Refactor 001: the public SaaS journey is not an operational Customer.
-- This migration is intentionally rename-based so existing sessions, consents and
-- profiles retain their identifiers and can resume without a data migration.
-- Rollback is the inverse rename sequence (tables, child columns, indexes and
-- generated constraint names) before applying a downstream CAP migration.

alter table public.customer_acquisition rename to onboarding_session;
alter table public.customer_acquisition_consent rename to onboarding_consent;
alter table public.customer_acquisition_business_profile rename to onboarding_business_profile;
alter table public.customer_acquisition_event rename to onboarding_event;
alter table public.customer_acquisition_rate_limit rename to onboarding_rate_limit;

alter table public.onboarding_consent rename column acquisition_id to onboarding_id;
alter table public.onboarding_business_profile rename column acquisition_id to onboarding_id;
alter table public.onboarding_event rename column acquisition_id to onboarding_id;

alter index if exists public.customer_acquisition_user_idx rename to onboarding_session_user_idx;
alter index if exists public.customer_acquisition_activity_idx rename to onboarding_session_activity_idx;

-- PostgreSQL preserves constraint names during a table/column rename. Rename
-- the generated names too, so the database schema has no CAP root named
-- `customer_acquisition`. This is catalog-driven to remain safe for both a
-- freshly migrated database and a database that has already accumulated data.
do $$
declare
  constraint_row record;
  renamed_constraint text;
begin
  for constraint_row in
    select constraint_catalog.conname, relation_catalog.relname
    from pg_constraint constraint_catalog
    join pg_class relation_catalog on relation_catalog.oid = constraint_catalog.conrelid
    join pg_namespace schema_catalog on schema_catalog.oid = relation_catalog.relnamespace
    where schema_catalog.nspname = 'public'
      and relation_catalog.relname in (
        'onboarding_session', 'onboarding_consent', 'onboarding_business_profile',
        'onboarding_event', 'onboarding_rate_limit'
      )
      and constraint_catalog.conname like 'customer_acquisition%'
  loop
    renamed_constraint := replace(
      replace(
        replace(
          replace(constraint_row.conname,
            'customer_acquisition_business_profile', 'onboarding_business_profile'),
          'customer_acquisition_consent', 'onboarding_consent'),
        'customer_acquisition_event', 'onboarding_event'),
      'customer_acquisition_rate_limit', 'onboarding_rate_limit'
    );
    renamed_constraint := replace(renamed_constraint, 'customer_acquisition', 'onboarding_session');
    renamed_constraint := replace(renamed_constraint, 'acquisition_id', 'onboarding_id');

    execute format(
      'alter table public.%I rename constraint %I to %I',
      constraint_row.relname,
      constraint_row.conname,
      renamed_constraint
    );
  end loop;
end
$$;

alter table public.onboarding_session drop constraint if exists customer_acquisition_state_check;
alter table public.onboarding_session drop constraint if exists onboarding_session_state_check;
alter table public.onboarding_session add constraint onboarding_session_state_check check (state in (
  'draft', 'account_pending', 'email_confirmation_pending', 'account_created',
  'business_profile_pending', 'business_profile_completed',
  'company_profile_pending', 'company_profile_completed',
  'plan_selection_pending', 'plan_selected', 'payment_pending',
  'payment_processing', 'payment_failed', 'payment_confirmed',
  'provisioning_pending', 'provisioning_processing', 'provisioning_failed',
  'provisioned', 'operational_onboarding', 'completed', 'abandoned', 'expired'
));

alter table public.onboarding_session drop constraint if exists customer_acquisition_current_step_check;
alter table public.onboarding_session drop constraint if exists onboarding_session_current_step_check;
alter table public.onboarding_session add constraint onboarding_session_current_step_check check (
  current_step in ('conta', 'perfil', 'empresa', 'plano', 'pagamento')
);

drop policy if exists customer_acquisition_owner_read on public.onboarding_session;
drop policy if exists onboarding_session_owner_read on public.onboarding_session;
create policy onboarding_session_owner_read on public.onboarding_session
  for select using (auth.uid() = user_id);

drop policy if exists customer_acquisition_owner_read_consent on public.onboarding_consent;
drop policy if exists onboarding_consent_owner_read on public.onboarding_consent;
create policy onboarding_consent_owner_read on public.onboarding_consent
  for select using (auth.uid() = user_id);

drop policy if exists customer_acquisition_owner_read_profile on public.onboarding_business_profile;
drop policy if exists onboarding_business_profile_owner_read on public.onboarding_business_profile;
create policy onboarding_business_profile_owner_read on public.onboarding_business_profile
  for select using (
    exists (
      select 1
      from public.onboarding_session session
      where session.id = onboarding_id and session.user_id = auth.uid()
    )
  );

-- `state` is the lifecycle authority. `current_step` remains presentation-only
-- navigation for the public wizard.
create or replace function public.cap_transition_allowed(p_from text, p_to text)
returns boolean
language sql
immutable
as $$
  select (p_from, p_to) in (
    ('draft', 'account_pending'),
    ('account_pending', 'email_confirmation_pending'),
    ('account_pending', 'account_created'),
    ('account_pending', 'abandoned'),
    ('account_pending', 'expired'),
    ('email_confirmation_pending', 'account_created'),
    ('email_confirmation_pending', 'abandoned'),
    ('email_confirmation_pending', 'expired'),
    ('account_created', 'business_profile_pending'),
    ('business_profile_pending', 'business_profile_completed'),
    ('business_profile_pending', 'abandoned'),
    ('business_profile_pending', 'expired'),
    ('business_profile_completed', 'company_profile_pending'),
    ('company_profile_pending', 'company_profile_completed'),
    ('company_profile_pending', 'abandoned'),
    ('company_profile_pending', 'expired'),
    ('company_profile_completed', 'plan_selection_pending'),
    ('plan_selection_pending', 'plan_selected'),
    ('plan_selection_pending', 'abandoned'),
    ('plan_selection_pending', 'expired'),
    ('plan_selected', 'payment_pending'),
    ('payment_pending', 'payment_processing'),
    ('payment_pending', 'abandoned'),
    ('payment_pending', 'expired'),
    ('payment_processing', 'payment_failed'),
    ('payment_processing', 'payment_confirmed'),
    ('payment_failed', 'payment_pending'),
    ('payment_failed', 'abandoned'),
    ('payment_failed', 'expired'),
    ('payment_confirmed', 'provisioning_pending'),
    ('provisioning_pending', 'provisioning_processing'),
    ('provisioning_processing', 'provisioning_failed'),
    ('provisioning_processing', 'provisioned'),
    ('provisioning_failed', 'provisioning_pending'),
    ('provisioning_failed', 'abandoned'),
    ('provisioning_failed', 'expired'),
    ('provisioned', 'operational_onboarding'),
    ('operational_onboarding', 'completed')
  )
$$;

create or replace function public.cap_guard_onboarding_state_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.state = old.state then
    return new;
  end if;

  if not public.cap_transition_allowed(old.state, new.state) then
    raise exception 'invalid_transition';
  end if;

  return new;
end
$$;

drop trigger if exists onboarding_session_state_transition_guard on public.onboarding_session;
create trigger onboarding_session_state_transition_guard
  before update of state on public.onboarding_session
  for each row execute function public.cap_guard_onboarding_state_transition();

create or replace function public.cap_touch(p_public_id uuid)
returns public.onboarding_session
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.onboarding_session;
begin
  select * into v
  from public.onboarding_session
  where public_id = p_public_id and expires_at > now();

  if not found then
    raise exception 'onboarding_not_found';
  end if;

  update public.onboarding_session
  set last_activity_at = now(), updated_at = now()
  where id = v.id and last_activity_at < now() - interval '30 seconds';

  return v;
end
$$;

create or replace function public.cap_start(
  p_email text,
  p_name text,
  p_phone text,
  p_idempotency_key text,
  p_utm jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.onboarding_session;
  v_normal text := lower(trim(p_email));
  v_count integer;
begin
  if v_normal !~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' then
    raise exception 'invalid_email';
  end if;

  if length(regexp_replace(p_phone, '\\D', '', 'g')) not between 10 and 11 then
    raise exception 'invalid_phone';
  end if;

  insert into public.onboarding_rate_limit(subject, attempts, window_started_at, updated_at)
  values (md5(v_normal), 1, now(), now())
  on conflict(subject) do update
    set attempts = case
      when onboarding_rate_limit.window_started_at < now() - interval '15 minutes' then 1
      else onboarding_rate_limit.attempts + 1
    end,
    window_started_at = case
      when onboarding_rate_limit.window_started_at < now() - interval '15 minutes' then now()
      else onboarding_rate_limit.window_started_at
    end,
    updated_at = now()
  returning attempts into v_count;

  if v_count > 8 then
    raise exception 'rate_limited';
  end if;

  select * into v
  from public.onboarding_session
  where normalized_email = v_normal and expires_at > now();

  if not found then
    insert into public.onboarding_session (
      email, normalized_email, full_name, phone, state, current_step, idempotency_key,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer
    ) values (
      trim(p_email), v_normal, trim(p_name), p_phone, 'account_pending', 'conta', p_idempotency_key,
      p_utm ->> 'source', p_utm ->> 'medium', p_utm ->> 'campaign', p_utm ->> 'content',
      p_utm ->> 'term', p_utm ->> 'referrer'
    ) returning * into v;

    insert into public.onboarding_event(onboarding_id, event_type)
    values (v.id, 'OnboardingStarted');
  end if;

  return jsonb_build_object('publicId', v.public_id, 'state', v.state, 'step', v.current_step, 'email', v.email);
end
$$;

create or replace function public.cap_link_account(
  p_public_id uuid,
  p_user_id uuid,
  p_terms_version text,
  p_privacy_version text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.onboarding_session;
  v_email text;
begin
  select * into v from public.onboarding_session
  where public_id = p_public_id and expires_at > now()
  for update;

  if not found then
    raise exception 'onboarding_not_found';
  end if;

  select lower(email) into v_email from auth.users where id = p_user_id;
  if v_email is null or v_email <> v.normalized_email then
    raise exception 'account_mismatch';
  end if;

  if v.user_id is not null and v.user_id <> p_user_id then
    raise exception 'account_mismatch';
  end if;

  if v.state not in ('account_pending', 'email_confirmation_pending', 'account_created', 'business_profile_pending') then
    raise exception 'invalid_transition';
  end if;

  -- Account creation and the first profile step are separate lifecycle states.
  -- They are advanced atomically so the public screen keeps its existing flow.
  if v.state in ('account_pending', 'email_confirmation_pending') then
    update public.onboarding_session
    set user_id = p_user_id, state = 'account_created', last_activity_at = now(), updated_at = now()
    where id = v.id;
    insert into public.onboarding_event(onboarding_id, event_type) values (v.id, 'AccountCreated');
  elsif v.state = 'account_created' then
    update public.onboarding_session
    set user_id = p_user_id, last_activity_at = now(), updated_at = now()
    where id = v.id;
  end if;

  if v.state <> 'business_profile_pending' then
    update public.onboarding_session
    set user_id = p_user_id, state = 'business_profile_pending', current_step = 'perfil',
        last_activity_at = now(), updated_at = now()
    where id = v.id;
  end if;

  insert into public.onboarding_consent(onboarding_id, user_id, document_type, document_version, user_agent)
  values
    (v.id, p_user_id, 'terms', p_terms_version, p_user_agent),
    (v.id, p_user_id, 'privacy', p_privacy_version, p_user_agent)
  on conflict do nothing;

  return jsonb_build_object('publicId', v.public_id, 'state', 'business_profile_pending', 'step', 'perfil');
end
$$;

create or replace function public.cap_save_business_profile(
  p_public_id uuid,
  p_profile jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.onboarding_session;
  v_segment text := lower(trim(p_profile ->> 'segment'));
  v_needs text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_profile -> 'needs', '[]'::jsonb))), '{}');
begin
  select * into v from public.onboarding_session
  where public_id = p_public_id and expires_at > now()
  for update;

  if not found then
    raise exception 'onboarding_not_found';
  end if;

  if v.state not in ('business_profile_pending', 'business_profile_completed') then
    raise exception 'invalid_transition';
  end if;

  if v_segment = '' then
    raise exception 'invalid_segment';
  end if;

  insert into public.onboarding_business_profile(
    onboarding_id, segment, segment_other, revenue_range, current_system_status,
    current_system_name, migration_interest, needs, needs_other
  ) values (
    v.id, v_segment, nullif(trim(p_profile ->> 'segmentOther'), ''),
    coalesce(nullif(trim(p_profile ->> 'revenueRange'), ''), 'prefiro_nao_informar'),
    coalesce(nullif(trim(p_profile ->> 'currentSystemStatus'), ''), 'nao_utiliza'),
    nullif(trim(p_profile ->> 'currentSystemName'), ''),
    (p_profile ->> 'migrationInterest')::boolean, v_needs,
    nullif(trim(p_profile ->> 'needsOther'), '')
  ) on conflict(onboarding_id) do update set
    segment = excluded.segment,
    segment_other = excluded.segment_other,
    revenue_range = excluded.revenue_range,
    current_system_status = excluded.current_system_status,
    current_system_name = excluded.current_system_name,
    migration_interest = excluded.migration_interest,
    needs = excluded.needs,
    needs_other = excluded.needs_other,
    updated_at = now();

  if v.state = 'business_profile_pending' then
    update public.onboarding_session
    set state = 'business_profile_completed', current_step = 'empresa',
        last_activity_at = now(), updated_at = now()
    where id = v.id;
    insert into public.onboarding_event(onboarding_id, event_type)
    values (v.id, 'BusinessProfileCompleted');
  end if;

  return jsonb_build_object('publicId', v.public_id, 'state', 'business_profile_completed', 'step', 'empresa');
end
$$;

create or replace function public.cap_resume(p_public_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.onboarding_session;
  p jsonb;
begin
  select * into v from public.onboarding_session
  where public_id = p_public_id and expires_at > now();

  if not found then
    raise exception 'onboarding_not_found';
  end if;

  select to_jsonb(profile) into p
  from public.onboarding_business_profile profile
  where profile.onboarding_id = v.id;

  return jsonb_build_object(
    'publicId', v.public_id,
    'email', v.email,
    'fullName', v.full_name,
    'phone', v.phone,
    'state', v.state,
    'step', v.current_step,
    'profile', p
  );
end
$$;

-- The public RPC names intentionally stay `cap_*`: they are stable module
-- contracts and do not expose the physical table name to the onboarding UI.
revoke all on function public.cap_start(text, text, text, text, jsonb), public.cap_link_account(uuid, uuid, text, text, text), public.cap_save_business_profile(uuid, jsonb, text), public.cap_resume(uuid), public.cap_touch(uuid) from public;
grant execute on function public.cap_start(text, text, text, text, jsonb), public.cap_link_account(uuid, uuid, text, text, text), public.cap_save_business_profile(uuid, jsonb, text), public.cap_resume(uuid), public.cap_touch(uuid) to anon, authenticated;
