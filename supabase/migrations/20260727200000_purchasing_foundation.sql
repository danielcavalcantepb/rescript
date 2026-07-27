-- Purchasing Foundation
-- Evolves the existing Purchase aggregate without creating receiving,
-- inventory, ledger, fiscal or financial side effects.

alter table public.purchase_order
  drop constraint if exists purchase_order_status_check;

alter table public.purchase_order
  add constraint purchase_order_status_check
  check (status in (
    'draft', 'sent', 'confirmed', 'approved', 'cancelled', 'closed', 'archived'
  ));

alter table public.purchase_order
  drop constraint if exists purchase_order_previous_status_check;

alter table public.purchase_order
  add constraint purchase_order_previous_status_check
  check (
    previous_status is null
    or previous_status in (
      'draft', 'sent', 'confirmed', 'approved', 'cancelled', 'closed'
    )
  );

alter table public.purchase_item
  add constraint purchase_item_price_list_fk
  foreign key (price_list_id) references public.price_list (id) on delete restrict
  not valid;

alter table public.purchase_item validate constraint purchase_item_price_list_fk;

create or replace function public.purchasing_has_permission(
  p_organization_id uuid,
  p_permission text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membership m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and (
        m.role in ('owner', 'admin')
        or (
          m.role = 'manager'
          and p_permission in (
            'purchasing.orders.read', 'purchasing.orders.create',
            'purchasing.orders.update', 'purchasing.orders.cancel',
            'purchasing.orders.close'
          )
        )
        or (
          m.role = 'seller'
          and p_permission in (
            'purchasing.orders.read', 'purchasing.orders.create',
            'purchasing.orders.update', 'purchasing.orders.cancel'
          )
        )
        or (
          m.role in ('inventory', 'finance', 'viewer')
          and p_permission = 'purchasing.orders.read'
        )
      )
  );
$$;

drop policy if exists purchase_order_select_member on public.purchase_order;
drop policy if exists purchase_order_insert_member on public.purchase_order;
drop policy if exists purchase_order_update_member on public.purchase_order;
drop policy if exists purchase_item_select_member on public.purchase_item;
drop policy if exists purchase_item_insert_member on public.purchase_item;
drop policy if exists purchase_item_update_member on public.purchase_item;
drop policy if exists purchase_history_select_member on public.purchase_history;
drop policy if exists purchase_history_insert_member on public.purchase_history;
drop policy if exists purchase_search_select_member on public.purchase_search;

create policy purchase_order_select_permission on public.purchase_order
  for select to authenticated
  using (public.purchasing_has_permission(organization_id, 'purchasing.orders.read'));
create policy purchase_order_insert_permission on public.purchase_order
  for insert to authenticated
  with check (
    public.purchasing_has_permission(organization_id, 'purchasing.orders.create')
    and created_by = auth.uid() and updated_by = auth.uid()
  );
create policy purchase_order_update_permission on public.purchase_order
  for update to authenticated
  using (
    public.purchasing_has_permission(organization_id, 'purchasing.orders.update')
    or public.purchasing_has_permission(organization_id, 'purchasing.orders.cancel')
    or public.purchasing_has_permission(organization_id, 'purchasing.orders.close')
  )
  with check (
    (
      public.purchasing_has_permission(organization_id, 'purchasing.orders.update')
      or public.purchasing_has_permission(organization_id, 'purchasing.orders.cancel')
      or public.purchasing_has_permission(organization_id, 'purchasing.orders.close')
    )
    and updated_by = auth.uid()
  );

create or replace function public.enforce_purchase_order_command()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id <> old.organization_id
     or new.supplier_id <> old.supplier_id
     or new.number <> old.number then
    raise exception 'purchase_immutable_identity' using errcode = '23514';
  end if;

  if new.status <> old.status then
    if not (
      (old.status = 'draft' and new.status in ('sent', 'approved', 'cancelled', 'archived'))
      or (old.status = 'sent' and new.status in ('confirmed', 'cancelled'))
      or (old.status = 'confirmed' and new.status in ('closed', 'cancelled', 'archived'))
      or (old.status = 'approved' and new.status in ('closed', 'cancelled', 'archived'))
      or (old.status in ('cancelled', 'closed') and new.status = 'archived')
      or (old.status = 'archived' and new.status in (
        'draft', 'sent', 'confirmed', 'approved', 'cancelled', 'closed'
      ))
    ) then
      raise exception 'invalid_purchase_transition:%->%', old.status, new.status
        using errcode = '23514';
    end if;

    if new.status = 'cancelled' then
      if not public.purchasing_has_permission(
        old.organization_id, 'purchasing.orders.cancel'
      ) then
        raise exception 'permission_denied' using errcode = '42501';
      end if;
    elsif new.status = 'closed' then
      if not public.purchasing_has_permission(
        old.organization_id, 'purchasing.orders.close'
      ) then
        raise exception 'permission_denied' using errcode = '42501';
      end if;
    elsif not public.purchasing_has_permission(
      old.organization_id, 'purchasing.orders.update'
    ) then
      raise exception 'permission_denied' using errcode = '42501';
    end if;
  elsif not public.purchasing_has_permission(
    old.organization_id, 'purchasing.orders.update'
  ) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists purchase_order_command_guard on public.purchase_order;
