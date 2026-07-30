-- Keep orchestrator-generated idempotency keys inside the Inventory Ledger's
-- canonical 128-character limit. The previous composition included four UUIDs
-- and could exceed the constraint before the product transaction completed.
-- Hashing retains deterministic retry semantics without weakening the Ledger
-- contract or storing oversized keys.

do $$
declare
  v_definition text;
begin
  select pg_get_functiondef(
    'public.create_product_with_initial_setup(uuid,jsonb,text)'::regprocedure
  ) into v_definition;

  v_definition := replace(
    v_definition,
    '''price:'' || p_idempotency_key || '':'' || v_identity',
    '''price:'' || md5(p_idempotency_key || '':'' || v_identity)'
  );
  v_definition := replace(
    v_definition,
    '''inventory:'' || p_idempotency_key || '':'' || v_identity || '':'' || v_branch_id::text || '':'' || v_location_id::text',
    '''inventory:'' || md5(p_idempotency_key || '':'' || v_identity || '':'' || v_branch_id::text || '':'' || v_location_id::text)'
  );
  v_definition := replace(
    v_definition,
    '''valuation:'' || p_idempotency_key || '':'' || v_identity || '':'' || v_variant_branch_id::text || '':'' || v_location_id::text',
    '''valuation:'' || md5(p_idempotency_key || '':'' || v_identity || '':'' || v_variant_branch_id::text || '':'' || v_location_id::text)'
  );

  if position('''inventory:'' || p_idempotency_key' in v_definition) > 0 then
    raise exception 'product_creation_idempotency_key_patch_failed';
  end if;

  execute v_definition;
end;
$$;

comment on function public.create_product_with_initial_setup(uuid, jsonb, text) is
  'ProductCreationOrchestrator: one PostgreSQL transaction across Catalog, Pricing, Inventory Ledger and InitialInventoryValuation. Child idempotency keys are deterministic and Ledger-safe.';
