-- CAP Sprint 4 consolidation. This migration evolves the initial Sprint 4
-- scaffolding without deleting historical checkout data.
create extension if not exists pgcrypto;

-- Correlation is the stable support/audit key for the full CAP chain.
alter table public.onboarding_session add column if not exists correlation_id uuid;
alter table public.subscription_intent add column if not exists correlation_id uuid;
alter table public.billing_session add column if not exists correlation_id uuid;
update public.onboarding_session set correlation_id = gen_random_uuid() where correlation_id is null;
update public.subscription_intent i set correlation_id = s.correlation_id from public.onboarding_session s where s.id = i.onboarding_session_id and i.correlation_id is null;
update public.billing_session b set correlation_id = i.correlation_id from public.subscription_intent i where i.id = b.subscription_intent_id and b.correlation_id is null;
alter table public.onboarding_session alter column correlation_id set default gen_random_uuid();
alter table public.subscription_intent alter column correlation_id set default gen_random_uuid();
alter table public.billing_session alter column correlation_id set default gen_random_uuid();

-- The approved Business Identity relation is explicit and remains the only
-- source of legal/business data used by provisioning.
alter table public.business_identity add column if not exists onboarding_id uuid;
update public.business_identity set onboarding_id = onboarding_session_id where onboarding_id is null;
alter table public.business_identity alter column onboarding_id set not null;
create unique index if not exists business_identity_onboarding_uidx on public.business_identity(onboarding_id);

-- Canonical subscription is created by Activation, before provisioning. Legacy
-- subscriptions remain compatible; organization is nullable while activation
-- is pending.
alter table public.subscription alter column organization_id drop not null;
alter table public.subscription add column if not exists gateway_customer_reference text,
  add column if not exists gateway_subscription_reference text,
  add column if not exists correlation_id uuid,
  add column if not exists cancelled_at timestamptz;
update public.subscription set correlation_id = gen_random_uuid() where correlation_id is null;
alter table public.subscription alter column correlation_id set default gen_random_uuid();
alter table public.subscription drop constraint if exists subscription_status_check;
alter table public.subscription add constraint subscription_status_check check (status in ('pending_activation','active','trial','trialing','past_due','suspended','canceled','cancelled'));

-- Activation aggregate: state is authoritative; each payment confirmation can
-- produce only one activation.
alter table public.activation add column if not exists onboarding_session_id uuid references public.onboarding_session(id) on delete restrict,
  add column if not exists gateway_event_id text,
  add column if not exists correlation_id uuid,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists last_error_code text,
  add column if not exists last_error_message text,
  add column if not exists next_retry_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists failed_at timestamptz;
update public.activation a set onboarding_session_id = i.onboarding_session_id, correlation_id = coalesce(a.correlation_id, i.correlation_id), attempt_count = greatest(coalesce(a.attempt, 1) - 1, 0)
from public.subscription_intent i where i.id = a.subscription_intent_id and a.onboarding_session_id is null;
alter table public.activation alter column onboarding_session_id set not null;
alter table public.activation alter column correlation_id set default gen_random_uuid();
drop trigger if exists activation_transition_guard on public.activation;
alter table public.activation drop constraint if exists activation_status_check;
update public.activation set status = case status when 'provisioning_started' then 'provisioning_running' when 'provisioning_completed' then 'completed' when 'retrying' then 'retry_scheduled' else status end;
alter table public.activation add constraint activation_status_check check (status in ('pending','validating','validated','subscription_creating','subscription_created','provisioning_queued','provisioning_running','completed','failed','retry_scheduled','dead_lettered','cancelled'));
create unique index if not exists activation_gateway_event_uidx on public.activation(gateway_event_id) where gateway_event_id is not null;

