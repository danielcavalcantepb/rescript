-- Catalog Phase 2 — parallel persistence (ADR-0020…0025 / CatalogImplementationPlan §5 Fase 2)
-- Coexists with legacy public.product (sku/unit/category text untouched).
-- NO data migration. NO dual-write. NO inventory/sales changes.
-- Application MUST NOT use these tables until Phase 3+.

-- ===========================================================================
-- Taxonomy & UOM
-- ===========================================================================

create table public.brand (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  name text not null check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 120
  ),
  normalized_name text not null check (
    char_length(trim(normalized_name)) >= 1
    and char_length(normalized_name) <= 120
  ),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint brand_archive_status_chk check (
    (status = 'archived' and archived_at is not null)
    or (status = 'active' and archived_at is null and archived_by is null)
  )
);

create unique index brand_org_normalized_name_uidx
  on public.brand (organization_id, normalized_name);

create index brand_org_status_idx
  on public.brand (organization_id, status);

create trigger brand_set_updated_at
  before update on public.brand
  for each row execute function public.set_updated_at();

comment on table public.brand is
  'Catalog Brand aggregate (org-scoped). Parallel schema — unused by app in Phase 2.';

-- ---------------------------------------------------------------------------

create table public.category (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  parent_id uuid references public.category (id) on delete restrict,
  name text not null check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 120
  ),
  normalized_name text not null check (
    char_length(trim(normalized_name)) >= 1
    and char_length(normalized_name) <= 120
  ),
  depth integer not null default 0 check (depth >= 0 and depth <= 5),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint category_archive_status_chk check (
    (status = 'archived' and archived_at is not null)
    or (status = 'active' and archived_at is null and archived_by is null)
  ),
  constraint category_root_depth_chk check (
    (parent_id is null and depth = 0)
    or (parent_id is not null and depth > 0)
  )
);

create unique index category_org_root_name_uidx
  on public.category (organization_id, normalized_name)
  where parent_id is null;

create unique index category_org_sibling_name_uidx
  on public.category (organization_id, parent_id, normalized_name)
  where parent_id is not null;

create index category_org_status_idx
  on public.category (organization_id, status);

create index category_parent_idx
  on public.category (parent_id);

create trigger category_set_updated_at
  before update on public.category
  for each row execute function public.set_updated_at();

comment on table public.category is
  'Catalog Category tree (adjacency). Max depth 5. Parallel schema — unused by app in Phase 2.';

-- ---------------------------------------------------------------------------

create table public.unit_of_measure (
  id uuid primary key default gen_random_uuid(),
  -- null organization_id = platform default (readable by all authenticated)
  organization_id uuid references public.organization (id) on delete restrict,
  code text not null check (
    char_length(trim(code)) >= 1
    and char_length(code) <= 32
  ),
  name text not null check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 64
  ),
  precision integer not null default 0 check (precision >= 0 and precision <= 6),
  integer_only boolean not null default true,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  constraint uom_integer_precision_chk check (
    (integer_only = false)
    or (integer_only = true and precision = 0)
  )
);

create unique index uom_platform_code_uidx
  on public.unit_of_measure (code)
  where organization_id is null;

create unique index uom_org_code_uidx
  on public.unit_of_measure (organization_id, code)
  where organization_id is not null;

create trigger unit_of_measure_set_updated_at
  before update on public.unit_of_measure
  for each row execute function public.set_updated_at();

comment on table public.unit_of_measure is
  'Catalog UOM: platform defaults (organization_id null) + org custom. Parallel — unused by app in Phase 2.';

-- Platform defaults (no created_by — seeded by migration)
insert into public.unit_of_measure (code, name, precision, integer_only, organization_id)
values
  ('un', 'Unidade', 0, true, null),
  ('par', 'Par', 0, true, null),
  ('cx', 'Caixa', 0, true, null),
  ('pct', 'Pacote', 0, true, null),
  ('g', 'Grama', 0, true, null),
  ('ml', 'Mililitro', 0, true, null),
  ('kg', 'Quilograma', 3, false, null),
  ('l', 'Litro', 3, false, null),
  ('m', 'Metro', 3, false, null);

-- ---------------------------------------------------------------------------

