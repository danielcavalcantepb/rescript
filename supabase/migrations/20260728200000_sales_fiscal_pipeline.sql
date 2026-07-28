-- Sales -> Fiscal pipeline. This is the only operational adapter in this phase.

alter table public.fiscal_document_search add column if not exists sales_order_id uuid;
alter table public.fiscal_document_search add column if not exists sales_order_number text;
alter table public.fiscal_document_search add column if not exists customer_name text;
alter table public.fiscal_document_search add column if not exists item_count integer;

create index if not exists fiscal_document_search_sales_order_idx
  on public.fiscal_document_search(organization_id, sales_order_id);

-- Keep the projection refresh compatible with the source-link columns introduced earlier.
create or replace function public.refresh_fiscal_document_search(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare d public.fiscal_document%rowtype; terms text; so_number text; so_customer text; item_total integer;
begin
  select * into d from public.fiscal_document where id=p_id;
  if not found then delete from public.fiscal_document_search where fiscal_document_id=p_id; return; end if;
  select string_agg(concat_ws(' ',variant_snapshot->>'name',variant_snapshot->>'sku',cfop,cst,ncm),' '), count(*)
    into terms,item_total from public.fiscal_document_item where fiscal_document_id=d.id;
  if d.source_type='SALES_ORDER' then
    select number,customer_name into so_number,so_customer from public.sales_order where id=d.source_id and organization_id=d.organization_id;
  end if;
  insert into public.fiscal_document_search(
    fiscal_document_id,organization_id,internal_number,document_type,status,source_document,operation_id,tax_profile_id,
    search_text,updated_at,source_type,source_id,sales_order_id,sales_order_number,customer_name,item_count
  ) values(
    d.id,d.organization_id,d.internal_number,d.document_type,d.status,d.source_document,d.operation_id,d.tax_profile_id,
    lower(concat_ws(' ',d.internal_number,d.source_document,so_number,so_customer,terms)),now(),d.source_type,d.source_id,
    case when d.source_type='SALES_ORDER' then d.source_id end,so_number,so_customer,item_total
  ) on conflict(fiscal_document_id) do update set
    status=excluded.status,search_text=excluded.search_text,updated_at=excluded.updated_at,source_type=excluded.source_type,
    source_id=excluded.source_id,sales_order_id=excluded.sales_order_id,sales_order_number=excluded.sales_order_number,
    customer_name=excluded.customer_name,item_count=excluded.item_count;
end; $$;

create or replace function public.build_fiscal_document_from_sales(p_organization_id uuid,p_sales_order_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare so public.sales_order%rowtype; meta public.fiscal_source_metadata%rowtype; doc public.fiscal_document%rowtype;
  item record; rule jsonb; internal_no text; actor uuid; created boolean:=false;
begin
  actor:=auth.uid();
  if actor is null or not public.fiscal_has_permission(p_organization_id,'fiscal.documents.create')
    or not public.fiscal_has_permission(p_organization_id,'fiscal.resolve')
    or not public.fiscal_has_permission(p_organization_id,'fiscal.sources.read') then
    raise exception 'permission_denied' using errcode='42501';
  end if;
  select * into so from public.sales_order where id=p_sales_order_id and organization_id=p_organization_id for update;
  if not found then raise exception 'sales_order_not_found'; end if;
  if so.status not in('confirmed') then raise exception 'sales_order_not_eligible'; end if;
  select * into meta from public.fiscal_source_metadata where organization_id=p_organization_id and source_type='SALES_ORDER' and source_id=p_sales_order_id and status='valid' for update;
  if not found then raise exception 'fiscal_source_metadata_not_valid'; end if;
  if not exists(select 1 from public.fiscal_operation where id=meta.fiscal_operation_id and organization_id=p_organization_id and status='active') then raise exception 'fiscal_operation_not_active'; end if;
  if not exists(select 1 from public.tax_profile where id=meta.tax_profile_id and organization_id=p_organization_id and status='active') then raise exception 'tax_profile_not_active'; end if;
  if not exists(select 1 from public.sales_order_item where sales_order_id=p_sales_order_id and organization_id=p_organization_id) then raise exception 'sales_order_without_items'; end if;

  select * into doc from public.fiscal_document where organization_id=p_organization_id and source_type='SALES_ORDER' and source_id=p_sales_order_id and status in('draft','ready') for update;
  if found then return jsonb_build_object('fiscal_document_id',doc.id,'internal_number',doc.internal_number,'status',doc.status,'idempotent',true); end if;
  internal_no:='FD-SO-'||replace(p_sales_order_id::text,'-','');
  insert into public.fiscal_document(organization_id,internal_number,document_type,status,source_document,source_type,source_id,operation_id,tax_profile_id,occurred_at,responsible_user_id,created_by,updated_by)
    values(p_organization_id,internal_no,'sale','draft',so.number,'SALES_ORDER',so.id,meta.fiscal_operation_id,meta.tax_profile_id,meta.fiscal_date,coalesce(meta.responsible_user_id,actor),actor,actor)
    returning * into doc;
  created:=true;
  insert into public.fiscal_document_history(organization_id,fiscal_document_id,action,actor_user_id) values(p_organization_id,doc.id,'FiscalDocumentCreatedFromSales',actor);
  insert into public.fiscal_document_history(organization_id,fiscal_document_id,action,actor_user_id) values(p_organization_id,doc.id,'FiscalSourceLinked',actor);
  for item in select * from public.sales_order_item where sales_order_id=p_sales_order_id and organization_id=p_organization_id order by sort_order, id loop
    if not exists(select 1 from public.product_variant where id=item.variant_id and organization_id=p_organization_id) then raise exception 'sales_variant_cross_tenant'; end if;
    rule:=public.resolve_fiscal_rule(p_organization_id,meta.fiscal_operation_id,meta.tax_profile_id,item.variant_id,meta.origin_state,meta.destination_state);
    insert into public.fiscal_document_item(organization_id,fiscal_document_id,variant_id,variant_snapshot,quantity,unit_code,cfop,cst,csosn,ncm,origin,created_by)
      values(p_organization_id,doc.id,item.variant_id,jsonb_build_object('productId',item.product_id,'variantId',item.variant_id,'productName',item.product_name,'name',item.variant_description,'sku',item.sku,'unit',item.unit_code),item.quantity,item.unit_code,rule->'rule'->>'cfop',rule->'rule'->>'cst',rule->'rule'->>'csosn',null,rule->>'origin',actor);
  end loop;
  insert into public.fiscal_document_history(organization_id,fiscal_document_id,action,actor_user_id) values(p_organization_id,doc.id,'FiscalRulesResolved',actor);
  insert into public.fiscal_document_history(organization_id,fiscal_document_id,action,actor_user_id) values(p_organization_id,doc.id,'FiscalDocumentSnapshotsGenerated',actor);
  perform public.refresh_fiscal_document_search(doc.id);
  return jsonb_build_object('fiscal_document_id',doc.id,'internal_number',doc.internal_number,'status',doc.status,'idempotent',false);
exception when unique_violation then
  select * into doc from public.fiscal_document where organization_id=p_organization_id and source_type='SALES_ORDER' and source_id=p_sales_order_id and status in('draft','ready');
  if found then return jsonb_build_object('fiscal_document_id',doc.id,'internal_number',doc.internal_number,'status',doc.status,'idempotent',true); end if;
  raise;
end; $$;

grant execute on function public.build_fiscal_document_from_sales(uuid,uuid) to authenticated;

