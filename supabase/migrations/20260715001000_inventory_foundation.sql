-- Migration 2: Inventory foundation
--
-- Review status: proposed only. Do not apply until explicitly approved.
--
-- Prerequisite:
-- - 20260715000000_secure_admin_authorization.sql has been applied.
-- - public.is_admin() reads only server-controlled app_metadata.
--
-- Goals:
-- - Preserve existing storefront behavior.
-- - Keep inventory as assembled stock per product variant.
-- - Extend product_kit_items instead of creating a duplicate recipe table.
-- - Add materials for component-level stock.
-- - Add inventory_movements as one ledger for material and assembled variant
--   stock changes.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Require the secure admin migration first. This intentionally blocks if the
-- deployed helper still references user_metadata.
do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'public.is_admin() is missing. Apply secure admin authorization migration first.';
  end if;

  if pg_get_functiondef('public.is_admin()'::regprocedure) ilike '%user_metadata%' then
    raise exception 'public.is_admin() still references user_metadata. Apply secure admin authorization migration first.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- products: shared product root
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists source_type text not null default 'sproutie_original',
  add column if not exists sale_mode text not null default 'stocked',
  add column if not exists visibility text not null default 'public',
  add column if not exists owner_id uuid;

update public.products
set
  source_type = coalesce(source_type, 'sproutie_original'),
  sale_mode = coalesce(sale_mode, 'stocked'),
  visibility = coalesce(visibility, 'public')
where source_type is null
   or sale_mode is null
   or visibility is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_owner_id_fkey'
  ) then
    alter table public.products
      add constraint products_owner_id_fkey
      foreign key (owner_id) references auth.users(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_source_type_check'
  ) then
    alter table public.products
      add constraint products_source_type_check
      check (source_type in ('sproutie_original', 'sproutie_ai', 'customer_ai'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_sale_mode_check'
  ) then
    alter table public.products
      add constraint products_sale_mode_check
      check (sale_mode in ('stocked', 'made_to_order', 'digital'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_visibility_check'
  ) then
    alter table public.products
      add constraint products_visibility_check
      check (visibility in ('public', 'unlisted', 'private'));
  end if;
end $$;

create index if not exists products_status_visibility_idx
  on public.products(status, visibility);

create index if not exists products_source_type_idx
  on public.products(source_type);

create index if not exists products_sale_mode_idx
  on public.products(sale_mode);

create index if not exists products_owner_id_idx
  on public.products(owner_id);

-- ---------------------------------------------------------------------------
-- product_variants: keep existing shape; add inventory_mode only
-- ---------------------------------------------------------------------------

alter table public.product_variants
  add column if not exists inventory_mode text not null default 'assembled';

update public.product_variants
set inventory_mode = coalesce(inventory_mode, 'assembled')
where inventory_mode is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_variants'::regclass
      and conname = 'product_variants_inventory_mode_check'
  ) then
    alter table public.product_variants
      add constraint product_variants_inventory_mode_check
      check (inventory_mode in ('assembled', 'component_based', 'unlimited'));
  end if;

  if exists (
    select 1
    from public.product_variants
    where sku is not null
    group by sku
    having count(*) > 1
  ) then
    raise exception 'Cannot add unique variant SKU index: duplicate non-null SKUs exist.';
  end if;
end $$;

create unique index if not exists product_variants_sku_unique_idx
  on public.product_variants(sku)
  where sku is not null;

create index if not exists product_variants_product_id_idx
  on public.product_variants(product_id);

-- ---------------------------------------------------------------------------
-- inventory: keep as assembled stock snapshot per variant
-- ---------------------------------------------------------------------------

-- No columns are added to public.inventory in this migration.

-- ---------------------------------------------------------------------------
-- materials: component-level inventory
-- ---------------------------------------------------------------------------

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  sku text,
  name text not null,
  category text not null,
  color text,
  unit text not null default 'unit',
  quantity_on_hand numeric(14, 3) not null default 0,
  quantity_reserved numeric(14, 3) not null default 0,
  reorder_point numeric(14, 3) not null default 0,
  unit_cost numeric(12, 4),
  currency text not null default 'USD',
  supplier_name text,
  supplier_url text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.materials'::regclass
      and conname = 'materials_quantity_on_hand_non_negative'
  ) then
    alter table public.materials
      add constraint materials_quantity_on_hand_non_negative
      check (quantity_on_hand >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.materials'::regclass
      and conname = 'materials_quantity_reserved_non_negative'
  ) then
    alter table public.materials
      add constraint materials_quantity_reserved_non_negative
      check (quantity_reserved >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.materials'::regclass
      and conname = 'materials_reorder_point_non_negative'
  ) then
    alter table public.materials
      add constraint materials_reorder_point_non_negative
      check (reorder_point >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.materials'::regclass
      and conname = 'materials_unit_cost_non_negative'
  ) then
    alter table public.materials
      add constraint materials_unit_cost_non_negative
      check (unit_cost is null or unit_cost >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.materials'::regclass
      and conname = 'materials_currency_format_check'
  ) then
    alter table public.materials
      add constraint materials_currency_format_check
      check (currency = upper(currency) and length(currency) = 3);
  end if;
end $$;

create unique index if not exists materials_sku_unique_idx
  on public.materials(sku)
  where sku is not null;