create table public.attribute_definition (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  name text not null check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 120
  ),
  normalized_name text not null check (
    char_length(trim(normalized_name)) >= 1
    and char_length(normalized_name) <= 120
  ),
  value_type text not null
    check (value_type in ('option', 'text', 'decimal', 'boolean', 'date')),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint attribute_definition_archive_status_chk check (
    (status = 'archived' and archived_at is not null)
    or (status = 'active' and archived_at is null and archived_by is null)
  )
);

create unique index attribute_definition_org_name_uidx
  on public.attribute_definition (organization_id, normalized_name);

create index attribute_definition_org_status_idx
  on public.attribute_definition (organization_id, status);

create trigger attribute_definition_set_updated_at
  before update on public.attribute_definition
  for each row execute function public.set_updated_at();

comment on table public.attribute_definition is
  'Catalog AttributeDefinition (ADR-0022). Parallel schema — unused by app in Phase 2.';

-- ---------------------------------------------------------------------------

create table public.attribute_option (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references public.attribute_definition (id) on delete restrict,
  label text not null check (
    char_length(trim(label)) >= 1
    and char_length(label) <= 120
  ),
  normalized_label text not null check (
    char_length(trim(normalized_label)) >= 1
    and char_length(normalized_label) <= 120
  ),
  sort_order integer not null default 0 check (sort_order >= 0),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint attribute_option_archive_status_chk check (
    (status = 'archived' and archived_at is not null)
    or (status = 'active' and archived_at is null and archived_by is null)
  )
);

create unique index attribute_option_definition_label_uidx
  on public.attribute_option (definition_id, normalized_label);

create index attribute_option_definition_sort_idx
  on public.attribute_option (definition_id, sort_order);

create trigger attribute_option_set_updated_at
  before update on public.attribute_option
  for each row execute function public.set_updated_at();

comment on table public.attribute_option is
  'Options for AttributeDefinition (entity of definition aggregate). Parallel — unused in Phase 2.';

-- ===========================================================================
-- Legacy product — additive nullable columns authorized by
-- CatalogImplementationPlan §5 Fase 2 Decision C + §8.2 + §8.5 only.
-- Does NOT remove sku/unit/category; does NOT change status active/inactive.
-- topology / default_unit_of_measure_id intentionally omitted (not in §8.2/§8.5).
-- ===========================================================================

alter table public.product
  add column brand_id uuid references public.brand (id) on delete set null,
  add column primary_category_id uuid references public.category (id) on delete set null,
  add column lifecycle_status text
    check (
      lifecycle_status is null
      or lifecycle_status in ('draft', 'active', 'archived')
    );

create index product_brand_id_idx
  on public.product (brand_id)
  where brand_id is not null;

create index product_primary_category_id_idx
  on public.product (primary_category_id)
  where primary_category_id is not null;

comment on column public.product.brand_id is
  'Catalog Phase 2 nullable FK (ImplementationPlan §8.2/§8.5). Legacy flows ignore.';
comment on column public.product.primary_category_id is
  'Catalog Phase 2 nullable FK (ImplementationPlan §8.5). Legacy category text remains app source.';
comment on column public.product.lifecycle_status is
  'Transitional Catalog lifecycle draft|active|archived (ImplementationPlan §8.2 status draft). Null = legacy status column only. Does not replace product.status active|inactive.';

-- ===========================================================================
-- Variants (identity vendável — ADR-0020). Empty until Phase 3+.
-- ===========================================================================

create table public.product_variant (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  product_id uuid not null references public.product (id) on delete restrict,
  sku text check (
    sku is null
    or (
      char_length(trim(sku)) >= 1
      and char_length(sku) <= 64
    )
  ),
  unit_of_measure_id uuid references public.unit_of_measure (id) on delete restrict,
  combination_hash text not null,
  is_default boolean not null default false,
  tracks_inventory boolean not null default true,
  min_sale_qty numeric(19, 6) not null default 1 check (min_sale_qty > 0),
  sale_multiple numeric(19, 6) not null default 1 check (sale_multiple > 0),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint product_variant_archive_status_chk check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null and archived_by is null)
  ),
  constraint product_variant_active_requires_sku_uom_chk check (
    status <> 'active'
    or (sku is not null and unit_of_measure_id is not null)
  )
);

