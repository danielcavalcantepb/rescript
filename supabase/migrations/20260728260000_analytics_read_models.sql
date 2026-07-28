-- Analytics Domain: read-only projections over confirmed operational facts.
-- Views are intentionally live: this preserves fact freshness and avoids a
-- refresh job until measured load justifies a materialized projection.

create or replace view public.analytics_sales_order_fact with (security_invoker=true) as
select
  o.organization_id,
  o.organization_id as company_id,
  o.branch_id,
  o.id as sales_order_id,
  o.number,
  o.customer_id,
  o.customer_name,
  o.created_by as seller_user_id,
  o.payment_term_id,
  o.created_at as confirmed_at,
  o.grand_total as revenue,
  o.currency
from public.sales_order o
where o.status='confirmed';

create or replace view public.analytics_sales_item_fact with (security_invoker=true) as
select
  o.organization_id,
  o.organization_id as company_id,
  o.branch_id,
  o.id as sales_order_id,
  o.created_at as confirmed_at,
  i.product_id,
  i.variant_id,
  i.product_name,
  i.variant_description,
  i.sku,
  p.primary_category_id as category_id,
  c.name as category_name,
  p.brand_id,
  b.name as brand_name,
  i.quantity,
  i.total as revenue
from public.sales_order o
join public.sales_order_item i on i.sales_order_id=o.id and i.organization_id=o.organization_id
left join public.product p on p.id=i.product_id and p.organization_id=o.organization_id
left join public.category c on c.id=p.primary_category_id and c.organization_id=o.organization_id
left join public.brand b on b.id=p.brand_id and b.organization_id=o.organization_id
where o.status='confirmed';

create or replace view public.analytics_cash_ledger_fact with (security_invoker=true) as
select
  e.organization_id,
  e.company_id,
  e.branch_id,
  e.account_id as cash_account_id,
  e.id as cash_ledger_entry_id,
  e.entry_type,
  e.origin,
  e.amount,
  e.occurred_at,
  e.payment_id,
  e.transfer_id,
  e.reversal_of_entry_id
from public.cash_entry e
where e.status='posted';

create or replace view public.analytics_receivable_open_fact with (security_invoker=true) as
select r.organization_id,r.company_id,r.branch_id,r.id as receivable_id,r.customer_id,
  i.id as installment_id,i.due_date,i.open_amount,i.paid_amount,i.original_amount,r.status
from public.accounts_receivable r
join public.receivable_installment i on i.accounts_receivable_id=r.id
where r.status in ('open','partially_paid') and i.open_amount>0;

create or replace view public.analytics_payable_open_fact with (security_invoker=true) as
select p.organization_id,p.company_id,p.branch_id,p.id as payable_id,p.supplier_id,
  i.id as installment_id,i.due_date,i.open_balance as open_amount,i.amount as original_amount,p.status
from public.accounts_payable p
join public.payable_installment i on i.accounts_payable_id=p.id
where p.status in ('approved','partially_paid') and i.open_balance>0;

create or replace view public.analytics_customer_fact with (security_invoker=true) as
select c.organization_id,c.id as customer_id,c.name,c.status,c.created_at
from public.customer c;

create or replace view public.analytics_product_fact with (security_invoker=true) as
select p.organization_id,p.id as product_id,p.name,p.status,p.created_at,
  p.primary_category_id as category_id,p.brand_id
from public.product p;

create or replace view public.analytics_inventory_preparation_fact with (security_invoker=true) as
select i.organization_id,i.id as inventory_item_id,v.product_id,i.variant_id,i.status,
  i.qty_on_hand,i.qty_reserved,(i.qty_on_hand-i.qty_reserved) as qty_available
from public.inventory_item i
join public.product_variant v on v.id=i.variant_id and v.organization_id=i.organization_id;

-- Fiscal calendars have not been specified. The fiscal-year field is therefore
-- intentionally null rather than assuming a calendar convention.
create or replace view public.analytics_calendar_dimension with (security_invoker=true) as
select d::date as calendar_date,
  extract(isodow from d)::int as day_of_week,
  extract(week from d)::int as week_of_year,
  extract(month from d)::int as month_of_year,
  extract(quarter from d)::int as quarter_of_year,
  extract(year from d)::int as calendar_year,
  null::int as fiscal_year
from generate_series(current_date - interval '5 years', current_date + interval '5 years', interval '1 day') d;

create or replace function public.analytics_require_read(p_org uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.membership where organization_id=p_org and user_id=auth.uid() and status='active') then
    raise exception 'not_org_member' using errcode='42501';
  end if;
