-- Sprint 028 — Goods Receipt (Receiving) + Purchase received qty + atomic post
-- Only Receiving creates purchase-sourced ENTRY movements on the Inventory Ledger.

-- ---------------------------------------------------------------------------
-- Purchase line receiving progress (NEW columns only — never edit old migrations)
-- ---------------------------------------------------------------------------
alter table public.purchase_item
  add column if not exists received_quantity numeric(18, 4) not null default 0
    check (received_quantity >= 0);

-- Over-receive is enforced in post_goods_receipt when p_allow_over_receive = false.
-- pending_quantity is derived in the application layer (max(0, quantity - received)).

comment on column public.purchase_item.received_quantity is
  'Cumulative posted receipt qty. pending = max(0, quantity - received_quantity).';

-- ---------------------------------------------------------------------------
-- Receipt number allocator
-- ---------------------------------------------------------------------------
create table public.goods_receipt_number_counter (
  organization_id uuid primary key references public.organization (id) on delete restrict,
  last_value bigint not null default 0 check (last_value >= 0)
);

alter table public.goods_receipt_number_counter enable row level security;

create policy goods_receipt_number_counter_select_member
  on public.goods_receipt_number_counter for select to authenticated
  using (public.is_org_member(organization_id));

grant select on public.goods_receipt_number_counter to authenticated;

create or replace function public.allocate_goods_receipt_number(p_organization_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_val bigint;
begin
  if auth.uid() is null or not public.is_org_member(p_organization_id) then
    raise exception 'not_org_member' using errcode = '42501';
  end if;

  insert into public.goods_receipt_number_counter (organization_id, last_value)
  values (p_organization_id, 1)
  on conflict (organization_id) do update
    set last_value = public.goods_receipt_number_counter.last_value + 1
  returning last_value into next_val;

  return 'GR-' || lpad(next_val::text, 6, '0');
end;
$$;

grant execute on function public.allocate_goods_receipt_number(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Goods receipt header
-- ---------------------------------------------------------------------------
create table public.goods_receipt (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  number text not null,
  purchase_order_id uuid not null references public.purchase_order (id) on delete restrict,
  purchase_number text not null,
  supplier_id uuid not null references public.supplier (id) on delete restrict,
  supplier_legal_name text not null,
  supplier_document text,
  status text not null default 'draft'
    check (status in ('draft', 'posted', 'cancelled', 'archived')),
  previous_status text
    check (
      previous_status is null
      or previous_status in ('draft', 'posted', 'cancelled')
    ),
  location_id uuid references public.stock_location (id) on delete restrict,
  notes text check (notes is null or char_length(notes) <= 4000),
  received_at timestamptz,
  post_idempotency_key text,
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint goods_receipt_org_number_uidx unique (organization_id, number),
  constraint goods_receipt_archive_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null and archived_by is null)
  ),
  constraint goods_receipt_posted_chk check (
    (status = 'posted' and received_at is not null and location_id is not null)
    or (status <> 'posted')
  )
);

create unique index goods_receipt_org_post_idem_uidx
  on public.goods_receipt (organization_id, post_idempotency_key)
  where post_idempotency_key is not null;

create index goods_receipt_org_status_idx
  on public.goods_receipt (organization_id, status);

create index goods_receipt_org_purchase_idx
  on public.goods_receipt (organization_id, purchase_order_id);

create index goods_receipt_org_created_idx
  on public.goods_receipt (organization_id, created_at desc);

create trigger goods_receipt_set_updated_at
  before update on public.goods_receipt
  for each row execute function public.set_updated_at();

comment on table public.goods_receipt is
  'Receiving aggregate. Post creates Inventory Ledger ENTRY only; Purchase never moves stock.';