create unique index product_variant_org_sku_uidx
  on public.product_variant (organization_id, sku)
  where sku is not null;

create unique index product_variant_product_hash_uidx
  on public.product_variant (product_id, combination_hash);

create unique index product_variant_product_default_uidx
  on public.product_variant (product_id)
  where is_default = true;

create index product_variant_org_status_idx
  on public.product_variant (organization_id, status);

create index product_variant_product_id_idx
  on public.product_variant (product_id);

create trigger product_variant_set_updated_at
  before update on public.product_variant
  for each row execute function public.set_updated_at();

comment on table public.product_variant is
  'Catalog Variant — sole sellable/stockable identity (ADR-0020). Parallel; unused by app/Inventory in Phase 2.';

-- ---------------------------------------------------------------------------

create table public.product_variant_axis (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  product_id uuid not null references public.product (id) on delete restrict,
  attribute_definition_id uuid not null
    references public.attribute_definition (id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint product_variant_axis_product_definition_uidx
    unique (product_id, attribute_definition_id)
);

create index product_variant_axis_product_sort_idx
  on public.product_variant_axis (product_id, sort_order);

create trigger product_variant_axis_set_updated_at
  before update on public.product_variant_axis
  for each row execute function public.set_updated_at();

comment on table public.product_variant_axis is
  'Variant axes on a Product (ADR-0022). Allowed options live in product_variant_axis_option.';

-- Allowed options per axis (many-to-many axis ↔ option)
create table public.product_variant_axis_option (
  axis_id uuid not null references public.product_variant_axis (id) on delete cascade,
  option_id uuid not null references public.attribute_option (id) on delete restrict,
  primary key (axis_id, option_id)
);

comment on table public.product_variant_axis_option is
  'Allow-list of AttributeOptions for a ProductVariantAxis.';

-- ---------------------------------------------------------------------------

create table public.product_variant_attribute_value (
  variant_id uuid not null references public.product_variant (id) on delete cascade,
  attribute_definition_id uuid not null
    references public.attribute_definition (id) on delete restrict,
  option_id uuid not null references public.attribute_option (id) on delete restrict,
  primary key (variant_id, attribute_definition_id)
);

create index product_variant_attribute_value_option_idx
  on public.product_variant_attribute_value (option_id);

comment on table public.product_variant_attribute_value is
  'Concrete attribute combination for a variable Variant.';

-- ---------------------------------------------------------------------------

create table public.product_variant_barcode (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  variant_id uuid not null references public.product_variant (id) on delete cascade,
  barcode_type text not null
    check (barcode_type in ('EAN_8', 'EAN_13', 'UPC_A', 'GTIN_14', 'internal')),
  barcode text not null check (
    char_length(trim(barcode)) >= 1
    and char_length(barcode) <= 32
  ),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id)
);

create unique index product_variant_barcode_org_code_uidx
  on public.product_variant_barcode (organization_id, barcode);

create unique index product_variant_barcode_primary_uidx
  on public.product_variant_barcode (variant_id)
  where is_primary = true;

create index product_variant_barcode_variant_idx
  on public.product_variant_barcode (variant_id);

create trigger product_variant_barcode_set_updated_at
  before update on public.product_variant_barcode
  for each row execute function public.set_updated_at();

comment on table public.product_variant_barcode is
  'Barcodes for Variant (unique per org). Parallel — unused in Phase 2.';

-- ===========================================================================
-- Pricing (ADR-0021) — empty until Phase 3/4
-- ===========================================================================

create table public.price_list (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  name text not null check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 120
  ),
  currency text not null default 'BRL' check (currency = 'BRL'),
  is_default boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint price_list_archive_status_chk check (
    (status = 'archived' and archived_at is not null)
    or (status = 'active' and archived_at is null and archived_by is null)
  )
);

create unique index price_list_org_default_uidx
  on public.price_list (organization_id)
  where is_default = true and status = 'active';

create index price_list_org_status_idx
  on public.price_list (organization_id, status);

create trigger price_list_set_updated_at
  before update on public.price_list
  for each row execute function public.set_updated_at();

comment on table public.price_list is
  'Price List aggregate (ADR-0021). One active default per org. Parallel — unused in Phase 2.';

-- ---------------------------------------------------------------------------

