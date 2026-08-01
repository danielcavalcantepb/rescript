-- CAP onboarding input validation repair.
--
-- PostgreSQL receives a single backslash in regular-expression literals. The
-- original refactor used double backslashes, making valid e-mail addresses
-- fail `cap_start` before an OnboardingSession could be created.

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
  if v_normal !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;

  if length(regexp_replace(p_phone, '\D', '', 'g')) not between 10 and 11 then
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

revoke all on function public.cap_start(text, text, text, text, jsonb) from public;
grant execute on function public.cap_start(text, text, text, text, jsonb) to anon, authenticated;
