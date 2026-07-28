-- Sales Domain execution: binds Sales Orders to the frozen Branch, PaymentTerm
-- and InventoryPolicy contracts. This migration is additive and leaves the legacy
-- products/inventory authority unchanged.

alter table public.sales_order
  add column if not exists branch_id uuid references public.branch(id) on delete restrict,
  add column if not exists payment_term_id uuid references public.payment_term(id) on delete restrict,
  add column if not exists payment_term_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references auth.users(id),
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id),
  add column if not exists cancellation_reason text;

create index if not exists sales_order_org_branch_status_idx
  on public.sales_order(organization_id, branch_id, status, created_at desc);
create index if not exists sales_order_org_payment_term_idx
  on public.sales_order(organization_id, payment_term_id);

-- New orders always have a branch. Existing historical orders remain readable;
-- their legacy data is intentionally not inferred or rewritten.
create or replace function public.sales_resolve_branch(p_org uuid, p_branch uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_branch uuid;
begin
  v_branch := coalesce(p_branch, public.ensure_default_branch(p_org, auth.uid()));
  if v_branch is null or not exists (
    select 1 from public.branch
    where id = v_branch and organization_id = p_org and status = 'active'
  ) then
    raise exception 'sales_branch_not_found' using errcode = 'P0002';
  end if;
  return v_branch;
end $$;

create or replace function public.sales_validate_payment_term(p_org uuid, p_term uuid)
returns jsonb language plpgsql security definer set search_path = public stable as $$
declare v_term public.payment_term%rowtype;
begin
  if p_term is null then
    return '{}'::jsonb;
  end if;
  select * into v_term from public.payment_term
  where id = p_term and organization_id = p_org and status = 'active';
  if not found then
    raise exception 'sales_payment_term_not_found' using errcode = 'P0002';
  end if;
  return jsonb_build_object('id', v_term.id, 'code', v_term.code, 'name', v_term.name, 'kind', v_term.kind);
end $$;

create or replace function public.create_sales_order_with_context(
  p_org uuid,
  p_customer uuid,
  p_currency text,
  p_notes text,
  p_items jsonb,
  p_branch uuid default null,
  p_payment_term uuid default null,
  p_quotation uuid default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_branch uuid; v_term_snapshot jsonb;
begin
  v_branch := public.sales_resolve_branch(p_org, p_branch);
  v_term_snapshot := public.sales_validate_payment_term(p_org, p_payment_term);
  v_id := public.create_sales_order(p_org, p_customer, p_currency, p_notes, p_items, p_quotation);
  update public.sales_order
  set branch_id = v_branch,
      payment_term_id = p_payment_term,
      payment_term_snapshot = v_term_snapshot,
      updated_by = auth.uid()
  where id = v_id and organization_id = p_org;
  return v_id;
end $$;

create or replace function public.update_sales_order_with_context(
  p_org uuid,
  p_id uuid,
  p_currency text,
  p_notes text,
  p_items jsonb,
  p_branch uuid default null,
  p_payment_term uuid default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_branch uuid; v_term_snapshot jsonb;
begin
  v_branch := public.sales_resolve_branch(p_org, p_branch);
  v_term_snapshot := public.sales_validate_payment_term(p_org, p_payment_term);
  v_id := public.update_sales_order(p_org, p_id, p_currency, p_notes, p_items);
  update public.sales_order
  set branch_id = v_branch,
      payment_term_id = p_payment_term,
      payment_term_snapshot = v_term_snapshot,
      updated_by = auth.uid()
  where id = v_id and organization_id = p_org;
  return v_id;
end $$;

create or replace function public.create_sales_receivable_from_order(p_org uuid, p_sales_order uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_order public.sales_order%rowtype; v_id uuid; v_installments jsonb; v_due date; v_number text;
begin
  select id into v_id from public.accounts_receivable
  where organization_id = p_org and origin_type = 'sales' and origin_id = p_sales_order;
  if found then return v_id; end if;

  select * into v_order from public.sales_order
  where id = p_sales_order and organization_id = p_org for update;
  if not found then raise exception 'sales_order_not_found' using errcode = 'P0002'; end if;
  if v_order.status <> 'confirmed' or v_order.payment_term_id is null then
    raise exception 'sales_order_not_financially_confirmed' using errcode = '22023';
  end if;

  select jsonb_agg(jsonb_build_object('amount', amount, 'dueDate', due_date) order by sequence), max(due_date)
  into v_installments, v_due
  from public.resolve_payment_term(p_org, v_order.payment_term_id, v_order.grand_total, current_date);
  if v_installments is null then raise exception 'payment_term_schedule_not_found' using errcode = '22023'; end if;

  -- This is an internal Sales event, therefore it does not require a separate
  -- Finance UI permission; it still writes only through the official AR aggregate.
  insert into public.accounts_receivable_counter(organization_id,last_value) values(p_org,1)
  on conflict(organization_id) do update set last_value=public.accounts_receivable_counter.last_value+1
  returning 'AR-'||lpad(last_value::text,6,'0') into v_number;

  insert into public.accounts_receivable(
    organization_id, number, customer_id, customer_name, customer_document,
    customer_email, customer_phone, origin_type, origin_id, status, issue_date,
    due_date, currency, total_amount, open_amount, notes, created_by, updated_by
  )
  select p_org, v_number,
         v_order.customer_id, v_order.customer_name, v_order.customer_document,
         v_order.customer_email, v_order.customer_phone, 'sales', v_order.id, 'open',
         current_date, v_due, v_order.currency, v_order.grand_total, v_order.grand_total,
         v_order.notes, auth.uid(), auth.uid()
  returning id into v_id;

  insert into public.receivable_installment(organization_id,accounts_receivable_id,sequence,due_date,original_amount,open_amount,created_by,updated_by)
  select p_org,v_id,ordinality,(x->>'dueDate')::date,(x->>'amount')::numeric,(x->>'amount')::numeric,auth.uid(),auth.uid()
  from jsonb_array_elements(v_installments) with ordinality t(x, ordinality);
  insert into public.accounts_receivable_history(organization_id,accounts_receivable_id,action,new_value,reason,actor_user_id)
  values(p_org,v_id,'ReceivableCreated', (select number from public.accounts_receivable where id=v_id), 'SalesOrderConfirmed',auth.uid()),
        (p_org,v_id,'ReceivableOpened','open','SalesOrderConfirmed',auth.uid());
  perform public.sales_record_audit(p_org,'sales_order',p_sales_order,'SalesReceivableCreated',jsonb_build_object('receivableId',v_id));
  return v_id;
exception when unique_violation then
  select id into v_id from public.accounts_receivable where organization_id=p_org and origin_type='sales' and origin_id=p_sales_order;
  if v_id is null then raise; end if;
  return v_id;
end $$;

create or replace function public.sales_order_stock_is_reservable(p_org uuid, p_sales_order uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select not exists(
    select 1
    from public.sales_order_item soi
    join public.product_variant pv on pv.id=soi.variant_id and pv.organization_id=p_org
    left join public.stock_location sl on sl.organization_id=p_org and sl.is_default=true and sl.status='active'
    left join public.inventory_item ii on ii.organization_id=p_org and ii.location_id=sl.id and ii.variant_id=soi.variant_id and ii.status='active'
    where soi.organization_id=p_org and soi.sales_order_id=p_sales_order and pv.tracks_inventory
      and coalesce(ii.qty_on_hand-ii.qty_reserved,0) < soi.quantity
  )
$$;

create or replace function public.transition_sales_order(
  p_org uuid, p_id uuid, p_to text, p_reason text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_from text; v_order public.sales_order%rowtype; v_reservation_id uuid; v_receivable_id uuid;
        v_policy public.inventory_policy%rowtype; v_has_tracked boolean; v_reservable boolean;
begin
  perform public.sales_require_permission(p_org, case p_to when 'confirmed' then 'sales.confirm' when 'cancelled' then 'sales.cancel' when 'archived' then 'sales.archive' else 'sales.edit' end);
  select * into v_order from public.sales_order where id=p_id and organization_id=p_org for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  v_from := v_order.status;
  if not ((v_from='draft' and p_to in('confirmed','cancelled','archived')) or (v_from='confirmed' and p_to='cancelled') or (v_from='cancelled' and p_to='archived')) then
    raise exception 'invalid_transition' using errcode='22023';
  end if;

  if p_to='confirmed' then
    if v_order.branch_id is null then raise exception 'sales_order_branch_required' using errcode='22023'; end if;
    if v_order.payment_term_id is null then raise exception 'sales_order_payment_term_required' using errcode='22023'; end if;
    if not exists(select 1 from public.branch where id=v_order.branch_id and organization_id=p_org and status='active') then raise exception 'sales_branch_not_found' using errcode='P0002'; end if;
    perform public.sales_validate_payment_term(p_org,v_order.payment_term_id);
    select * into v_policy from public.inventory_policy where organization_id=p_org;
    if not found then raise exception 'inventory_policy_not_found' using errcode='P0002'; end if;
    select exists(select 1 from public.sales_order_item soi join public.product_variant pv on pv.id=soi.variant_id and pv.organization_id=p_org where soi.sales_order_id=p_id and soi.organization_id=p_org and pv.tracks_inventory) into v_has_tracked;
    v_reservable := public.sales_order_stock_is_reservable(p_org,p_id);
    if v_has_tracked and v_policy.automatic_reservation and not v_reservable and not v_policy.allow_confirmation_without_stock then
      raise exception 'insufficient_available_stock' using errcode='22023';
    end if;
    update public.sales_order set status='confirmed',confirmed_at=now(),confirmed_by=auth.uid(),updated_by=auth.uid() where id=p_id;
    v_receivable_id := public.create_sales_receivable_from_order(p_org,p_id);
    if v_has_tracked and v_policy.automatic_reservation and v_reservable then
      v_reservation_id := public.create_inventory_reservation_from_sales_order(p_org,p_id,null);
      delete from public.inventory_reservation_item iri using public.product_variant pv
      where iri.reservation_id=v_reservation_id and iri.organization_id=p_org and pv.id=iri.variant_id and not pv.tracks_inventory;
      update public.inventory_reservation set total_quantity_reserved=coalesce((select sum(quantity_reserved) from public.inventory_reservation_item where reservation_id=v_reservation_id),0),updated_by=auth.uid() where id=v_reservation_id;
      perform public.activate_inventory_reservation(p_org,v_reservation_id);
    end if;
  elsif p_to='cancelled' then
    select id into v_reservation_id from public.inventory_reservation where organization_id=p_org and source_type='sales_order' and source_id=p_id for update;
    if found then perform public.cancel_inventory_reservation(p_org,v_reservation_id,p_reason); end if;
    select id into v_receivable_id from public.accounts_receivable where organization_id=p_org and origin_type='sales' and origin_id=p_id for update;
    if found then
      if exists(select 1 from public.accounts_receivable where id=v_receivable_id and status in('partially_paid','paid')) then raise exception 'sales_order_has_settled_receivable' using errcode='22023'; end if;
      update public.accounts_receivable set status='cancelled',updated_by=auth.uid() where id=v_receivable_id and status in('draft','open');
      update public.receivable_installment set status='cancelled',updated_by=auth.uid() where accounts_receivable_id=v_receivable_id;
      insert into public.accounts_receivable_history(organization_id,accounts_receivable_id,action,reason,actor_user_id) values(p_org,v_receivable_id,'ReceivableCancelled',p_reason,auth.uid());
    end if;
    update public.sales_order set status='cancelled',cancelled_at=now(),cancelled_by=auth.uid(),cancellation_reason=nullif(trim(p_reason),''),updated_by=auth.uid() where id=p_id;
  else
    update public.sales_order set status='archived',archived_at=now(),updated_by=auth.uid() where id=p_id;
  end if;
  insert into public.sales_history(organization_id,aggregate_type,aggregate_id,action,old_value,new_value,reason,actor_user_id)
  values(p_org,'sales_order',p_id,'SalesOrder'||initcap(p_to),v_from,p_to,p_reason,auth.uid());
  perform public.sales_record_audit(p_org,'sales_order',p_id,'SalesOrder'||initcap(p_to),jsonb_build_object('from',v_from,'to',p_to,'reason',p_reason,'reservationId',v_reservation_id,'receivableId',v_receivable_id));
  return p_id;
end $$;

grant execute on function public.create_sales_order_with_context(uuid,uuid,text,text,jsonb,uuid,uuid,uuid), public.update_sales_order_with_context(uuid,uuid,text,text,jsonb,uuid,uuid), public.transition_sales_order(uuid,uuid,text,text) to authenticated;