create table public.price_list_entry (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  price_list_id uuid not null references public.price_list (id) on delete restrict,
  variant_id uuid not null references public.product_variant (id) on delete restrict,
  amount numeric(19, 6) not null check (amount >= 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  valid_from timestamptz not null,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  constraint price_list_entry_validity_chk check (
    valid_to is null or valid_to > valid_from
  )
);

create index price_list_entry_resolve_idx
  on public.price_list_entry (price_list_id, variant_id, valid_from desc);

create index price_list_entry_variant_idx
  on public.price_list_entry (variant_id);

-- At most one open-ended entry per list+variant
create unique index price_list_entry_open_uidx
  on public.price_list_entry (price_list_id, variant_id)
  where valid_to is null;

create trigger price_list_entry_set_updated_at
  before update on public.price_list_entry
  for each row execute function public.set_updated_at();

comment on table public.price_list_entry is
  'Effective list price intervals by Variant. Source of truth for price resolution.';

-- ---------------------------------------------------------------------------

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete restrict,
  price_list_id uuid not null references public.price_list (id) on delete restrict,
  variant_id uuid not null references public.product_variant (id) on delete restrict,
  entry_id uuid references public.price_list_entry (id) on delete set null,
  amount numeric(19, 6) not null check (amount >= 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  effective_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  recorded_by uuid not null references auth.users (id)
);

create index price_history_variant_idx
  on public.price_history (organization_id, variant_id, effective_at desc);

create index price_history_list_idx
  on public.price_history (price_list_id, effective_at desc);

comment on table public.price_history is
  'Append-only price change log (Pricing aggregate). No UPDATE/DELETE policies.';

-- ===========================================================================
-- RLS — tenant via is_org_member; app enforces products.* later (Phase 3+)
-- ===========================================================================

alter table public.brand enable row level security;
alter table public.category enable row level security;
alter table public.unit_of_measure enable row level security;
alter table public.attribute_definition enable row level security;
alter table public.attribute_option enable row level security;
alter table public.product_variant enable row level security;
alter table public.product_variant_axis enable row level security;
alter table public.product_variant_axis_option enable row level security;
alter table public.product_variant_attribute_value enable row level security;
alter table public.product_variant_barcode enable row level security;
alter table public.price_list enable row level security;
alter table public.price_list_entry enable row level security;
alter table public.price_history enable row level security;

-- brand
create policy brand_select_member on public.brand
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy brand_insert_member on public.brand
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy brand_update_member on public.brand
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- category
create policy category_select_member on public.category
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy category_insert_member on public.category
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy category_update_member on public.category
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- unit_of_measure: platform defaults readable by all authenticated; org rows by membership
create policy uom_select_member on public.unit_of_measure
  for select to authenticated
  using (
    organization_id is null
    or public.is_org_member(organization_id)
  );
create policy uom_insert_member on public.unit_of_measure
  for insert to authenticated
  with check (
    organization_id is not null
    and public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy uom_update_member on public.unit_of_measure
  for update to authenticated
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  )
  with check (
    organization_id is not null
    and public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- attribute_definition
create policy attribute_definition_select_member on public.attribute_definition
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy attribute_definition_insert_member on public.attribute_definition
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy attribute_definition_update_member on public.attribute_definition
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- attribute_option via parent definition org
create policy attribute_option_select_member on public.attribute_option
  for select to authenticated
  using (
    exists (
      select 1
      from public.attribute_definition d
      where d.id = attribute_option.definition_id
        and public.is_org_member(d.organization_id)
    )
  );
create policy attribute_option_insert_member on public.attribute_option
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.attribute_definition d
      where d.id = definition_id
        and public.is_org_member(d.organization_id)
    )
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy attribute_option_update_member on public.attribute_option
  for update to authenticated
  using (
    exists (
      select 1
      from public.attribute_definition d
      where d.id = attribute_option.definition_id
        and public.is_org_member(d.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.attribute_definition d
      where d.id = definition_id
        and public.is_org_member(d.organization_id)
    )
    and updated_by = auth.uid()
  );

-- product_variant
create policy product_variant_select_member on public.product_variant
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy product_variant_insert_member on public.product_variant
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy product_variant_update_member on public.product_variant
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- product_variant_axis
create policy product_variant_axis_select_member on public.product_variant_axis
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy product_variant_axis_insert_member on public.product_variant_axis
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy product_variant_axis_update_member on public.product_variant_axis
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- product_variant_axis_option via axis org
create policy product_variant_axis_option_select_member
  on public.product_variant_axis_option
  for select to authenticated
  using (
    exists (
      select 1
      from public.product_variant_axis a
      where a.id = product_variant_axis_option.axis_id
        and public.is_org_member(a.organization_id)
    )
  );
create policy product_variant_axis_option_insert_member
  on public.product_variant_axis_option
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.product_variant_axis a
      where a.id = axis_id
        and public.is_org_member(a.organization_id)
    )
  );