end $$;

create or replace function public.get_analytics_kpis(
  p_org uuid,p_from date,p_to date,p_branch uuid default null
) returns jsonb language plpgsql security definer set search_path=public stable as $$
declare v_revenue numeric; v_orders bigint; v_quantity numeric; v_customers bigint;
  v_products bigint; v_receivables numeric; v_payables numeric; v_credits numeric; v_debits numeric; v_cash_balance numeric;
begin
  perform public.analytics_require_read(p_org);
  select coalesce(sum(revenue),0),count(*),coalesce(sum(quantity),0)
    into v_revenue,v_orders,v_quantity
  from public.analytics_sales_order_fact o
  left join lateral (select sum(quantity) quantity from public.analytics_sales_item_fact i where i.sales_order_id=o.sales_order_id) item on true
  where o.organization_id=p_org and (p_branch is null or o.branch_id=p_branch) and o.confirmed_at::date between p_from and p_to;
  select count(*) into v_customers from public.analytics_customer_fact where organization_id=p_org;
  select count(*) into v_products from public.analytics_product_fact where organization_id=p_org and status='active';
  select coalesce(sum(open_amount),0) into v_receivables from public.analytics_receivable_open_fact where organization_id=p_org and (p_branch is null or branch_id=p_branch);
  select coalesce(sum(open_amount),0) into v_payables from public.analytics_payable_open_fact where organization_id=p_org and (p_branch is null or branch_id=p_branch);
  select coalesce(sum(case when entry_type='CREDIT' and origin<>'TRANSFER' then amount else 0 end),0),
    coalesce(sum(case when entry_type='DEBIT' and origin<>'TRANSFER' then amount else 0 end),0)
    into v_credits,v_debits from public.analytics_cash_ledger_fact
    where organization_id=p_org and (p_branch is null or branch_id=p_branch) and occurred_at::date between p_from and p_to;
  select coalesce(sum(case when entry_type='CREDIT' then amount when entry_type='DEBIT' then -amount when entry_type='REVERSAL' then case when exists(select 1 from public.analytics_cash_ledger_fact original_entry where original_entry.cash_ledger_entry_id=ledger.reversal_of_entry_id and original_entry.entry_type='CREDIT') then -amount else amount end else 0 end),0)
    into v_cash_balance from public.analytics_cash_ledger_fact ledger
    where organization_id=p_org and (p_branch is null or branch_id=p_branch) and occurred_at::date<=p_to;
  return jsonb_build_object(
    'revenue',v_revenue,'orders',v_orders,'averageTicket',case when v_orders=0 then null else v_revenue/v_orders end,
    'quantitySold',v_quantity,'customers',v_customers,'activeProducts',v_products,
    'openReceivables',v_receivables,'openPayables',v_payables,'cashInflows',v_credits,'cashOutflows',v_debits,'cashBalance',v_cash_balance,
    'profit',null,'margin',null,'inventoryValue',null
  );
end $$;

create or replace function public.get_analytics_operational_feed(
  p_org uuid,p_branch uuid default null,p_limit integer default 5
) returns jsonb language plpgsql security definer set search_path=public stable as $$
declare v_limit integer := least(greatest(p_limit,1),20);
begin
  perform public.analytics_require_read(p_org);
  return jsonb_build_object(
    'recentSales', coalesce((select jsonb_agg(row_to_json(x) order by x.confirmed_at desc) from (
      select sales_order_id,number,customer_name,revenue,confirmed_at
      from public.analytics_sales_order_fact where organization_id=p_org and (p_branch is null or branch_id=p_branch)
      order by confirmed_at desc limit v_limit
    ) x),'[]'::jsonb),
    'recentCash', coalesce((select jsonb_agg(row_to_json(x) order by x.occurred_at desc) from (
      select cash_ledger_entry_id,entry_type,origin,amount,occurred_at
      from public.analytics_cash_ledger_fact where organization_id=p_org and (p_branch is null or branch_id=p_branch)
      order by occurred_at desc limit v_limit
    ) x),'[]'::jsonb),
    'overdueReceivables', coalesce((select jsonb_agg(row_to_json(x) order by x.due_date asc) from (
      select receivable_id,customer_id,due_date,open_amount
      from public.analytics_receivable_open_fact where organization_id=p_org and (p_branch is null or branch_id=p_branch) and due_date<current_date
      order by due_date asc limit v_limit
    ) x),'[]'::jsonb)
  );
end $$;

