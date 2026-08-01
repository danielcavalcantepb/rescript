-- Keep Business Identity aligned with the authoritative onboarding lifecycle.
-- The public page owns one business-identity step, but the state machine still
-- records the formal company-profile transitions before plan selection.

create or replace function public.cap_save_business_identity(
  p_public_id uuid,
  p_identity jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.onboarding_session;
  v_person_type text := lower(coalesce(p_identity->>'personType', ''));
  v_legal_name text := nullif(trim(coalesce(p_identity->>'legalName', '')), '');
  v_tax_id text := regexp_replace(coalesce(p_identity->>'taxId', ''), '\\D', '', 'g');
  v_phone text := regexp_replace(coalesce(p_identity->>'phone', ''), '\\D', '', 'g');
  v_email text := nullif(lower(trim(coalesce(p_identity->>'email', ''))), '');
  v_zip_code text := regexp_replace(coalesce(p_identity->>'zipCode', ''), '\\D', '', 'g');
begin
  if length(trim(coalesce(p_idempotency_key, ''))) < 8 then
    raise exception 'invalid_idempotency_key' using errcode = '22023';
  end if;

  select * into v_session
  from public.onboarding_session
  where public_id = p_public_id and expires_at > now()
  for update;

  if not found then
    raise exception 'onboarding_not_found' using errcode = '22023';
  end if;

  if v_session.state not in (
    'business_profile_completed',
    'company_profile_pending',
    'company_profile_completed',
    'plan_selection_pending'
  ) then
    raise exception 'onboarding_not_ready_for_business_identity' using errcode = '22023';
  end if;

  if v_person_type not in ('individual', 'company') then
    raise exception 'invalid_person_type' using errcode = '22023';
  end if;
  if v_legal_name is null then
    raise exception 'legal_name_required' using errcode = '22023';
  end if;
  if (v_person_type = 'individual' and length(v_tax_id) <> 11)
     or (v_person_type = 'company' and length(v_tax_id) <> 14) then
    raise exception 'invalid_tax_id' using errcode = '22023';
  end if;
  if length(v_phone) not between 10 and 11 then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if length(v_zip_code) <> 8
     or nullif(trim(coalesce(p_identity->>'street', '')), '') is null
     or nullif(trim(coalesce(p_identity->>'number', '')), '') is null
     or nullif(trim(coalesce(p_identity->>'neighborhood', '')), '') is null
     or nullif(trim(coalesce(p_identity->>'city', '')), '') is null
     or upper(trim(coalesce(p_identity->>'state', ''))) !~ '^[A-Z]{2}$' then
    raise exception 'invalid_business_address' using errcode = '22023';
  end if;

  if v_session.state = 'business_profile_completed' then
    update public.onboarding_session
    set state = 'company_profile_pending', current_step = 'empresa', updated_at = now()
    where id = v_session.id;
  end if;

  insert into public.business_identity (
    onboarding_id, onboarding_session_id, person_type, legal_name, trade_name, tax_id,
    state_registration, phone, commercial_email, zip_code, street, street_number,
    complement, neighborhood, city, state_code, country_code, main_branch_name,
    updated_at
  ) values (
    v_session.id, v_session.id, v_person_type, v_legal_name,
    nullif(trim(coalesce(p_identity->>'tradeName', '')), ''), v_tax_id,
    nullif(trim(coalesce(p_identity->>'stateRegistration', '')), ''), v_phone, v_email,
    v_zip_code, trim(p_identity->>'street'), trim(p_identity->>'number'),
    nullif(trim(coalesce(p_identity->>'complement', '')), ''), trim(p_identity->>'neighborhood'),
    trim(p_identity->>'city'), upper(trim(p_identity->>'state')), 'BR',
    nullif(trim(coalesce(p_identity->>'mainBranchName', '')), ''), now()
  )
  on conflict (onboarding_id) do update set
    person_type = excluded.person_type,
    legal_name = excluded.legal_name,
    trade_name = excluded.trade_name,
    tax_id = excluded.tax_id,
    state_registration = excluded.state_registration,
    phone = excluded.phone,
    commercial_email = excluded.commercial_email,
    zip_code = excluded.zip_code,
    street = excluded.street,
    street_number = excluded.street_number,
    complement = excluded.complement,
    neighborhood = excluded.neighborhood,
    city = excluded.city,
    state_code = excluded.state_code,
    country_code = excluded.country_code,
    main_branch_name = excluded.main_branch_name,
    updated_at = now();

  select * into v_session from public.onboarding_session where id = v_session.id for update;
  if v_session.state = 'company_profile_pending' then
    update public.onboarding_session
    set state = 'company_profile_completed', current_step = 'empresa', updated_at = now()
    where id = v_session.id;
  end if;

  select * into v_session from public.onboarding_session where id = v_session.id for update;
  if v_session.state = 'company_profile_completed' then
    update public.onboarding_session
    set state = 'plan_selection_pending', current_step = 'plano', updated_at = now()
    where id = v_session.id;
  end if;

  if not exists (
    select 1
    from public.onboarding_event e
    where e.onboarding_session_id = v_session.id
      and e.event_type = 'BusinessIdentityCompleted'
      and e.payload->>'idempotencyKey' = p_idempotency_key
  ) then
    insert into public.onboarding_event (onboarding_session_id, event_type, payload)
    values (
      v_session.id,
      'BusinessIdentityCompleted',
      jsonb_build_object('personType', v_person_type, 'idempotencyKey', p_idempotency_key)
    );
  end if;

  return jsonb_build_object('publicId', v_session.public_id, 'state', 'plan_selection_pending', 'step', 'plano');
end
$$;

revoke all on function public.cap_save_business_identity(uuid, jsonb, text) from public;
grant execute on function public.cap_save_business_identity(uuid, jsonb, text) to anon, authenticated;