create index if not exists materials_active_idx
  on public.materials(active);

create index if not exists materials_category_idx
  on public.materials(category);

drop trigger if exists set_materials_updated_at on public.materials;
create trigger set_materials_updated_at
before update on public.materials
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- product_kit_items: extend existing table as recipe/BOM surface
-- ---------------------------------------------------------------------------

alter table public.product_kit_items
  add column if not exists material_id uuid,
  add column if not exists waste_percentage numeric(6, 3) not null default 0,
  add column if not exists verification_status text not null default 'estimated';

update public.product_kit_items
set
  waste_percentage = coalesce(waste_percentage, 0),
  verification_status = coalesce(verification_status, 'estimated')
where waste_percentage is null
   or verification_status is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_kit_items'::regclass
      and conname = 'product_kit_items_material_id_fkey'
  ) then
    alter table public.product_kit_items
      add constraint product_kit_items_material_id_fkey
      foreign key (material_id) references public.materials(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_kit_items'::regclass
      and conname = 'product_kit_items_waste_percentage_check'
  ) then
    alter table public.product_kit_items
      add constraint product_kit_items_waste_percentage_check
      check (waste_percentage >= 0 and waste_percentage <= 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_kit_items'::regclass
      and conname = 'product_kit_items_verification_status_check'
  ) then
    alter table public.product_kit_items
      add constraint product_kit_items_verification_status_check
      check (verification_status in ('estimated', 'sample_tested', 'production_ready'));
  end if;
end $$;

create index if not exists product_kit_items_material_id_idx
  on public.product_kit_items(material_id);

-- ---------------------------------------------------------------------------
-- inventory_movements: one stock ledger for materials and assembled variants
-- ---------------------------------------------------------------------------

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  movement_type text not null,
  quantity_delta numeric(14, 3) not null,
  reference_type text,
  reference_id text,
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint inventory_movements_one_stock_target_check
    check (num_nonnulls(material_id, variant_id) = 1),
  constraint inventory_movements_quantity_delta_non_zero
    check (quantity_delta <> 0)
);

create index if not exists inventory_movements_material_id_idx
  on public.inventory_movements(material_id);

create index if not exists inventory_movements_variant_id_idx
  on public.inventory_movements(variant_id);

create index if not exists inventory_movements_created_at_idx
  on public.inventory_movements(created_at);

create index if not exists inventory_movements_created_by_idx
  on public.inventory_movements(created_by);

create index if not exists inventory_movements_reference_idx
  on public.inventory_movements(reference_type, reference_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.product_kit_items enable row level security;
alter table public.materials enable row level security;
alter table public.inventory_movements enable row level security;

-- products
drop policy if exists products_public_select on public.products;
create policy products_public_select
on public.products
for select
to public
using (
  visibility in ('public', 'unlisted')
  and status in ('coming_soon', 'active', 'sold_out')
);

drop policy if exists products_owner_select on public.products;
create policy products_owner_select
on public.products
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists products_admin_all on public.products;
create policy products_admin_all
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- product_variants
drop policy if exists variants_public_select on public.product_variants;
create policy variants_public_select
on public.product_variants
for select
to public
using (
  is_active = true
  and exists (
    select 1
    from public.products p
    where p.id = product_variants.product_id
      and p.visibility in ('public', 'unlisted')
      and p.status in ('coming_soon', 'active', 'sold_out')
  )
);

drop policy if exists variants_owner_select on public.product_variants;
create policy variants_owner_select
on public.product_variants
for select
to authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_variants.product_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists variants_admin_all on public.product_variants;
create policy variants_admin_all
on public.product_variants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- inventory
drop policy if exists inventory_public_select on public.inventory;
create policy inventory_public_select
on public.inventory
for select
to public
using (
  exists (
    select 1
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = inventory.variant_id
      and p.visibility in ('public', 'unlisted')
      and p.status in ('coming_soon', 'active', 'sold_out')
  )
);

drop policy if exists inventory_owner_select on public.inventory;
create policy inventory_owner_select
on public.inventory
for select
to authenticated
using (
  exists (
    select 1
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = inventory.variant_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists inventory_admin_all on public.inventory;
create policy inventory_admin_all
on public.inventory
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- product_kit_items
drop policy if exists kit_items_public_read on public.product_kit_items;
create policy kit_items_public_read
on public.product_kit_items
for select
to public
using (
  customer_visible = true
  and exists (
    select 1
    from public.products p
    where p.id = product_kit_items.product_id
      and p.visibility in ('public', 'unlisted')
      and p.status in ('coming_soon', 'active', 'sold_out')
  )
);

drop policy if exists kit_items_owner_select on public.product_kit_items;
create policy kit_items_owner_select
on public.product_kit_items
for select
to authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_kit_items.product_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists kit_items_admin_all on public.product_kit_items;
create policy kit_items_admin_all
on public.product_kit_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- materials: no public read because supplier and unit-cost data are sensitive.
drop policy if exists materials_admin_all on public.materials;
create policy materials_admin_all
on public.materials
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- inventory movements: admin-only operational ledger.
drop policy if exists inventory_movements_admin_all on public.inventory_movements;
create policy inventory_movements_admin_all
on public.inventory_movements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

commit;