-- One durable inbox record per external gateway event. Raw signatures and card
-- data are intentionally never persisted.
create table if not exists public.billing_event_inbox (
  id uuid primary key default gen_random_uuid(), gateway text not null,
  external_event_id text not null, event_type text not null,
  billing_session_id uuid references public.billing_session(id) on delete restrict,
  payload jsonb not null default '{}'::jsonb, payload_hash text not null,
  status text not null default 'received' check (status in ('received','processing','processed','ignored','failed')),
  correlation_id uuid not null default gen_random_uuid(), error_code text,
  received_at timestamptz not null default now(), processed_at timestamptz, failed_at timestamptz,
  unique(gateway, external_event_id)
);
create index if not exists billing_event_inbox_status_idx on public.billing_event_inbox(status, received_at);

create table if not exists public.domain_outbox (
  id uuid primary key default gen_random_uuid(), aggregate_type text not null, aggregate_id uuid not null,
  event_type text not null, payload jsonb not null default '{}'::jsonb,
  correlation_id uuid not null, occurred_at timestamptz not null default now(), available_at timestamptz not null default now(),
  attempt_count integer not null default 0, published_at timestamptz, failed_at timestamptz,
  status text not null default 'pending' check (status in ('pending','publishing','published','failed','dead_lettered')),
  locked_at timestamptz, locked_by text
);
create index if not exists domain_outbox_available_idx on public.domain_outbox(status, available_at);
alter table public.domain_outbox add column if not exists last_error_code text,
  add column if not exists last_error_message text;

alter table public.provisioning_job add column if not exists onboarding_session_id uuid references public.onboarding_session(id) on delete restrict,
  add column if not exists correlation_id uuid,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 5,
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text,
  add column if not exists completed_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists last_error_code text,
  add column if not exists last_error_message text;
update public.provisioning_job j set onboarding_session_id = a.onboarding_session_id, correlation_id = coalesce(j.correlation_id,a.correlation_id), attempt_count = greatest(coalesce(j.attempt,1)-1,0), completed_at = coalesce(j.finished_at,case when j.status='completed' then j.updated_at end)
from public.activation a where a.id=j.activation_id and j.onboarding_session_id is null;
alter table public.provisioning_job alter column onboarding_session_id set not null;
alter table public.provisioning_job alter column correlation_id set default gen_random_uuid();
drop trigger if exists provisioning_job_transition_guard on public.provisioning_job;
alter table public.provisioning_job drop constraint if exists provisioning_job_status_check;
update public.provisioning_job set status = case status when 'retrying' then 'retry_scheduled' else status end;
alter table public.provisioning_job add constraint provisioning_job_status_check check (status in ('queued','claimed','running','completed','retry_scheduled','failed','dead_lettered','cancelled'));
create index if not exists provisioning_job_available_idx on public.provisioning_job(status,next_attempt_at) where status in ('queued','retry_scheduled');

create or replace function public.cap_activation_transition_allowed(p_from text,p_to text) returns boolean language sql immutable as $$
 select (p_from,p_to) in (('pending','validating'),('pending','cancelled'),('validating','validated'),('validating','failed'),('validated','subscription_creating'),('subscription_creating','subscription_created'),('subscription_creating','failed'),('subscription_created','provisioning_queued'),('provisioning_queued','provisioning_running'),('provisioning_queued','failed'),('provisioning_running','completed'),('provisioning_running','retry_scheduled'),('provisioning_running','failed'),('retry_scheduled','provisioning_queued'),('retry_scheduled','dead_lettered'),('failed','retry_scheduled'),('failed','dead_lettered')) $$;
create or replace function public.cap_provisioning_transition_allowed(p_from text,p_to text) returns boolean language sql immutable as $$
 select (p_from,p_to) in (('queued','claimed'),('queued','cancelled'),('retry_scheduled','claimed'),('retry_scheduled','dead_lettered'),('claimed','running'),('claimed','queued'),('running','completed'),('running','retry_scheduled'),('running','failed'),('failed','retry_scheduled'),('failed','dead_lettered')) $$;