-- ---------------------------------------------------------------------------
-- Receipt items
-- ---------------------------------------------------------------------------
create table public.goods_receipt_item (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  goods_receipt_id uuid not null references public.goods_receipt (id) on delete restrict,
  purchase_item_id uuid not null references public.purchase_item (id) on delete restrict,
  variant_id uuid not null references public.product_variant (id) on delete restrict,
  location_id uuid references public.stock_location (id) on delete restrict,
  variant_sku text,
  variant_name text not null,
  unit_code text not null,
  ordered_quantity numeric(18, 4) not null check (ordered_quantity > 0),
  received_quantity numeric(18, 4) not null default 0 check (received_quantity >= 0),
  divergence text
    check (
      divergence is null
      or divergence in ('short', 'over', 'damaged', 'none')
    ),
  notes text check (notes is null or char_length(notes) <= 2000),
  sort_order integer not null default 0,
  ledger_movement_id uuid references public.inventory_ledger_movement (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint goods_receipt_item_unique_line
    unique (goods_receipt_id, purchase_item_id)
);

create index goods_receipt_item_org_receipt_idx
  on public.goods_receipt_item (organization_id, goods_receipt_id);

create trigger goods_receipt_item_set_updated_at
  before update on public.goods_receipt_item
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- History (append-only)
-- ---------------------------------------------------------------------------
create table public.goods_receipt_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  goods_receipt_id uuid not null references public.goods_receipt (id) on delete restrict,
  action text not null,
  field_name text,
  old_value text,
  new_value text,
  reason text,
  actor_user_id uuid not null references auth.users (id),
  actor_ip text,
  created_at timestamptz not null default now()
);

create index goods_receipt_history_org_receipt_created_idx
  on public.goods_receipt_history (organization_id, goods_receipt_id, created_at desc);

create or replace function public.deny_goods_receipt_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('receiving.allow_history_admin', true) = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'goods_receipt_history_immutable' using errcode = '42501';
end;
$$;

create trigger goods_receipt_history_no_update
  before update on public.goods_receipt_history
  for each row execute function public.deny_goods_receipt_history_mutation();

create trigger goods_receipt_history_no_delete
  before delete on public.goods_receipt_history
  for each row execute function public.deny_goods_receipt_history_mutation();

-- ---------------------------------------------------------------------------
-- Search projection
-- ---------------------------------------------------------------------------
create table public.goods_receipt_search (
  goods_receipt_id uuid primary key
    references public.goods_receipt (id) on delete cascade,
  organization_id uuid not null references public.organization (id) on delete restrict,
  number text not null,
  purchase_number text not null,
  supplier_legal_name text not null,
  supplier_document text,
  status text not null,
  received_at timestamptz,
  created_at timestamptz not null,
  search_text text not null default '',
  updated_at timestamptz not null default now()
);

create index goods_receipt_search_org_status_idx
  on public.goods_receipt_search (organization_id, status);

create index goods_receipt_search_org_number_idx
  on public.goods_receipt_search (organization_id, number);

create index goods_receipt_search_org_created_idx
  on public.goods_receipt_search (organization_id, created_at desc);

create index goods_receipt_search_org_search_text_idx
  on public.goods_receipt_search using gin (to_tsvector('simple', search_text));

