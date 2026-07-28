-- Goods Receiving compatibility hardening.
-- Purchasing's canonical lifecycle is Confirmed; the legacy receiving
-- function historically accepted Approved. Preserve the existing function,
-- ledger transaction, locks and idempotency while widening only this input.

do $$
declare
  definition text;
begin
  select pg_get_functiondef(p.oid)
    into definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'post_goods_receipt'
    and pg_get_function_identity_arguments(p.oid) =
      'p_organization_id uuid, p_goods_receipt_id uuid, p_idempotency_key text, p_allow_over_receive boolean';

  if definition is null then
    raise exception 'post_goods_receipt_function_not_found';
  end if;

  if position('v_po.status <> ''approved''' in definition) = 0 then
    raise exception 'post_goods_receipt_definition_unexpected';
  end if;

  definition := replace(
    definition,
    'v_po.status <> ''approved''',
    'v_po.status not in (''approved'', ''confirmed'')'
  );

  execute definition;
end;
$$;

comment on function public.post_goods_receipt(uuid, uuid, text, boolean) is
  'Atomic receiving post. Accepts canonical Confirmed and legacy Approved purchase orders; ledger remains the only stock source.';

-- Include product/variant/SKU snapshots in the rebuildable search projection.
do $$
declare
  definition text;
begin
  select pg_get_functiondef(p.oid)
    into definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'refresh_goods_receipt_search'
    and pg_get_function_identity_arguments(p.oid) = 'p_goods_receipt_id uuid';

  if definition is null then
    raise exception 'refresh_goods_receipt_search_function_not_found';
  end if;

  definition := replace(
    definition,
    'coalesce(gr.notes, '''')',
    'coalesce(gr.notes, ''''), coalesce((select string_agg(concat_ws('' '', variant_name, variant_sku, notes), '' '') from public.goods_receipt_item where goods_receipt_id = gr.id), '''')'
  );
  execute definition;
end;
$$;

create or replace function public.trg_refresh_goods_receipt_search_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_goods_receipt_search(
    coalesce(new.goods_receipt_id, old.goods_receipt_id)
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists goods_receipt_item_search_refresh on public.goods_receipt_item;
create trigger goods_receipt_item_search_refresh
  after insert or update or delete on public.goods_receipt_item
  for each row execute function public.trg_refresh_goods_receipt_search_item();
