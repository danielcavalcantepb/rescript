-- Source linkage for operational fiscal document integration.

alter table public.fiscal_document add column if not exists source_type text;
alter table public.fiscal_document add column if not exists source_id uuid;
alter table public.fiscal_document add constraint fiscal_document_source_type_check check (source_type is null or source_type in('SALES_ORDER','GOODS_RECEIVING','PURCHASE_RETURN','INVENTORY_TRANSFER'));
create unique index if not exists fiscal_document_active_source_uidx on public.fiscal_document(organization_id,source_type,source_id) where source_type is not null and source_id is not null and status in('draft','ready');
alter table public.fiscal_document_search add column if not exists source_type text;
alter table public.fiscal_document_search add column if not exists source_id uuid;
create index if not exists fiscal_document_search_source_idx on public.fiscal_document_search(organization_id,source_type,source_id);

create or replace function public.find_active_fiscal_document(p_org uuid,p_source_type text,p_source_id uuid) returns public.fiscal_document language sql security definer stable set search_path=public as $$
  select * from public.fiscal_document where organization_id=p_org and source_type=p_source_type and source_id=p_source_id and status in('draft','ready') limit 1;
$$;
grant execute on function public.find_active_fiscal_document(uuid,text,uuid) to authenticated;
