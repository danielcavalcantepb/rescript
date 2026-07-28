-- Make the MVP dashboard compatible with production databases that have not yet
-- received the Sales/Receivables migrations. Unsupported indicators remain zero.
create or replace function public.get_executive_dashboard(p_organization_id uuid, p_period text default '30d')
returns jsonb language plpgsql security definer set search_path=public as $$
declare today date:=timezone('utc',now())::date; start_date date; cards jsonb; finance jsonb; stock jsonb; revenue jsonb:='[]'; top_products jsonb:='[]'; n numeric:=0; revenue_month numeric:=0; sales_count numeric:=0; avg_ticket numeric:=0;
begin
  if not exists(select 1 from public.membership where organization_id=p_organization_id and user_id=auth.uid() and status='active') then raise exception 'not_org_member' using errcode='42501'; end if;
  start_date:=case p_period when 'today' then today when '7d' then today-6 when '12m' then (date_trunc('month',now())-interval '11 months')::date else today-29 end;
  if to_regclass('public.sales_order') is not null then
    execute 'select coalesce(sum(grand_total),0) from public.sales_order where organization_id=$1 and status=''confirmed'' and created_at::date=$2' into n using p_organization_id,today;
    execute 'select coalesce(sum(grand_total),0),coalesce(count(*),0),coalesce(avg(grand_total),0) from public.sales_order where organization_id=$1 and status=''confirmed'' and created_at>=date_trunc(''month'',now())' into revenue_month,sales_count,avg_ticket using p_organization_id;
    execute 'select coalesce(jsonb_agg(jsonb_build_object(''date'',d,''value'',value) order by d),''[]''::jsonb) from (select created_at::date d,sum(grand_total) value from public.sales_order where organization_id=$1 and status=''confirmed'' and created_at::date>=$2 group by created_at::date) x' into revenue using p_organization_id,start_date;
  end if;
  cards:=jsonb_build_object('revenueToday',n,'revenueMonth',revenue_month,'salesMonth',sales_count,'averageTicket',avg_ticket,'customers',(select count(*) from customer where organization_id=p_organization_id),'products',(select count(*) from product where organization_id=p_organization_id),'receivables',0,'payables',coalesce((select sum(open_balance) from accounts_payable where organization_id=p_organization_id and status in('draft','approved')),0));
  if to_regclass('public.inventory_balance') is not null then stock:=jsonb_build_object('quantity',coalesce((select sum(quantity) from inventory_balance where organization_id=p_organization_id),0),'value',null,'lowStock',null,'withoutMovement',null); else stock:='{"quantity":0,"value":null,"lowStock":null,"withoutMovement":null}'::jsonb; end if;
  finance:='{"receivableToday":0,"receivable30d":0,"payableToday":0,"payable30d":0}'::jsonb;
  return jsonb_build_object('period',p_period,'cards',cards,'revenue',revenue,'topProducts',top_products,'finance',finance,'stock',stock);
end; $$;