create trigger purchase_order_command_guard
  before update on public.purchase_order
  for each row execute function public.enforce_purchase_order_command();

create policy purchase_item_select_permission on public.purchase_item
  for select to authenticated
  using (public.purchasing_has_permission(organization_id, 'purchasing.orders.read'));
create policy purchase_item_insert_permission on public.purchase_item
  for insert to authenticated
  with check (
    public.purchasing_has_permission(organization_id, 'purchasing.orders.update')
    and created_by = auth.uid() and updated_by = auth.uid()
  );
create policy purchase_item_update_permission on public.purchase_item
  for update to authenticated
  using (public.purchasing_has_permission(organization_id, 'purchasing.orders.update'))
  with check (
    public.purchasing_has_permission(organization_id, 'purchasing.orders.update')
    and updated_by = auth.uid()
  );

create policy purchase_history_select_permission on public.purchase_history
  for select to authenticated
  using (public.purchasing_has_permission(organization_id, 'purchasing.orders.read'));
create policy purchase_history_insert_permission on public.purchase_history
  for insert to authenticated
  with check (
    public.purchasing_has_permission(organization_id, 'purchasing.orders.update')
    and actor_user_id = auth.uid()
  );
create policy purchase_search_select_permission on public.purchase_search
  for select to authenticated
  using (public.purchasing_has_permission(organization_id, 'purchasing.orders.read'));

create or replace function public.refresh_purchase_search(p_purchase_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  po public.purchase_order%rowtype;
  item_terms text;
begin
  select * into po from public.purchase_order where id = p_purchase_order_id;
  if not found then
    delete from public.purchase_search where purchase_order_id = p_purchase_order_id;
    return;
  end if;

  select string_agg(
    concat_ws(' ', coalesce(variant_name, ''), coalesce(variant_sku, ''),
      coalesce(description, '')), ' '
  )
  into item_terms
  from public.purchase_item
  where purchase_order_id = po.id and status = 'active';

  insert into public.purchase_search (
    purchase_order_id, organization_id, number, supplier_legal_name,
    supplier_document, status, currency, grand_total, created_at,
    search_text, updated_at
  ) values (
    po.id, po.organization_id, po.number, po.supplier_legal_name,
    po.supplier_document, po.status, po.currency, po.grand_total, po.created_at,
    lower(concat_ws(' ', po.number, po.supplier_legal_name,
      coalesce(po.supplier_document, ''), coalesce(po.supplier_email, ''),
      coalesce(po.notes, ''), coalesce(item_terms, ''))),
    now()
  )
  on conflict (purchase_order_id) do update set
    organization_id = excluded.organization_id,
    number = excluded.number,
    supplier_legal_name = excluded.supplier_legal_name,
    supplier_document = excluded.supplier_document,
    status = excluded.status,
    currency = excluded.currency,
    grand_total = excluded.grand_total,
    created_at = excluded.created_at,
    search_text = excluded.search_text,
    updated_at = now();
end;
$$;

create or replace function public.trg_refresh_purchase_search_from_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_purchase_search(
    coalesce(new.purchase_order_id, old.purchase_order_id)
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists purchase_item_search_refresh on public.purchase_item;
create trigger purchase_item_search_refresh
  after insert or update or delete on public.purchase_item
  for each row execute function public.trg_refresh_purchase_search_from_item();

create index if not exists purchase_item_org_price_list_idx
  on public.purchase_item (organization_id, price_list_id);

grant execute on function public.purchasing_has_permission(uuid, text)
  to authenticated;
