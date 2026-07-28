-- Fiscal Tax Engine: deterministic rule resolution only; no monetary tax calculation.

alter table public.fiscal_search add column if not exists operation_type text;
alter table public.fiscal_search add column if not exists state_origin text;
alter table public.fiscal_search add column if not exists state_destination text;
alter table public.fiscal_search add column if not exists profile_code text;

create or replace function public.fiscal_has_permission(p_org uuid,p_permission text) returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from public.membership m where m.organization_id=p_org and m.user_id=auth.uid() and m.status='active' and (m.role in('owner','admin') or (m.role='manager' and p_permission in('fiscal.read','fiscal.create','fiscal.update','fiscal.archive','fiscal.rules.manage','fiscal.preview','fiscal.resolve')) or (m.role='viewer' and p_permission in('fiscal.read','fiscal.preview','fiscal.resolve')))); $$;

create or replace function public.resolve_fiscal_rule(
  p_organization_id uuid, p_operation_id uuid, p_tax_profile_id uuid,
  p_variant_id uuid, p_origin_state text, p_destination_state text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare matches integer; result jsonb;
begin
  if not public.fiscal_has_permission(p_organization_id,'fiscal.resolve') then raise exception 'permission_denied' using errcode='42501'; end if;
  if not exists(select 1 from public.product_variant where id=p_variant_id and organization_id=p_organization_id)
     or not exists(select 1 from public.tax_profile where id=p_tax_profile_id and organization_id=p_organization_id)
     or not exists(select 1 from public.fiscal_operation where id=p_operation_id and organization_id=p_organization_id) then
    raise exception 'cross_tenant_reference' using errcode='42501';
  end if;
  select count(*) into matches from public.fiscal_rule r where r.organization_id=p_organization_id and r.operation_id=p_operation_id and r.tax_profile_id=p_tax_profile_id and upper(r.origin_state)=upper(trim(p_origin_state)) and upper(r.destination_state)=upper(trim(p_destination_state)) and r.status='active';
  if matches=0 then raise exception 'fiscal_rule_not_found'; end if;
  if matches>1 then raise exception 'fiscal_rule_ambiguous'; end if;
  select jsonb_build_object('rule',to_jsonb(r),'operation',to_jsonb(o),'taxProfile',to_jsonb(t),'variantId',p_variant_id,'origin',t.origin) into result
    from public.fiscal_rule r join public.fiscal_operation o on o.id=r.operation_id join public.tax_profile t on t.id=r.tax_profile_id
    where r.organization_id=p_organization_id and r.operation_id=p_operation_id and r.tax_profile_id=p_tax_profile_id and upper(r.origin_state)=upper(trim(p_origin_state)) and upper(r.destination_state)=upper(trim(p_destination_state)) and r.status='active';
  return result;
end; $$;
grant execute on function public.resolve_fiscal_rule(uuid,uuid,uuid,uuid,text,text) to authenticated;
