-- Fix the classification branch of the fiscal search projection.
-- The original implementation selected values without assigning them to the
-- local variables, which made every product creation with an NCM roll back.

create or replace function public.refresh_fiscal_search(p_type text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid;
  code text;
  name text;
  txt text;
begin
  if p_type = 'profile' then
    select organization_id, tax_profile.code, tax_profile.name,
      concat_ws(' ', tax_profile.code, tax_profile.name, ncm, cfop, cst, csosn)
      into org, code, name, txt
      from public.tax_profile where id = p_id;
  elsif p_type = 'operation' then
    select organization_id, fiscal_operation.code, fiscal_operation.name,
      concat_ws(' ', fiscal_operation.code, fiscal_operation.name, cfop)
      into org, code, name, txt
      from public.fiscal_operation where id = p_id;
  elsif p_type = 'classification' then
    select organization_id, null::text, variant_id::text, variant_id::text
      into org, code, name, txt
      from public.fiscal_classification where id = p_id;
  elsif p_type = 'rule' then
    select organization_id, cfop, concat(origin_state, '-', destination_state),
      concat_ws(' ', cfop, cst, csosn, origin_state, destination_state)
      into org, code, name, txt
      from public.fiscal_rule where id = p_id;
  else
    raise exception 'invalid_fiscal_search_entity_type' using errcode = '22023';
  end if;

  if org is null then
    delete from public.fiscal_search where entity_type = p_type and entity_id = p_id;
    return;
  end if;

  insert into public.fiscal_search(
    organization_id, entity_type, entity_id, code, name, search_text
  ) values (org, p_type, p_id, code, name, lower(coalesce(txt, '')))
  on conflict (organization_id, entity_type, entity_id) do update set
    code = excluded.code,
    name = excluded.name,
    search_text = excluded.search_text,
    updated_at = now();
end;
$$;