create trigger activation_transition_guard before update on public.activation for each row execute function public.cap_guard_activation_transition();
create trigger provisioning_job_transition_guard before update on public.provisioning_job for each row execute function public.cap_guard_provisioning_transition();

create or replace function public.cap_outbox(p_type text,p_id uuid,p_event text,p_payload jsonb,p_correlation uuid) returns void language plpgsql security definer set search_path=public as $$ begin insert into public.domain_outbox(aggregate_type,aggregate_id,event_type,payload,correlation_id) values(p_type,p_id,p_event,coalesce(p_payload,'{}'::jsonb),p_correlation); end $$;

-- Inbox accepts normalized facts only from a server-side adapter. It does not
-- accept a client boolean claiming a signature was verified.
create or replace function public.cap_ingest_billing_event(p_gateway text,p_external_event_id text,p_billing_session_public_id uuid,p_event_type text,p_payload jsonb,p_payload_hash text,p_correlation_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_billing public.billing_session; v_inbox public.billing_event_inbox; begin
 if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
 if nullif(trim(p_external_event_id),'') is null or nullif(trim(p_payload_hash),'') is null then raise exception 'invalid_billing_event' using errcode='22023'; end if;
 select * into v_billing from public.billing_session where public_id=p_billing_session_public_id for update;
 if not found then raise exception 'billing_session_not_found' using errcode='22023'; end if;
 insert into public.billing_event_inbox(gateway,external_event_id,event_type,billing_session_id,payload,payload_hash,correlation_id)
 values(lower(trim(p_gateway)),trim(p_external_event_id),trim(p_event_type),v_billing.id,coalesce(p_payload,'{}'::jsonb),trim(p_payload_hash),coalesce(p_correlation_id,v_billing.correlation_id))
 on conflict(gateway,external_event_id) do nothing returning * into v_inbox;
 if v_inbox.id is null then return jsonb_build_object('accepted',true,'duplicate',true); end if;
 if p_event_type <> 'payment_succeeded' then update public.billing_event_inbox set status='ignored',processed_at=now() where id=v_inbox.id; return jsonb_build_object('accepted',true,'ignored',true); end if;
 if v_billing.status='created' then update public.billing_session set status='started' where id=v_billing.id; end if;
 if v_billing.status='started' then update public.billing_session set status='payment_processing' where id=v_billing.id; end if;
 if v_billing.status='payment_processing' then update public.billing_session set status='payment_confirmed' where id=v_billing.id; end if;
 update public.billing_event_inbox set status='processing' where id=v_inbox.id;
 return public.cap_orchestrate_activation(v_inbox.id);
end $$;

create or replace function public.cap_orchestrate_activation(p_inbox_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare e public.billing_event_inbox; b public.billing_session; i public.subscription_intent; s public.onboarding_session; bi public.business_identity; a public.activation; sub_id uuid; job_id uuid; version_id uuid; begin
 if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
 select * into e from public.billing_event_inbox where id=p_inbox_id for update; if not found then raise exception 'billing_event_not_found'; end if;
 if e.status='processed' then return jsonb_build_object('accepted',true,'duplicate',true); end if;
 select * into b from public.billing_session where id=e.billing_session_id for update; select * into i from public.subscription_intent where id=b.subscription_intent_id for update; select * into s from public.onboarding_session where id=i.onboarding_session_id for update;
 select * into bi from public.business_identity where onboarding_id=s.id; if not found or nullif(trim(bi.legal_name),'') is null then raise exception 'business_identity_invalid' using errcode='22023'; end if;
 if b.status <> 'payment_confirmed' or i.selected_plan_id is null or i.selected_price_id is null then raise exception 'payment_or_plan_invalid' using errcode='22023'; end if;
 select * into a from public.activation where billing_session_id=b.id for update;
 if found then update public.billing_event_inbox set status='processed',processed_at=now() where id=e.id; return jsonb_build_object('activationId',a.public_id,'duplicate',true); end if;
 insert into public.activation(onboarding_session_id,subscription_intent_id,billing_session_id,gateway_event_id,correlation_id,idempotency_key,status,started_at) values(s.id,i.id,b.id,e.external_event_id,e.correlation_id,e.external_event_id,'pending',now()) returning * into a;
 update public.activation set status='validating' where id=a.id; update public.activation set status='validated' where id=a.id; update public.activation set status='subscription_creating' where id=a.id;
 select plan_version_id into version_id from public.saas_plan_price where id=i.selected_price_id;
 insert into public.subscription(organization_id,plan_version_id,onboarding_session_id,subscription_intent_id,billing_session_id,plan_id,price_id,billing_cycle,currency,status,started_at,current_period_start,created_by,updated_by,correlation_id)
 values(null,version_id,s.id,i.id,b.id,i.selected_plan_id,i.selected_price_id,i.billing_cycle,i.currency,'pending_activation',now(),now(),s.user_id,s.user_id,e.correlation_id) returning id into sub_id;
 update public.activation set status='subscription_created' where id=a.id;
 insert into public.provisioning_job(activation_id,onboarding_session_id,subscription_id,correlation_id,status) values(a.id,s.id,sub_id,e.correlation_id,'queued') returning id into job_id;
 update public.activation set status='provisioning_queued' where id=a.id;
 perform public.cap_outbox('activation',a.id,'PaymentConfirmed',jsonb_build_object('billingSessionId',b.public_id),e.correlation_id); perform public.cap_outbox('activation',a.id,'ActivationStarted','{}',e.correlation_id); perform public.cap_outbox('subscription',sub_id,'SubscriptionCreated','{}',e.correlation_id); perform public.cap_outbox('provisioning_job',job_id,'ProvisioningQueued','{}',e.correlation_id);
 update public.billing_event_inbox set status='processed',processed_at=now() where id=e.id;
 return jsonb_build_object('activationId',a.public_id,'provisioningJobId',job_id,'duplicate',false);
exception when others then update public.billing_event_inbox set status='failed',failed_at=now(),error_code=left(sqlerrm,120) where id=p_inbox_id; raise; end $$;

create or replace function public.cap_claim_provisioning_job(p_worker_id text) returns jsonb language plpgsql security definer set search_path=public as $$
declare j public.provisioning_job; begin if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
 select * into j from public.provisioning_job where status in ('queued','retry_scheduled') and next_attempt_at<=now() order by created_at for update skip locked limit 1;
 if not found then return null; end if; update public.provisioning_job set status='claimed',locked_at=now(),locked_by=left(trim(p_worker_id),120) where id=j.id returning * into j; return jsonb_build_object('jobPublicId',j.public_id,'activationId',(select public_id from public.activation where id=j.activation_id),'correlationId',j.correlation_id); end $$;

-- The worker invokes this only for a claimed job. It performs no payment or
-- plan decision and links the Subscription created by the orchestrator.
create or replace function public.cap_execute_provisioning(p_activation_public_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.activation; j public.provisioning_job; s public.onboarding_session; bi public.business_identity; v_org uuid; v_branch uuid; v_slug text; v_suffix int:=0; begin
 if auth.role()<>'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
 select * into a from public.activation where public_id=p_activation_public_id for update; if not found then raise exception 'activation_not_found' using errcode='22023'; end if;
 select * into j from public.provisioning_job where activation_id=a.id for update; if j.status='completed' then return jsonb_build_object('activationId',a.public_id,'organizationId',j.organization_id,'idempotent',true); end if;
 if j.status='queued' then update public.provisioning_job set status='claimed',locked_at=now(),locked_by='direct-worker' where id=j.id; end if;
 select * into j from public.provisioning_job where id=j.id for update; if j.status<>'claimed' then raise exception 'provisioning_not_claimed' using errcode='22023'; end if;
 select * into s from public.onboarding_session where id=a.onboarding_session_id; select * into bi from public.business_identity where onboarding_id=s.id;
 if not found or s.user_id is null then raise exception 'business_identity_or_owner_missing' using errcode='22023'; end if;
 update public.provisioning_job set status='running',started_at=coalesce(started_at,now()),attempt_count=attempt_count+1 where id=j.id;
 update public.activation set status='provisioning_running' where id=a.id;
 v_slug:=trim(both '-' from lower(regexp_replace(coalesce(nullif(bi.trade_name,''),bi.legal_name),'[^a-zA-Z0-9]+','-','g'))); if v_slug='' then v_slug:='rescript'; end if;
 while exists(select 1 from public.organization where slug=v_slug) loop v_suffix:=v_suffix+1; v_slug:=left(v_slug,42)||'-'||v_suffix; end loop;
 insert into public.organization(name,slug,status,currency,created_by) values(coalesce(nullif(bi.trade_name,''),bi.legal_name),v_slug,'active','BRL',s.user_id) returning id into v_org;
 insert into public.membership(organization_id,user_id,role,status,is_owner,created_by) values(v_org,s.user_id,'owner','active',true,s.user_id);
 select public.ensure_default_branch(v_org,s.user_id) into v_branch;
 insert into public.stock_location(organization_id,code,name,is_default,priority,created_by,updated_by) values(v_org,'principal','Principal',true,100,s.user_id,s.user_id) on conflict (organization_id,lower(code)) do nothing;
 insert into public.inventory_policy(organization_id,created_by,updated_by) values(v_org,s.user_id,s.user_id) on conflict (organization_id) do nothing;
 insert into public.tenant_provisioning_configuration(organization_id,created_by,updated_by) values(v_org,s.user_id,s.user_id) on conflict (organization_id) do nothing;
 update public.subscription set organization_id=v_org,status='active',started_at=coalesce(started_at,now()) where id=j.subscription_id;
 update public.provisioning_job set organization_id=v_org,status='completed',completed_at=now(),locked_at=null,locked_by=null where id=j.id;
 update public.activation set status='completed',completed_at=now() where id=a.id;
 perform public.cap_outbox('provisioning_job',j.id,'ProvisioningCompleted',jsonb_build_object('organizationId',v_org),j.correlation_id); perform public.cap_outbox('activation',a.id,'TenantActivated',jsonb_build_object('organizationId',v_org),a.correlation_id);
 return jsonb_build_object('activationId',a.public_id,'organizationId',v_org,'subscriptionId',j.subscription_id,'idempotent',false);
exception when others then
 update public.provisioning_job set status='failed',failed_at=now(),last_error_code='provisioning_failed',last_error_message=left(sqlerrm,500),locked_at=null,locked_by=null where activation_id=a.id and status in ('claimed','running');
 update public.activation set status='failed',failed_at=now(),last_error_code='provisioning_failed',last_error_message=left(sqlerrm,500) where id=a.id and status='provisioning_running'; raise;
end $$;

-- Legacy checkout may remain readable, but direct provisioning is permanently
-- blocked for new callers. Activation is the single provisioning authority.
create or replace function public.provision_checkout_session(p_public_token uuid,p_owner_user_id uuid,p_idempotency_key text) returns jsonb language plpgsql security definer set search_path=public as $$ begin raise exception 'legacy_checkout_provisioning_deprecated_use_activation' using errcode='22023'; end $$;

alter table public.billing_event_inbox enable row level security; alter table public.domain_outbox enable row level security;
revoke all on public.billing_event_inbox,public.domain_outbox from anon,authenticated;
revoke all on function public.cap_ingest_billing_event(text,text,uuid,text,jsonb,text,uuid), public.cap_orchestrate_activation(uuid), public.cap_claim_provisioning_job(text) from public,anon,authenticated;
grant execute on function public.cap_ingest_billing_event(text,text,uuid,text,jsonb,text,uuid), public.cap_orchestrate_activation(uuid), public.cap_claim_provisioning_job(text) to service_role;
comment on function public.cap_ingest_billing_event(text,text,uuid,text,jsonb,text,uuid) is 'Only server-side gateway adapters call this function after cryptographic signature verification.';

-- Retry, dead-letter and outbox are operational concerns. The worker executes
-- jobs; these functions own every state decision and retain the failed record.
create or replace function public.cap_schedule_provisioning_retry(
  p_activation_public_id uuid,
  p_error_code text,
  p_error_message text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.activation; j public.provisioning_job; v_delay interval; begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  select * into a from public.activation where public_id=p_activation_public_id for update;
  if not found then raise exception 'activation_not_found' using errcode='22023'; end if;
  select * into j from public.provisioning_job where activation_id=a.id for update;
  if not found then raise exception 'provisioning_job_not_found' using errcode='22023'; end if;
  if j.status='completed' then return jsonb_build_object('status','completed','idempotent',true); end if;
  if j.attempt_count >= j.max_attempts then
    if j.status <> 'dead_lettered' then update public.provisioning_job set status='dead_lettered',failed_at=now(),last_error_code=left(coalesce(p_error_code,'provisioning_failed'),120),last_error_message=left(coalesce(p_error_message,'unknown provisioning error'),500),locked_at=null,locked_by=null where id=j.id; end if;
    if a.status <> 'dead_lettered' then update public.activation set status='dead_lettered',failed_at=now(),last_error_code=left(coalesce(p_error_code,'provisioning_failed'),120),last_error_message=left(coalesce(p_error_message,'unknown provisioning error'),500) where id=a.id; end if;
    perform public.cap_outbox('provisioning_job',j.id,'ProvisioningDeadLettered',jsonb_build_object('errorCode',p_error_code),j.correlation_id);
    return jsonb_build_object('status','dead_lettered','attemptCount',j.attempt_count);
  end if;
  v_delay := case j.attempt_count when 0 then interval '0 seconds' when 1 then interval '1 minute' when 2 then interval '5 minutes' when 3 then interval '15 minutes' else interval '1 hour' end;
  if j.status <> 'retry_scheduled' then update public.provisioning_job set status='retry_scheduled',next_attempt_at=now()+v_delay,last_error_code=left(coalesce(p_error_code,'provisioning_failed'),120),last_error_message=left(coalesce(p_error_message,'unknown provisioning error'),500),locked_at=null,locked_by=null where id=j.id; end if;
  if a.status <> 'retry_scheduled' then update public.activation set status='retry_scheduled',next_retry_at=now()+v_delay,last_error_code=left(coalesce(p_error_code,'provisioning_failed'),120),last_error_message=left(coalesce(p_error_message,'unknown provisioning error'),500) where id=a.id; end if;
  perform public.cap_outbox('provisioning_job',j.id,'ProvisioningRetryScheduled',jsonb_build_object('attemptCount',j.attempt_count,'nextAttemptAt',now()+v_delay),j.correlation_id);
  return jsonb_build_object('status','retry_scheduled','attemptCount',j.attempt_count,'nextAttemptAt',now()+v_delay);
end $$;

create or replace function public.cap_reprocess_provisioning_dead_letter(p_activation_public_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.activation; j public.provisioning_job; begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  select * into a from public.activation where public_id=p_activation_public_id for update;
  select * into j from public.provisioning_job where activation_id=a.id for update;
  if not found then raise exception 'provisioning_job_not_found' using errcode='22023'; end if;
  if j.status <> 'dead_lettered' then raise exception 'provisioning_not_dead_lettered' using errcode='22023'; end if;
  update public.provisioning_job set status='retry_scheduled',attempt_count=0,next_attempt_at=now(),last_error_code=null,last_error_message=null,failed_at=null where id=j.id;
  update public.activation set status='retry_scheduled',attempt_count=0,next_retry_at=now(),last_error_code=null,last_error_message=null,failed_at=null where id=a.id;
  perform public.cap_outbox('provisioning_job',j.id,'ProvisioningReprocessingRequested','{}',j.correlation_id);
  return jsonb_build_object('status','retry_scheduled','activationId',a.public_id);
end $$;

create or replace function public.cap_claim_outbox_events(p_publisher_id text, p_limit integer default 25) returns setof public.domain_outbox language plpgsql security definer set search_path=public as $$
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  return query
  with claimed as (
    select id from public.domain_outbox where status='pending' and available_at<=now()
    order by occurred_at for update skip locked limit greatest(1,least(coalesce(p_limit,25),100))
  )
  update public.domain_outbox o set status='publishing',locked_at=now(),locked_by=left(trim(p_publisher_id),120),attempt_count=o.attempt_count+1
  from claimed where o.id=claimed.id returning o.*;
end $$;

create or replace function public.cap_mark_outbox_event_published(p_event_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  update public.domain_outbox set status='published',published_at=now(),locked_at=null,locked_by=null where id=p_event_id and status='publishing';
end $$;

create or replace function public.cap_mark_outbox_event_failed(
  p_event_id uuid,
  p_error_code text,
  p_error_message text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare e public.domain_outbox; v_delay interval; begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  select * into e from public.domain_outbox where id=p_event_id for update;
  if not found then raise exception 'outbox_event_not_found' using errcode='22023'; end if;
  if e.status='published' then return jsonb_build_object('status','published','idempotent',true); end if;
  if e.attempt_count >= 5 then
    update public.domain_outbox set status='dead_lettered',failed_at=now(),locked_at=null,locked_by=null,last_error_code=left(coalesce(p_error_code,'publisher_failed'),120),last_error_message=left(coalesce(p_error_message,'unknown publisher error'),500) where id=e.id;
    return jsonb_build_object('status','dead_lettered','attemptCount',e.attempt_count);
  end if;
  v_delay := case e.attempt_count when 1 then interval '1 minute' when 2 then interval '5 minutes' when 3 then interval '15 minutes' else interval '1 hour' end;
  update public.domain_outbox set status='pending',available_at=now()+v_delay,locked_at=null,locked_by=null,last_error_code=left(coalesce(p_error_code,'publisher_failed'),120),last_error_message=left(coalesce(p_error_message,'unknown publisher error'),500) where id=e.id;
  return jsonb_build_object('status','pending','attemptCount',e.attempt_count,'availableAt',now()+v_delay);
end $$;

create or replace view public.cap_activation_timeline as
select a.onboarding_session_id, a.correlation_id, 'activation'::text as source, a.id as source_id, a.status as state, a.created_at as occurred_at, a.last_error_code, a.last_error_message from public.activation a
union all
select j.onboarding_session_id, j.correlation_id, 'provisioning_job'::text, j.id, j.status, j.created_at, j.last_error_code, j.last_error_message from public.provisioning_job j
union all
select si.onboarding_session_id, i.correlation_id, 'billing_event'::text, i.id, i.status, i.received_at, i.error_code, null::text from public.billing_event_inbox i join public.billing_session b on b.id=i.billing_session_id join public.subscription_intent si on si.id=b.subscription_intent_id;

revoke all on function public.cap_schedule_provisioning_retry(uuid,text,text), public.cap_reprocess_provisioning_dead_letter(uuid), public.cap_claim_outbox_events(text,integer), public.cap_mark_outbox_event_published(uuid), public.cap_mark_outbox_event_failed(uuid,text,text) from public,anon,authenticated;
grant execute on function public.cap_schedule_provisioning_retry(uuid,text,text), public.cap_reprocess_provisioning_dead_letter(uuid), public.cap_claim_outbox_events(text,integer), public.cap_mark_outbox_event_published(uuid), public.cap_mark_outbox_event_failed(uuid,text,text) to service_role;
revoke all on public.cap_activation_timeline from anon,authenticated;
