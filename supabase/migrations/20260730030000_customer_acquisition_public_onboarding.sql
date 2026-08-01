-- CAP Sprint 1: public acquisition exists before any operational tenant.
create table if not exists public.customer_acquisition (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null unique default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  normalized_email text not null unique,
  full_name text not null,
  phone text not null,
  state text not null default 'draft' check (state in ('draft','account_pending','email_confirmation_pending','account_created','business_profile_pending','business_profile_completed','company_profile_pending','company_profile_completed','plan_selection_pending','plan_selected','payment_pending','payment_processing','payment_failed','payment_confirmed','provisioning_pending','provisioning_processing','provisioning_failed','completed','abandoned','expired')),
  current_step text not null default 'conta' check (current_step in ('conta','perfil','empresa','plano','pagamento')),
  started_at timestamptz not null default now(), last_activity_at timestamptz not null default now(),
  completed_at timestamptz, expires_at timestamptz not null default now() + interval '30 days',
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text, referrer text,
  idempotency_key text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.customer_acquisition_consent (
  id uuid primary key default gen_random_uuid(), acquisition_id uuid not null references public.customer_acquisition(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null, document_type text not null check (document_type in ('terms','privacy')),
  document_version text not null, accepted_at timestamptz not null default now(), user_agent text,
  unique(acquisition_id, document_type, document_version)
);
create table if not exists public.customer_acquisition_business_profile (
  acquisition_id uuid primary key references public.customer_acquisition(id) on delete cascade,
  segment text not null, segment_other text, revenue_range text not null, current_system_status text not null,
  current_system_name text, migration_interest boolean, needs text[] not null default '{}', needs_other text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((segment <> 'outros') or nullif(trim(coalesce(segment_other,'')), '') is not null),
  check (not ('Outros' = any(needs)) or nullif(trim(coalesce(needs_other,'')), '') is not null)
);
create table if not exists public.customer_acquisition_event (
  id uuid primary key default gen_random_uuid(), acquisition_id uuid not null references public.customer_acquisition(id) on delete cascade,
  event_type text not null, payload jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.customer_acquisition_rate_limit (
  subject text primary key, attempts integer not null default 0, window_started_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists customer_acquisition_user_idx on public.customer_acquisition(user_id);
create index if not exists customer_acquisition_activity_idx on public.customer_acquisition(last_activity_at desc);
alter table public.customer_acquisition enable row level security;
alter table public.customer_acquisition_consent enable row level security;
alter table public.customer_acquisition_business_profile enable row level security;
alter table public.customer_acquisition_event enable row level security;
create policy customer_acquisition_owner_read on public.customer_acquisition for select using (auth.uid() = user_id);
create policy customer_acquisition_owner_read_consent on public.customer_acquisition_consent for select using (auth.uid() = user_id);
create policy customer_acquisition_owner_read_profile on public.customer_acquisition_business_profile for select using (exists (select 1 from public.customer_acquisition a where a.id = acquisition_id and a.user_id = auth.uid()));

create or replace function public.cap_transition_allowed(p_from text, p_to text) returns boolean language sql immutable as $$
 select (p_from,p_to) in (('draft','account_pending'),('account_pending','email_confirmation_pending'),('account_pending','account_created'),('email_confirmation_pending','account_created'),('account_created','business_profile_pending'),('business_profile_pending','business_profile_completed'),('business_profile_completed','company_profile_pending'),('company_profile_pending','abandoned'),('plan_selection_pending','abandoned'),('payment_pending','payment_processing'),('payment_processing','payment_failed'),('payment_processing','payment_confirmed'),('payment_confirmed','provisioning_pending'),('provisioning_pending','provisioning_processing'),('provisioning_processing','provisioning_failed'),('provisioning_processing','completed'))
$$;
create or replace function public.cap_touch(p_public_id uuid) returns public.customer_acquisition language plpgsql security definer set search_path=public as $$
declare v public.customer_acquisition;
begin select * into v from customer_acquisition where public_id=p_public_id and expires_at>now(); if not found then raise exception 'acquisition_not_found'; end if; update customer_acquisition set last_activity_at=now(), updated_at=now() where id=v.id and last_activity_at < now()-interval '30 seconds'; return v; end $$;
create or replace function public.cap_start(p_email text,p_name text,p_phone text,p_idempotency_key text,p_utm jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.customer_acquisition; v_normal text:=lower(trim(p_email)); v_count int;
begin
 if v_normal !~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' then raise exception 'invalid_email'; end if;
 if length(regexp_replace(p_phone,'\\D','','g')) not between 10 and 11 then raise exception 'invalid_phone'; end if;
 insert into customer_acquisition_rate_limit(subject,attempts,window_started_at,updated_at) values (md5(v_normal),1,now(),now()) on conflict(subject) do update set attempts=case when customer_acquisition_rate_limit.window_started_at < now()-interval '15 minutes' then 1 else customer_acquisition_rate_limit.attempts+1 end, window_started_at=case when customer_acquisition_rate_limit.window_started_at < now()-interval '15 minutes' then now() else customer_acquisition_rate_limit.window_started_at end, updated_at=now() returning attempts into v_count;
 if v_count>8 then raise exception 'rate_limited'; end if;
 select * into v from customer_acquisition where normalized_email=v_normal and expires_at>now();
 if not found then insert into customer_acquisition(email,normalized_email,full_name,phone,state,current_step,idempotency_key,utm_source,utm_medium,utm_campaign,utm_content,utm_term,referrer) values (trim(p_email),v_normal,trim(p_name),p_phone,'account_pending','conta',p_idempotency_key,p_utm->>'source',p_utm->>'medium',p_utm->>'campaign',p_utm->>'content',p_utm->>'term',p_utm->>'referrer') returning * into v; insert into customer_acquisition_event(acquisition_id,event_type) values(v.id,'AcquisitionStarted'); end if;
 return jsonb_build_object('publicId',v.public_id,'state',v.state,'step',v.current_step,'email',v.email);
end $$;
create or replace function public.cap_link_account(p_public_id uuid,p_user_id uuid,p_terms_version text,p_privacy_version text,p_user_agent text default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.customer_acquisition; v_email text;
begin select * into v from customer_acquisition where public_id=p_public_id and expires_at>now for update; if not found then raise exception 'acquisition_not_found'; end if; select lower(email) into v_email from auth.users where id=p_user_id; if v_email is null or v_email<>v.normalized_email then raise exception 'account_mismatch'; end if;
 if v.user_id is not null and v.user_id<>p_user_id then raise exception 'account_mismatch'; end if;
 if v.state not in ('account_pending','email_confirmation_pending','account_created','business_profile_pending') then raise exception 'invalid_transition'; end if;
 update customer_acquisition set user_id=p_user_id,state='business_profile_pending',current_step='perfil',last_activity_at=now(),updated_at=now() where id=v.id;
 insert into customer_acquisition_consent(acquisition_id,user_id,document_type,document_version,user_agent) values(v.id,p_user_id,'terms',p_terms_version,p_user_agent),(v.id,p_user_id,'privacy',p_privacy_version,p_user_agent) on conflict do nothing;
 insert into customer_acquisition_event(acquisition_id,event_type) values(v.id,'PendingAccountCreated'),(v.id,'LegalConsentRecorded');
 return jsonb_build_object('publicId',v.public_id,'state','business_profile_pending','step','perfil');
end $$;
create or replace function public.cap_save_business_profile(p_public_id uuid,p_profile jsonb,p_idempotency_key text) returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.customer_acquisition; v_segment text:=lower(trim(p_profile->>'segment')); v_needs text[]:=coalesce(array(select jsonb_array_elements_text(coalesce(p_profile->'needs','[]'::jsonb))), '{}');
begin select * into v from customer_acquisition where public_id=p_public_id and expires_at>now for update; if not found then raise exception 'acquisition_not_found'; end if; if v.state not in ('business_profile_pending','business_profile_completed') then raise exception 'invalid_transition'; end if; if v_segment='' then raise exception 'invalid_segment'; end if;
 insert into customer_acquisition_business_profile(acquisition_id,segment,segment_other,revenue_range,current_system_status,current_system_name,migration_interest,needs,needs_other) values(v.id,v_segment,nullif(trim(p_profile->>'segmentOther'),''),coalesce(nullif(trim(p_profile->>'revenueRange'),''),'prefiro_nao_informar'),coalesce(nullif(trim(p_profile->>'currentSystemStatus'),''),'nao_utiliza'),nullif(trim(p_profile->>'currentSystemName'),''),(p_profile->>'migrationInterest')::boolean,v_needs,nullif(trim(p_profile->>'needsOther'),'')) on conflict(acquisition_id) do update set segment=excluded.segment,segment_other=excluded.segment_other,revenue_range=excluded.revenue_range,current_system_status=excluded.current_system_status,current_system_name=excluded.current_system_name,migration_interest=excluded.migration_interest,needs=excluded.needs,needs_other=excluded.needs_other,updated_at=now();
 update customer_acquisition set state='business_profile_completed',current_step='empresa',last_activity_at=now(),updated_at=now() where id=v.id; insert into customer_acquisition_event(acquisition_id,event_type) values(v.id,'BusinessProfileCompleted'); return jsonb_build_object('publicId',v.public_id,'state','business_profile_completed','step','empresa');
end $$;
create or replace function public.cap_resume(p_public_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.customer_acquisition; p jsonb;
begin select * into v from customer_acquisition where public_id=p_public_id and expires_at>now; if not found then raise exception 'acquisition_not_found'; end if; select to_jsonb(b) into p from customer_acquisition_business_profile b where b.acquisition_id=v.id; return jsonb_build_object('publicId',v.public_id,'email',v.email,'fullName',v.full_name,'phone',v.phone,'state',v.state,'step',v.current_step,'profile',p); end $$;
revoke all on function public.cap_start(text,text,text,text,jsonb), public.cap_link_account(uuid,uuid,text,text,text), public.cap_save_business_profile(uuid,jsonb,text), public.cap_resume(uuid), public.cap_touch(uuid) from public;
grant execute on function public.cap_start(text,text,text,text,jsonb), public.cap_link_account(uuid,uuid,text,text,text), public.cap_save_business_profile(uuid,jsonb,text), public.cap_resume(uuid), public.cap_touch(uuid) to anon, authenticated;
