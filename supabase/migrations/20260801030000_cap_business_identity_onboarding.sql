-- CAP Sprint 2 completion: persist the business identity before commercial intent.
-- This extends the existing aggregate; it never creates an operational Company,
-- Organization, Branch, Membership or Tenant.

alter table public.business_identity
  add column if not exists person_type text,
  add column if not exists state_registration text,
  add column if not exists phone text,
  add column if not exists commercial_email text,
  add column if not exists zip_code text,
  add column if not exists street text,
  add column if not exists street_number text,
  add column if not exists complement text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists state_code text,
  add column if not exists country_code text not null default 'BR',
  add column if not exists main_branch_name text;

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
  v_person_type text := coalesce(nullif(trim(p_identity ->> 'personType'), ''), 'company');
  v_legal_name text := nullif(trim(p_identity ->> 'legalName'), '');
  v_tax_id text := regexp_replace(coalesce(p_identity ->> 'taxId', ''), '\D', '', 'g');
  v_phone text := regexp_replace(coalesce(p_identity ->> 'phone', ''), '\D', '', 'g');
  v_zip_code text := regexp_replace(coalesce(p_identity ->> 'zipCode', ''), '\D', '', 'g');
  v_email text := lower(nullif(trim(p_identity ->> 'email'), ''));
  v_state text := upper(nullif(trim(p_identity ->> 'state'), ''));
begin
  if nullif(trim(p_idempotency_key), '') is null then
    raise exception 'idempotency_key_required' using errcode = '22023';
  end if;

  select * into v_session
  from public.onboarding_session
  where public_id = p_public_id and expires_at > now()
  for update;

  if not found then
    raise exception 'onboarding_not_found' using errcode = 'P0001';
  end if;

  if v_session.state not in ('business_profile_completed', 'company_profile_pending', 'company_profile_completed', 'plan_selection_pending') then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;
  if v_person_type not in ('individual', 'company') then
    raise exception 'invalid_person_type' using errcode = '22023';
  end if;
  if v_legal_name is null or char_length(v_legal_name) < 2 then
    raise exception 'invalid_legal_name' using errcode = '22023';
  end if;
  if (v_person_type = 'individual' and char_length(v_tax_id) <> 11)
    or (v_person_type = 'company' and char_length(v_tax_id) <> 14) then
    raise exception 'invalid_tax_id' using errcode = '22023';
  end if;
  if char_length(v_phone) not between 10 and 11 then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if char_length(v_zip_code) <> 8 or v_state is null or char_length(v_state) <> 2
    or nullif(trim(p_identity ->> 'street'), '') is null
    or nullif(trim(p_identity ->> 'number'), '') is null
    or nullif(trim(p_identity ->> 'neighborhood'), '') is null
    or nullif(trim(p_identity ->> 'city'), '') is null then
    raise exception 'invalid_address' using errcode = '22023';
  end if;

  insert into public.business_identity (
    onboarding_session_id, onboarding_id, legal_name, trade_name, tax_id,
    person_type, state_registration, phone, commercial_email, zip_code,
    street, street_number, complement, neighborhood, city, state_code,
    main_branch_name
  ) values (
    v_session.id, v_session.id, v_legal_name, nullif(trim(p_identity ->> 'tradeName'), ''), v_tax_id,
    v_person_type, nullif(trim(p_identity ->> 'stateRegistration'), ''), v_phone, v_email, v_zip_code,
    nullif(trim(p_identity ->> 'street'), ''), nullif(trim(p_identity ->> 'number'), ''),
    nullif(trim(p_identity ->> 'complement'), ''), nullif(trim(p_identity ->> 'neighborhood'), ''),
    nullif(trim(p_identity ->> 'city'), ''), v_state,
    nullif(trim(p_identity ->> 'mainBranchName'), '')
  ) on conflict (onboarding_id) do update set
    legal_name = excluded.legal_name,
    trade_name = excluded.trade_name,
    tax_id = excluded.tax_id,
    person_type = excluded.person_type,
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
    main_branch_name = excluded.main_branch_name,
    updated_at = now();

  update public.onboarding_session
  set state = 'plan_selection_pending', current_step = 'plano',
      last_activity_at = now(), updated_at = now()
  where id = v_session.id;

  insert into public.onboarding_event(onboarding_id, event_type, payload)
  values (v_session.id, 'BusinessIdentityCompleted', jsonb_build_object('personType', v_person_type, 'idempotencyKey', p_idempotency_key));

  return jsonb_build_object('publicId', v_session.public_id, 'state', 'plan_selection_pending', 'step', 'plano');
end
$$;

revoke all on function public.cap_save_business_identity(uuid, jsonb, text) from public;
grant execute on function public.cap_save_business_identity(uuid, jsonb, text) to anon, authenticated;
