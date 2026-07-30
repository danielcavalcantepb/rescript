-- Retail product creation: resolve the default Varejo price list and bind the
-- NCM through Fiscal ownership. Product and ProductVariant remain free of NCM.

create or replace function public.create_product_with_retail_fiscal_setup(
  p_organization_id uuid,
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_payload jsonb := p_payload;
  v_price_list_id uuid := nullif(p_payload->>'priceListId', '')::uuid;
  v_result jsonb;
  v_ncm text := nullif(regexp_replace(coalesce(p_payload->>'ncm', ''), '\\D', '', 'g'), '');
  v_ncm_description text := nullif(trim(coalesce(p_payload->>'ncmDescription', '')), '');
  v_profile_id uuid;
  v_classification_id uuid;
  v_variant jsonb;
begin
  perform public.product_creation_require_permission(p_organization_id);
  if v_ncm is not null and char_length(v_ncm) <> 8 then
    raise exception 'invalid_ncm' using errcode = '22023';
  end if;

  -- Varejo is the only implicit price list in the retail flow. It is created
  -- once, is active and default, and is still owned by Pricing.
  if v_price_list_id is null then
    select id into v_price_list_id from public.price_list
      where organization_id = p_organization_id and status = 'active' and is_default
      limit 1;
    if v_price_list_id is null then
      insert into public.price_list (
        organization_id, name, code, currency, valid_from, is_default, priority,
        status, created_by, updated_by
      ) values (
        p_organization_id, 'Varejo', 'VAREJO', 'BRL', current_date, true, 0,
        'active', v_actor, v_actor
      ) on conflict (organization_id, code) do update set updated_at = now()
      returning id into v_price_list_id;
      if v_price_list_id is null then
        select id into v_price_list_id from public.price_list
          where organization_id = p_organization_id and code = 'VAREJO';
      end if;
    end if;
    v_payload := jsonb_set(v_payload, '{priceListId}', to_jsonb(v_price_list_id::text));
  end if;

  v_result := public.create_product_with_initial_setup(
    p_organization_id, v_payload, p_idempotency_key
  );

  if v_ncm is not null then
    select id into v_profile_id from public.tax_profile
      where organization_id = p_organization_id and ncm = v_ncm and status = 'active'
      limit 1;
    if v_profile_id is null then
      insert into public.tax_profile (
        organization_id, code, name, ncm, status, created_by, updated_by
      ) values (
        p_organization_id, 'NCM-' || v_ncm,
        coalesce(v_ncm_description, 'Classificação NCM ' || v_ncm), v_ncm,
        'active', v_actor, v_actor
      ) on conflict (organization_id, code) do update set
        name = excluded.name, ncm = excluded.ncm, updated_at = now(), updated_by = v_actor
      returning id into v_profile_id;
      perform public.refresh_fiscal_search('profile', v_profile_id);
    end if;

    for v_variant in select value from jsonb_array_elements(v_result->'variants') loop
      insert into public.fiscal_classification (
        organization_id, variant_id, tax_profile_id, created_by, updated_by
      ) values (
        p_organization_id, (v_variant->>'variantId')::uuid, v_profile_id, v_actor, v_actor
      ) on conflict (organization_id, variant_id) do update set
        tax_profile_id = excluded.tax_profile_id, updated_at = now(), updated_by = v_actor
      returning id into v_classification_id;
      perform public.refresh_fiscal_search('classification', v_classification_id);
    end loop;
    insert into public.audit_event (
      organization_id, actor_user_id, aggregate_type, aggregate_id, action, after_state
    ) values (
      p_organization_id, v_actor, 'FiscalClassification', (v_result->>'productId')::uuid,
      'ProductFiscalClassificationApplied',
      jsonb_build_object('ncm', v_ncm, 'taxProfileId', v_profile_id)
    );
  end if;

  return v_result || jsonb_build_object('ncm', v_ncm, 'taxProfileId', v_profile_id);
end;
$$;

revoke all on function public.create_product_with_retail_fiscal_setup(uuid, jsonb, text) from public;
grant execute on function public.create_product_with_retail_fiscal_setup(uuid, jsonb, text) to authenticated;

comment on function public.create_product_with_retail_fiscal_setup(uuid, jsonb, text) is
  'Retail product-creation entry point: delegates Catalog/Pricing/Inventory to the canonical orchestrator and binds NCM through Fiscal.';