create policy product_variant_axis_option_update_member
  on public.product_variant_axis_option
  for update to authenticated
  using (
    exists (
      select 1
      from public.product_variant_axis a
      where a.id = product_variant_axis_option.axis_id
        and public.is_org_member(a.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.product_variant_axis a
      where a.id = axis_id
        and public.is_org_member(a.organization_id)
    )
  );
create policy product_variant_axis_option_delete_member
  on public.product_variant_axis_option
  for delete to authenticated
  using (
    exists (
      select 1
      from public.product_variant_axis a
      where a.id = product_variant_axis_option.axis_id
        and public.is_org_member(a.organization_id)
    )
  );

-- product_variant_attribute_value via variant org
create policy product_variant_attribute_value_select_member
  on public.product_variant_attribute_value
  for select to authenticated
  using (
    exists (
      select 1
      from public.product_variant v
      where v.id = product_variant_attribute_value.variant_id
        and public.is_org_member(v.organization_id)
    )
  );
create policy product_variant_attribute_value_insert_member
  on public.product_variant_attribute_value
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.product_variant v
      where v.id = variant_id
        and public.is_org_member(v.organization_id)
    )
  );
create policy product_variant_attribute_value_update_member
  on public.product_variant_attribute_value
  for update to authenticated
  using (
    exists (
      select 1
      from public.product_variant v
      where v.id = product_variant_attribute_value.variant_id
        and public.is_org_member(v.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.product_variant v
      where v.id = variant_id
        and public.is_org_member(v.organization_id)
    )
  );
create policy product_variant_attribute_value_delete_member
  on public.product_variant_attribute_value
  for delete to authenticated
  using (
    exists (
      select 1
      from public.product_variant v
      where v.id = product_variant_attribute_value.variant_id
        and public.is_org_member(v.organization_id)
    )
  );

-- product_variant_barcode
create policy product_variant_barcode_select_member on public.product_variant_barcode
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy product_variant_barcode_insert_member on public.product_variant_barcode
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy product_variant_barcode_update_member on public.product_variant_barcode
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- price_list
create policy price_list_select_member on public.price_list
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy price_list_insert_member on public.price_list
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy price_list_update_member on public.price_list
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- price_list_entry
create policy price_list_entry_select_member on public.price_list_entry
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy price_list_entry_insert_member on public.price_list_entry
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );
create policy price_list_entry_update_member on public.price_list_entry
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and updated_by = auth.uid()
  );

-- price_history: select + insert only (append-only)
create policy price_history_select_member on public.price_history
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy price_history_insert_member on public.price_history
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and recorded_by = auth.uid()
  );

-- ===========================================================================
-- Grants (no DELETE on aggregates — archive via UPDATE; junction tables allow delete)
-- ===========================================================================

grant select, insert, update on public.brand to authenticated;
grant select, insert, update on public.category to authenticated;
grant select, insert, update on public.unit_of_measure to authenticated;
grant select, insert, update on public.attribute_definition to authenticated;
grant select, insert, update on public.attribute_option to authenticated;
grant select, insert, update on public.product_variant to authenticated;
grant select, insert, update on public.product_variant_axis to authenticated;
grant select, insert, update, delete on public.product_variant_axis_option to authenticated;
grant select, insert, update, delete on public.product_variant_attribute_value to authenticated;
grant select, insert, update on public.product_variant_barcode to authenticated;
grant select, insert, update on public.price_list to authenticated;
grant select, insert, update on public.price_list_entry to authenticated;
grant select, insert on public.price_history to authenticated;