create or replace function public.get_analytics_ranking(
  p_org uuid,p_dimension text,p_from date,p_to date,p_branch uuid default null,p_limit integer default 10
) returns jsonb language plpgsql security definer set search_path=public stable as $$
begin
  perform public.analytics_require_read(p_org);
  if lower(p_dimension)='product' then
    return coalesce((select jsonb_agg(row_to_json(x) order by x.revenue desc) from (
      select product_id,product_name,sku,sum(quantity) quantity,sum(revenue) revenue
      from public.analytics_sales_item_fact where organization_id=p_org and (p_branch is null or branch_id=p_branch) and confirmed_at::date between p_from and p_to
      group by product_id,product_name,sku order by sum(revenue) desc limit least(greatest(p_limit,1),100)
    ) x),'[]'::jsonb);
  elsif lower(p_dimension)='customer' then
    return coalesce((select jsonb_agg(row_to_json(x) order by x.revenue desc) from (
      select customer_id,customer_name,count(*) orders,sum(revenue) revenue
      from public.analytics_sales_order_fact where organization_id=p_org and (p_branch is null or branch_id=p_branch) and confirmed_at::date between p_from and p_to
      group by customer_id,customer_name order by sum(revenue) desc limit least(greatest(p_limit,1),100)
    ) x),'[]'::jsonb);
  elsif lower(p_dimension)='brand' then
    return coalesce((select jsonb_agg(row_to_json(x) order by x.revenue desc) from (
      select brand_id,brand_name,sum(quantity) quantity,sum(revenue) revenue
      from public.analytics_sales_item_fact where organization_id=p_org and brand_id is not null and (p_branch is null or branch_id=p_branch) and confirmed_at::date between p_from and p_to
      group by brand_id,brand_name order by sum(revenue) desc limit least(greatest(p_limit,1),100)
    ) x),'[]'::jsonb);
  elsif lower(p_dimension)='category' then
    return coalesce((select jsonb_agg(row_to_json(x) order by x.revenue desc) from (
      select category_id,category_name,sum(quantity) quantity,sum(revenue) revenue
      from public.analytics_sales_item_fact where organization_id=p_org and category_id is not null and (p_branch is null or branch_id=p_branch) and confirmed_at::date between p_from and p_to
      group by category_id,category_name order by sum(revenue) desc limit least(greatest(p_limit,1),100)
    ) x),'[]'::jsonb);
  elsif lower(p_dimension) in ('seller','payment_term') then
    -- A user is not a Seller aggregate and no canonical Sales seller exists yet.
    return '[]'::jsonb;
  end if;
  raise exception 'analytics_dimension_not_supported' using errcode='22023';
end $$;

create or replace function public.get_analytics_time_series(
  p_org uuid,p_from date,p_to date,p_branch uuid default null,p_grain text default 'day'
) returns jsonb language plpgsql security definer set search_path=public stable as $$
begin
  perform public.analytics_require_read(p_org);
  if lower(p_grain) not in ('day','week','month','quarter','year') then raise exception 'analytics_invalid_grain' using errcode='22023'; end if;
  return coalesce((select jsonb_agg(row_to_json(x) order by x.period) from (
    select date_trunc(lower(p_grain),confirmed_at)::date as period,sum(revenue) revenue,count(*) orders
    from public.analytics_sales_order_fact where organization_id=p_org and (p_branch is null or branch_id=p_branch) and confirmed_at::date between p_from and p_to
    group by date_trunc(lower(p_grain),confirmed_at)::date
  ) x),'[]'::jsonb);
end $$;

create index if not exists sales_order_analytics_confirmed_idx on public.sales_order(organization_id,branch_id,created_at desc) where status='confirmed';
create index if not exists sales_order_item_analytics_order_idx on public.sales_order_item(organization_id,sales_order_id,product_id);
create index if not exists cash_entry_analytics_idx on public.cash_entry(organization_id,branch_id,occurred_at desc) where status='posted';

grant select on public.analytics_sales_order_fact,public.analytics_sales_item_fact,public.analytics_cash_ledger_fact,public.analytics_receivable_open_fact,public.analytics_payable_open_fact,public.analytics_customer_fact,public.analytics_product_fact,public.analytics_inventory_preparation_fact,public.analytics_calendar_dimension to authenticated;
grant execute on function public.get_analytics_kpis(uuid,date,date,uuid),public.get_analytics_ranking(uuid,text,date,date,uuid,integer),public.get_analytics_time_series(uuid,date,date,uuid,text),public.get_analytics_operational_feed(uuid,uuid,integer) to authenticated;