create or replace function public.refresh_goods_receipt_search(p_goods_receipt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gr public.goods_receipt%rowtype;
begin
  select * into gr from public.goods_receipt where id = p_goods_receipt_id;
  if not found then
    delete from public.goods_receipt_search where goods_receipt_id = p_goods_receipt_id;
    return;
  end if;

  insert into public.goods_receipt_search (
    goods_receipt_id,
    organization_id,
    number,
    purchase_number,
    supplier_legal_name,
    supplier_document,
    status,
    received_at,
    created_at,
    search_text,
    updated_at
  )
  values (
    gr.id,
    gr.organization_id,
    gr.number,
    gr.purchase_number,
    gr.supplier_legal_name,
    gr.supplier_document,
    gr.status,
    gr.received_at,
    gr.created_at,
    lower(concat_ws(
      ' ',
      gr.number,
      gr.purchase_number,
      gr.supplier_legal_name,
      coalesce(gr.supplier_document, ''),
      coalesce(gr.notes, '')
    )),
    now()
  )
  on conflict (goods_receipt_id) do update set
    organization_id = excluded.organization_id,
    number = excluded.number,
    purchase_number = excluded.purchase_number,
    supplier_legal_name = excluded.supplier_legal_name,
    supplier_document = excluded.supplier_document,
    status = excluded.status,
    received_at = excluded.received_at,
    created_at = excluded.created_at,
    search_text = excluded.search_text,
    updated_at = now();
end;
$$;

create or replace function public.trg_refresh_goods_receipt_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_goods_receipt_search(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create trigger goods_receipt_search_refresh
  after insert or update on public.goods_receipt
  for each row execute function public.trg_refresh_goods_receipt_search();

grant execute on function public.refresh_goods_receipt_search(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic post: ledger ENTRY + purchase progress + optional PO close
-- ---------------------------------------------------------------------------
create or replace function public.post_goods_receipt(
  p_organization_id uuid,
  p_goods_receipt_id uuid,
  p_idempotency_key text,
  p_allow_over_receive boolean default false
)
returns public.goods_receipt
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_receipt public.goods_receipt;
  v_existing public.goods_receipt;
  v_po public.purchase_order;
  v_item public.goods_receipt_item;
  v_pi public.purchase_item;
  v_location_id uuid;
  v_movement public.inventory_ledger_movement;
  v_pending numeric;
  v_all_complete boolean := true;
  v_idem text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  v_line_idem text;
  v_divergence text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not public.is_org_member(p_organization_id) then
    raise exception 'not_org_member' using errcode = '42501';
  end if;
  if v_idem is null or char_length(v_idem) > 128 then
    raise exception 'invalid_idempotency_key' using errcode = '22023';
  end if;

  -- Receipt-level idempotency
  select * into v_existing
  from public.goods_receipt
  where organization_id = p_organization_id
    and post_idempotency_key = v_idem;
  if found then
    return v_existing;
  end if;

  select * into v_receipt
  from public.goods_receipt
  where id = p_goods_receipt_id
    and organization_id = p_organization_id
  for update;
  if not found then
    raise exception 'goods_receipt_not_found' using errcode = 'P0002';
  end if;
  if v_receipt.status = 'posted' then
    return v_receipt;
  end if;
  if v_receipt.status <> 'draft' then
    raise exception 'goods_receipt_not_draft' using errcode = '22023';
  end if;
  if v_receipt.location_id is null then
    raise exception 'location_required' using errcode = '22023';
  end if;
  v_location_id := v_receipt.location_id;

  select * into v_po
  from public.purchase_order
  where id = v_receipt.purchase_order_id
    and organization_id = p_organization_id
  for update;
  if not found then
    raise exception 'purchase_not_found' using errcode = 'P0002';
  end if;
  if v_po.status <> 'approved' then
    raise exception 'purchase_not_receivable' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.goods_receipt_item
    where goods_receipt_id = v_receipt.id
      and organization_id = p_organization_id
      and received_quantity > 0
  ) then
    raise exception 'no_items_to_receive' using errcode = '22023';
  end if;

  for v_item in
    select *
    from public.goods_receipt_item
    where goods_receipt_id = v_receipt.id
      and organization_id = p_organization_id
    order by sort_order, created_at
    for update
  loop
    if v_item.received_quantity <= 0 then
      continue;
    end if;

    select * into v_pi
    from public.purchase_item
    where id = v_item.purchase_item_id
      and organization_id = p_organization_id
      and purchase_order_id = v_po.id
    for update;
    if not found or v_pi.status <> 'active' then
      raise exception 'purchase_item_not_found' using errcode = 'P0002';
    end if;

    v_pending := v_pi.quantity - v_pi.received_quantity;
    if v_item.received_quantity > v_pending and not p_allow_over_receive then
      raise exception 'receive_exceeds_pending' using errcode = '22023';
    end if;
    if not p_allow_over_receive and v_pi.received_quantity + v_item.received_quantity > v_pi.quantity then
      raise exception 'receive_exceeds_ordered' using errcode = '22023';
    end if;

    if v_item.received_quantity < v_pending and v_item.divergence is null then
      v_divergence := 'short';
    elsif v_item.received_quantity > v_pending then
      v_divergence := 'over';
    else
      v_divergence := coalesce(v_item.divergence, 'none');
    end if;

    v_line_idem := 'gr:' || v_receipt.id::text || ':item:' || v_item.id::text;

    v_movement := public.register_inventory_ledger_movement(
      p_organization_id,
      v_item.variant_id,
      coalesce(v_item.location_id, v_location_id),
      'entry',
      v_item.received_quantity,
      'Recebimento ' || v_receipt.number,
      coalesce(v_item.notes, v_receipt.notes),
      now(),
      'goods_receipt',
      v_receipt.id,
      v_receipt.id,
      v_line_idem,
      null,
      null
    );

    update public.goods_receipt_item
    set
      ledger_movement_id = v_movement.id,
      location_id = coalesce(v_item.location_id, v_location_id),
      divergence = v_divergence,
      updated_by = v_uid
    where id = v_item.id;

    update public.purchase_item
    set
      received_quantity = received_quantity + v_item.received_quantity,
      updated_by = v_uid
    where id = v_pi.id;
  end loop;

  -- Close PO when every active line is fully received
  select not exists (
    select 1
    from public.purchase_item
    where purchase_order_id = v_po.id
      and organization_id = p_organization_id
      and status = 'active'
      and received_quantity < quantity
  ) into v_all_complete;

  if v_all_complete then
    update public.purchase_order
    set
      status = 'closed',
      previous_status = null,
      updated_by = v_uid
    where id = v_po.id;

    insert into public.purchase_history (
      organization_id,
      purchase_order_id,
      action,
      field_name,
      old_value,
      new_value,
      reason,
      actor_user_id
    ) values (
      p_organization_id,
      v_po.id,
      'purchase.completed',
      'status',
      v_po.status,
      'closed',
      'Recebimento total ' || v_receipt.number,
      v_uid
    );
  else
    insert into public.purchase_history (
      organization_id,
      purchase_order_id,
      action,
      field_name,
      old_value,
      new_value,
      reason,
      actor_user_id
    ) values (
      p_organization_id,
      v_po.id,
      'purchase.partial_receiving',
      'receiving',
      null,
      v_receipt.number,
      'Recebimento parcial ' || v_receipt.number,
      v_uid
    );
  end if;

  update public.goods_receipt
  set
    status = 'posted',
    received_at = now(),
    post_idempotency_key = v_idem,
    updated_by = v_uid
  where id = v_receipt.id
  returning * into v_receipt;

  insert into public.goods_receipt_history (
    organization_id,
    goods_receipt_id,
    action,
    field_name,
    old_value,
    new_value,
    reason,
    actor_user_id
  ) values (
    p_organization_id,
    v_receipt.id,
    'goods_receipt.posted',
    'status',
    'draft',
    'posted',
    case when v_all_complete then 'complete' else 'partial' end,
    v_uid
  );

  return v_receipt;
end;
$$;

revoke all on function public.post_goods_receipt(uuid, uuid, text, boolean) from public;
grant execute on function public.post_goods_receipt(uuid, uuid, text, boolean) to authenticated;

comment on function public.post_goods_receipt is
  'Atomic receiving post: Ledger ENTRY per line, PO received qty, optional PO close. Idempotent.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.goods_receipt enable row level security;
alter table public.goods_receipt_item enable row level security;
alter table public.goods_receipt_history enable row level security;
alter table public.goods_receipt_search enable row level security;

create policy goods_receipt_select_member
  on public.goods_receipt for select to authenticated
  using (public.is_org_member(organization_id));

create policy goods_receipt_insert_member
  on public.goods_receipt for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy goods_receipt_update_member
  on public.goods_receipt for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy goods_receipt_item_select_member
  on public.goods_receipt_item for select to authenticated
  using (public.is_org_member(organization_id));

create policy goods_receipt_item_insert_member
  on public.goods_receipt_item for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

create policy goods_receipt_item_update_member
  on public.goods_receipt_item for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

create policy goods_receipt_history_select_member
  on public.goods_receipt_history for select to authenticated
  using (public.is_org_member(organization_id));

create policy goods_receipt_history_insert_member
  on public.goods_receipt_history for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and actor_user_id = auth.uid()
  );

create policy goods_receipt_search_select_member
  on public.goods_receipt_search for select to authenticated
  using (public.is_org_member(organization_id));

grant select, insert, update on public.goods_receipt to authenticated;
grant select, insert, update on public.goods_receipt_item to authenticated;
grant select, insert on public.goods_receipt_history to authenticated;
grant select on public.goods_receipt_search to authenticated;
