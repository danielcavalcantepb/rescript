-- Fiscal foundation: classifications and rules only. No document emission or tax calculation.

create table public.tax_profile (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organization(id) on delete restrict,
  code text not null, name text not null, status text not null default 'active' check(status in('active','inactive','archived')),
  ncm text, cfop text, cst text, csosn text, origin text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
  unique(organization_id,code)
);
create table public.fiscal_classification (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organization(id) on delete restrict,
  variant_id uuid not null references public.product_variant(id) on delete restrict, tax_profile_id uuid not null references public.tax_profile(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id), unique(organization_id,variant_id)
);
create table public.fiscal_operation (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organization(id) on delete restrict,
  code text not null, name text not null, operation_type text not null check(operation_type in('sale','purchase','return','transfer')), cfop text,
  status text not null default 'active' check(status in('active','inactive','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id), unique(organization_id,code)
);
create table public.fiscal_rule (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organization(id) on delete restrict,
  operation_id uuid not null references public.fiscal_operation(id) on delete restrict, tax_profile_id uuid not null references public.tax_profile(id) on delete restrict,
  origin_state text not null, destination_state text not null, cfop text, cst text, csosn text, status text not null default 'active' check(status in('active','inactive','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id), unique(organization_id,operation_id,tax_profile_id,origin_state,destination_state)
);
create table public.fiscal_search (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organization(id) on delete restrict,
  entity_type text not null check(entity_type in('profile','classification','operation','rule')), entity_id uuid not null, code text, name text, variant_id uuid, tax_profile_id uuid, operation_id uuid, search_text text not null default '', updated_at timestamptz not null default now(), unique(organization_id,entity_type,entity_id)
);
create index fiscal_search_text_idx on public.fiscal_search using gin(to_tsvector('simple',search_text));
create index fiscal_search_org_type_idx on public.fiscal_search(organization_id,entity_type);

create or replace function public.fiscal_has_permission(p_org uuid,p_permission text) returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from public.membership m where m.organization_id=p_org and m.user_id=auth.uid() and m.status='active' and (m.role in('owner','admin') or (m.role='manager' and p_permission in('fiscal.read','fiscal.create','fiscal.update','fiscal.archive','fiscal.rules.manage')) or (m.role='viewer' and p_permission='fiscal.read'))); $$;

create or replace function public.refresh_fiscal_search(p_type text,p_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare org uuid; code text; name text; txt text;
begin
  if p_type='profile' then select organization_id, tax_profile.code,tax_profile.name,concat_ws(' ',tax_profile.code,tax_profile.name,ncm,cfop,cst,csosn) into org,code,name,txt from tax_profile where id=p_id;
  elsif p_type='operation' then select organization_id,fiscal_operation.code,fiscal_operation.name,concat_ws(' ',fiscal_operation.code,fiscal_operation.name,cfop) into org,code,name,txt from fiscal_operation where id=p_id;
  elsif p_type='classification' then select organization_id,null::text,variant_id::text,variant_id::text from fiscal_classification where id=p_id;
  elsif p_type='rule' then select organization_id,cfop,concat(origin_state,'-',destination_state),concat_ws(' ',cfop,cst,csosn,origin_state,destination_state) into org,code,name,txt from fiscal_rule where id=p_id;
  end if;
  if org is null then delete from fiscal_search where entity_type=p_type and entity_id=p_id; return; end if;
  insert into fiscal_search(organization_id,entity_type,entity_id,code,name,search_text) values(org,p_type,p_id,code,name,lower(coalesce(txt,''))) on conflict(organization_id,entity_type,entity_id) do update set code=excluded.code,name=excluded.name,search_text=excluded.search_text,updated_at=now();
end; $$;

create or replace function public.create_tax_profile(p_org uuid,p_code text,p_name text,p_ncm text default null,p_cfop text default null,p_cst text default null,p_csosn text default null,p_origin text default null) returns public.tax_profile language plpgsql security definer set search_path=public as $$
declare x public.tax_profile; begin if not fiscal_has_permission(p_org,'fiscal.create') then raise exception 'permission_denied' using errcode='42501'; end if; insert into tax_profile(organization_id,code,name,ncm,cfop,cst,csosn,origin,created_by,updated_by) values(p_org,trim(p_code),trim(p_name),p_ncm,p_cfop,p_cst,p_csosn,p_origin,auth.uid(),auth.uid()) returning * into x; perform refresh_fiscal_search('profile',x.id); return x; end; $$;
create or replace function public.create_fiscal_operation(p_org uuid,p_code text,p_name text,p_type text,p_cfop text default null) returns public.fiscal_operation language plpgsql security definer set search_path=public as $$
declare x public.fiscal_operation; begin if not fiscal_has_permission(p_org,'fiscal.create') then raise exception 'permission_denied' using errcode='42501'; end if; insert into fiscal_operation(organization_id,code,name,operation_type,cfop,created_by,updated_by) values(p_org,trim(p_code),trim(p_name),lower(p_type),p_cfop,auth.uid(),auth.uid()) returning * into x; perform refresh_fiscal_search('operation',x.id); return x; end; $$;
create or replace function public.classify_fiscal_variant(p_org uuid,p_variant uuid,p_profile uuid) returns public.fiscal_classification language plpgsql security definer set search_path=public as $$
declare x public.fiscal_classification; begin if not fiscal_has_permission(p_org,'fiscal.update') then raise exception 'permission_denied'; end if; if not exists(select 1 from product_variant where id=p_variant and organization_id=p_org) or not exists(select 1 from tax_profile where id=p_profile and organization_id=p_org) then raise exception 'cross_tenant_reference'; end if; insert into fiscal_classification(organization_id,variant_id,tax_profile_id,created_by,updated_by) values(p_org,p_variant,p_profile,auth.uid(),auth.uid()) on conflict(organization_id,variant_id) do update set tax_profile_id=excluded.tax_profile_id,updated_at=now(),updated_by=auth.uid() returning * into x; perform refresh_fiscal_search('classification',x.id); return x; end; $$;
create or replace function public.create_fiscal_rule(p_org uuid,p_operation uuid,p_profile uuid,p_origin text,p_destination text,p_cfop text default null,p_cst text default null,p_csosn text default null) returns public.fiscal_rule language plpgsql security definer set search_path=public as $$
declare x public.fiscal_rule; begin if not fiscal_has_permission(p_org,'fiscal.rules.manage') then raise exception 'permission_denied'; end if; if not exists(select 1 from fiscal_operation where id=p_operation and organization_id=p_org) or not exists(select 1 from tax_profile where id=p_profile and organization_id=p_org) then raise exception 'cross_tenant_reference'; end if; insert into fiscal_rule(organization_id,operation_id,tax_profile_id,origin_state,destination_state,cfop,cst,csosn,created_by,updated_by) values(p_org,p_operation,p_profile,upper(p_origin),upper(p_destination),p_cfop,p_cst,p_csosn,auth.uid(),auth.uid()) returning * into x; perform refresh_fiscal_search('rule',x.id); return x; end; $$;

alter table public.tax_profile enable row level security; alter table public.fiscal_classification enable row level security; alter table public.fiscal_operation enable row level security; alter table public.fiscal_rule enable row level security; alter table public.fiscal_search enable row level security;
create policy fiscal_profile_read on tax_profile for select to authenticated using(fiscal_has_permission(organization_id,'fiscal.read')); create policy fiscal_classification_read on fiscal_classification for select to authenticated using(fiscal_has_permission(organization_id,'fiscal.read')); create policy fiscal_operation_read on fiscal_operation for select to authenticated using(fiscal_has_permission(organization_id,'fiscal.read')); create policy fiscal_rule_read on fiscal_rule for select to authenticated using(fiscal_has_permission(organization_id,'fiscal.read')); create policy fiscal_search_read on fiscal_search for select to authenticated using(fiscal_has_permission(organization_id,'fiscal.read'));
revoke all on tax_profile,fiscal_classification,fiscal_operation,fiscal_rule,fiscal_search from authenticated; grant select on tax_profile,fiscal_classification,fiscal_operation,fiscal_rule,fiscal_search to authenticated;
grant execute on function public.create_tax_profile(uuid,text,text,text,text,text,text,text),public.create_fiscal_operation(uuid,text,text,text,text),public.classify_fiscal_variant(uuid,uuid,uuid),public.create_fiscal_rule(uuid,uuid,uuid,text,text,text,text,text) to authenticated;
