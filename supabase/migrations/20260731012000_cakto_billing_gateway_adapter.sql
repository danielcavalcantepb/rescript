-- Cakto is an infrastructure adapter. These functions expose only Rescript
-- checkout contracts and never create a tenant, organization or subscription.

create or replace function public.cap_create_cakto_billing_session(
  p_intent_public_id uuid,
  p_idempotency_key text
)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return public.cap_create_billing_session(
    p_intent_public_id,
    'cakto',
    p_idempotency_key
  );
end $$;

create or replace function public.cap_get_billing_checkout_context(
  p_billing_session_public_id uuid
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session public.billing_session; v_intent public.subscription_intent;
begin
  select * into v_session from public.billing_session
  where public_id = p_billing_session_public_id;
  if not found then raise exception 'billing_session_not_found' using errcode = '22023'; end if;
  if v_session.gateway <> 'cakto' then raise exception 'invalid_billing_gateway' using errcode = '22023'; end if;
  select * into v_intent from public.subscription_intent where id = v_session.subscription_intent_id;
  perform public.cap_assert_onboarding_owner(v_intent.onboarding_session_id);
  return jsonb_build_object(
    'billingSessionPublicId', v_session.public_id,
    'subscriptionIntentPublicId', v_intent.public_id,
    'priceId', v_intent.selected_price_id,
    'amount', v_intent.total,
    'currency', v_intent.currency
  );
end $$;

create or replace function public.cap_bind_cakto_checkout(
  p_billing_session_public_id uuid,
  p_gateway_reference text,
  p_checkout_url text,
  p_expires_at timestamptz default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session public.billing_session; v_intent public.subscription_intent; v_started boolean := false;
begin
  if nullif(trim(p_gateway_reference), '') is null or nullif(trim(p_checkout_url), '') is null then
    raise exception 'invalid_checkout_details' using errcode = '22023';
  end if;
  select * into v_session from public.billing_session where public_id = p_billing_session_public_id for update;
  if not found then raise exception 'billing_session_not_found' using errcode = '22023'; end if;
  if v_session.gateway <> 'cakto' then raise exception 'invalid_billing_gateway' using errcode = '22023'; end if;
  select * into v_intent from public.subscription_intent where id = v_session.subscription_intent_id for update;
  perform public.cap_assert_onboarding_owner(v_intent.onboarding_session_id);
  if v_session.gateway_reference is not null and v_session.gateway_reference <> trim(p_gateway_reference) then
    raise exception 'checkout_already_bound' using errcode = '22023';
  end if;
  v_started := v_session.status = 'created';
  update public.billing_session
  set gateway_reference = trim(p_gateway_reference), checkout_url = trim(p_checkout_url),
      expires_at = coalesce(p_expires_at, expires_at),
      status = case when status = 'created' then 'started' else status end
  where id = v_session.id returning * into v_session;
  if v_intent.status = 'checkout_created' then
    update public.subscription_intent set status = 'checkout_started' where id = v_intent.id;
  end if;
  if v_started then
    insert into public.subscription_intent_event(subscription_intent_id, billing_session_id, event_type, payload)
    values (v_intent.id, v_session.id, 'CheckoutStarted', jsonb_build_object('gateway', 'cakto'));
  end if;
  return jsonb_build_object('publicId', v_session.public_id, 'status', v_session.status,
    'checkoutUrl', v_session.checkout_url, 'expiresAt', v_session.expires_at);
end $$;

-- Only the service-role adapter can convert verified provider facts into
-- internal events. Activation is invoked exclusively after PaymentConfirmed.
create or replace function public.cap_ingest_billing_event(
  p_gateway text, p_external_event_id text, p_billing_session_public_id uuid,
  p_event_type text, p_payload jsonb, p_payload_hash text, p_correlation_id uuid default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_billing public.billing_session; v_intent public.subscription_intent; v_inbox public.billing_event_inbox;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  if lower(trim(p_gateway)) <> 'cakto' then raise exception 'unsupported_billing_gateway' using errcode = '22023'; end if;
  if p_event_type not in ('PaymentConfirmed','PaymentFailed','CheckoutExpired','SubscriptionCancelled') then
    raise exception 'unsupported_billing_event' using errcode = '22023';
  end if;
  if nullif(trim(p_external_event_id), '') is null or nullif(trim(p_payload_hash), '') is null then
    raise exception 'invalid_billing_event' using errcode = '22023';
  end if;
  select * into v_billing from public.billing_session where public_id = p_billing_session_public_id for update;
  if not found then raise exception 'billing_session_not_found' using errcode = '22023'; end if;
  select * into v_intent from public.subscription_intent where id = v_billing.subscription_intent_id for update;
  insert into public.billing_event_inbox(gateway, external_event_id, event_type, billing_session_id, payload, payload_hash, correlation_id)
  values ('cakto', trim(p_external_event_id), p_event_type, v_billing.id, coalesce(p_payload, '{}'::jsonb), trim(p_payload_hash), coalesce(p_correlation_id, v_billing.correlation_id))
  on conflict(gateway, external_event_id) do nothing returning * into v_inbox;
  if v_inbox.id is null then return jsonb_build_object('accepted', true, 'duplicate', true); end if;

  if p_event_type = 'PaymentConfirmed' then
    if v_billing.status = 'created' then update public.billing_session set status = 'started' where id = v_billing.id; end if;
    select * into v_billing from public.billing_session where id = v_billing.id for update;
    if v_billing.status = 'started' then update public.billing_session set status = 'payment_processing' where id = v_billing.id; end if;
    select * into v_billing from public.billing_session where id = v_billing.id for update;
    if v_billing.status = 'payment_processing' then update public.billing_session set status = 'payment_confirmed' where id = v_billing.id; end if;
    if v_intent.status in ('checkout_created', 'checkout_started') then update public.subscription_intent set status = 'payment_processing' where id = v_intent.id; end if;
    select * into v_intent from public.subscription_intent where id = v_intent.id for update;
    if v_intent.status = 'payment_processing' then update public.subscription_intent set status = 'payment_confirmed' where id = v_intent.id; end if;
    update public.billing_event_inbox set status = 'processing' where id = v_inbox.id;
    return public.cap_orchestrate_activation(v_inbox.id);
  end if;

  if p_event_type = 'PaymentFailed' then
    if v_billing.status = 'created' then update public.billing_session set status = 'started' where id = v_billing.id; end if;
    select * into v_billing from public.billing_session where id = v_billing.id for update;
    if v_billing.status = 'started' then update public.billing_session set status = 'payment_processing' where id = v_billing.id; end if;
    select * into v_billing from public.billing_session where id = v_billing.id for update;
    if v_billing.status = 'payment_processing' then update public.billing_session set status = 'payment_failed' where id = v_billing.id; end if;
    if v_intent.status in ('checkout_created', 'checkout_started') then update public.subscription_intent set status = 'payment_processing' where id = v_intent.id; end if;
    if (select status from public.subscription_intent where id = v_intent.id) = 'payment_processing' then update public.subscription_intent set status = 'payment_failed' where id = v_intent.id; end if;
    insert into public.subscription_intent_event(subscription_intent_id, billing_session_id, event_type) values (v_intent.id, v_billing.id, 'PaymentFailed');
  elsif p_event_type = 'CheckoutExpired' then
    if v_billing.status in ('created', 'started') then update public.billing_session set status = 'expired' where id = v_billing.id; end if;
    if v_intent.status in ('checkout_created', 'checkout_started') then update public.subscription_intent set status = 'expired' where id = v_intent.id; end if;
    insert into public.subscription_intent_event(subscription_intent_id, billing_session_id, event_type) values (v_intent.id, v_billing.id, 'CheckoutExpired');
  elsif p_event_type = 'SubscriptionCancelled' then
    if v_billing.status in ('created', 'started') then update public.billing_session set status = 'cancelled' where id = v_billing.id; end if;
    if v_intent.status in ('draft', 'plan_selected', 'checkout_created', 'checkout_started') then update public.subscription_intent set status = 'cancelled' where id = v_intent.id; end if;
    insert into public.subscription_intent_event(subscription_intent_id, billing_session_id, event_type, payload) values (v_intent.id, v_billing.id, 'CheckoutAbandoned', jsonb_build_object('reason', 'subscription_cancelled'));
  end if;
  update public.billing_event_inbox set status = 'processed', processed_at = now() where id = v_inbox.id;
  return jsonb_build_object('accepted', true, 'duplicate', false, 'eventType', p_event_type);
end $$;

revoke all on function public.cap_create_cakto_billing_session(uuid,text), public.cap_get_billing_checkout_context(uuid), public.cap_bind_cakto_checkout(uuid,text,text,timestamptz) from public;
grant execute on function public.cap_create_cakto_billing_session(uuid,text), public.cap_get_billing_checkout_context(uuid), public.cap_bind_cakto_checkout(uuid,text,text,timestamptz) to authenticated;
revoke execute on function public.cap_create_billing_session(uuid,text,text) from authenticated;
comment on function public.cap_ingest_billing_event(text,text,uuid,text,jsonb,text,uuid) is 'Cakto adapter-only ingress: accepts normalized internal events after HMAC verification; only PaymentConfirmed enters Activation.';
