-- Executive dashboard MVP: read-only aggregates over operational projections.
create or replace function public.get_executive_dashboard(p_organization_id uuid, p_period text default '30d')
returns jsonb language plpgsql security definer set search_path=public as $$
declare start_date date; today date:=timezone('utc',now())::date; result jsonb;
begin
  if not exists(select 1 from public.membership where organization_id=p_organization_id and user_id=auth.uid() and status='active') then raise exception 'not_org_member' using errcode='42501'; end if;
  start_date:=case p_period when 'today' then today when '7d' then today-6 when '12m' then (date_trunc('month',today::timestamp)-interval '11 months')::date else today-29 end;
  select jsonb_build_object(
    'period',p_period,
    'cards',jsonb_build_object(
      'revenueToday',coalesce((select sum(grand_total) from sales_order where organization_id=p_organization_id and status='confirmed' and created_at::date=today),0),
      'revenueMonth',coalesce((select sum(grand_total) from sales_order where organization_id=p_organization_id and status='confirmed' and created_at>=date_trunc('month',now())),0),
      'salesMonth',coalesce((select count(*) from sales_order where organization_id=p_organization_id and status='confirmed' and created_at>=date_trunc('month',now())),0),
      'averageTicket',coalesce((select avg(grand_total) from sales_order where organization_id=p_organization_id and status='confirmed' and created_at>=date_trunc('month',now())),0),
      'customers',coalesce((select count(*) from customer where organization_id=p_organization_id),0),
      'products',coalesce((select count(*) from product where organization_id=p_organization_id),0),
      'receivables',coalesce((select sum(open_amount) from accounts_receivable where organization_id=p_organization_id and status in('open','partially_paid')),0),
      'payables',coalesce((select sum(open_balance) from accounts_payable where organization_id=p_organization_id and status in('draft','approved')),0)
    ),
    'revenue',coalesce((select jsonb_agg(jsonb_build_object('date',d::date,'value',value) order by d) from (select created_at::date d,sum(grand_total) value from sales_order where organization_id=p_organization_id and status='confirmed' and created_at::date>=start_date group by created_at::date) x),'[]'::jsonb),
    'topProducts',coalesce((select jsonb_agg(jsonb_build_object('product',product_name,'quantity',quantity,'value',value) order by value desc) from (select product_name,sum(quantity) quantity,sum(total) value from sales_order_item i join sales_order o on o.id=i.sales_order_id and o.organization_id=i.organization_id where i.organization_id=p_organization_id and o.status='confirmed' and o.created_at::date>=start_date group by product_name limit 10) x),'[]'::jsonb),
    'finance',jsonb_build_object('receivableToday',coalesce((select sum(open_amount) from accounts_receivable where organization_id=p_organization_id and due_date=today and status in('open','partially_paid')),0),'receivable30d',coalesce((select sum(open_amount) from accounts_receivable where organization_id=p_organization_id and due_date between today and today+30 and status in('open','partially_paid')),0),'payableToday',coalesce((select sum(open_balance) from accounts_payable where organization_id=p_organization_id and issue_date=today and status in('draft','approved')),0),'payable30d',coalesce((select sum(open_balance) from accounts_payable where organization_id=p_organization_id and issue_date between today and today+30 and status in('draft','approved')),0)),
    'stock',jsonb_build_object('quantity',coalesce((select sum(quantity) from inventory_balance where organization_id=p_organization_id),0),'value',null,'lowStock',null,'withoutMovement',null)
  ) into result;
  return result;
end; $$;
grant execute on function public.get_executive_dashboard(uuid,text) to authenticated;
