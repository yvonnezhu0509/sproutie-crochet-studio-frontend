# Migration 2 Report: Inventory Foundation

Status: proposed for review only. Do not apply until explicitly approved.

SQL file: `supabase/migrations/20260715001000_inventory_foundation.sql`

Prerequisite: `20260715000000_secure_admin_authorization.sql`.

## Complete Proposed SQL

The complete proposed SQL is in:

- `supabase/migrations/20260715001000_inventory_foundation.sql`

## Summary

This migration preserves the existing storefront schema and adds the minimum
foundation for component inventory, recipes, customer/private products, and an
inventory movement ledger.

It does not:

- Drop or rename existing tables.
- Create a duplicate recipe table.
- Repurpose `inventory`.
- Duplicate assembled stock on `product_variants`.
- Remove or replace existing product fields.

## Existing Tables Reused

- `products`: remains the shared product root.
- `product_variants`: remains the variant table.
- `inventory`: remains the assembled stock snapshot keyed by `variant_id`.
- `product_kit_items`: becomes the extended recipe/BOM surface while retaining
  all current customer-visible kit-content behavior.

## Product Changes

Added columns:

- `source_type text not null default 'sproutie_original'`
- `sale_mode text not null default 'stocked'`
- `visibility text not null default 'public'`
- `owner_id uuid null references auth.users(id) on delete set null`

Backfill:

- Existing products become `sproutie_original`, `stocked`, `public`, with
  `owner_id = null`.

Constraints:

- `source_type in ('sproutie_original', 'sproutie_ai', 'customer_ai')`
- `sale_mode in ('stocked', 'made_to_order', 'digital')`
- `visibility in ('public', 'unlisted', 'private')`

Indexes:

- `(status, visibility)`
- `source_type`
- `sale_mode`
- `owner_id`

The existing `status` enum and values are preserved.

## Product Variant Changes

Added column:

- `inventory_mode text not null default 'assembled'`

Constraint:

- `inventory_mode in ('assembled', 'component_based', 'unlimited')`

Indexes:

- Partial unique SKU index on non-null `sku`
- `product_id`

The migration deliberately does not add `assembled_stock`,
`low_stock_threshold`, or a duplicate variant status field.

## Inventory Table

No column changes.

`inventory` remains assembled stock per variant:

- `variant_id`
- `quantity_on_hand`
- `quantity_reserved`
- `low_stock_threshold`
- `track_inventory`
- `updated_at`

## New Materials Table

Created as component-level inventory:

- `id`
- `sku`
- `name`
- `category`
- `color`
- `unit`
- `quantity_on_hand`
- `quantity_reserved`
- `reorder_point`
- `unit_cost`
- `currency`
- `supplier_name`
- `supplier_url`
- `active`
- `notes`
- `created_at`
- `updated_at`

Quantities use `numeric(14, 3)` for fractional units such as grams and meters.

Constraints and indexes:

- Non-negative inventory quantities.
- Non-negative `unit_cost` when present.
- Three-letter uppercase `currency`.
- Partial unique SKU index.
- Indexes on `active` and `category`.

RLS:

- Admin-only. No public read policy, so supplier and unit-cost data are not
  publicly exposed.

## Product Kit Item Changes

Added columns:

- `material_id uuid null references public.materials(id) on delete restrict`
- `waste_percentage numeric(6, 3) not null default 0`
- `verification_status text not null default 'estimated'`

Constraints:

- `waste_percentage between 0 and 100`
- `verification_status in ('estimated', 'sample_tested', 'production_ready')`

Index:

- `material_id`

`material_id` remains nullable for digital, informational, packaging, and
customer-visible entries that do not consume component stock.

## Inventory Movements

Created as a single ledger for both component and assembled variant stock:

- `id`
- `material_id`
- `variant_id`
- `movement_type`
- `quantity_delta`
- `reference_type`
- `reference_id`
- `note`
- `created_by`
- `created_at`

Constraints:

- Exactly one of `material_id` or `variant_id` must be non-null.
- `quantity_delta <> 0`.

Indexes:

- `material_id`
- `variant_id`
- `created_at`
- `created_by`
- `(reference_type, reference_id)`

RLS:

- Admin-only.

## Affected RLS Policies

Replaced/recreated:

- `products_public_select`
- `products_owner_select`
- `products_admin_all`
- `variants_public_select`
- `variants_owner_select`
- `variants_admin_all`
- `inventory_public_select`
- `inventory_owner_select`
- `inventory_admin_all`
- `kit_items_public_read`
- `kit_items_owner_select`
- `kit_items_admin_all`
- `materials_admin_all`
- `inventory_movements_admin_all`

Public reads:

- Public users can read public or unlisted products whose status is currently
  storefront-visible: `coming_soon`, `active`, or `sold_out`.
- Public users can read active variants, inventory snapshots, and
  customer-visible kit items for those products.
- Public users cannot mutate products, variants, inventory, materials,
  product kit items, or inventory movements.

Private customer products:

- Owners can read products where `owner_id = auth.uid()`.
- Owners can read related variants, inventory snapshots, and kit items.
- Admins can read and mutate through secure `public.is_admin()`.

## Test Matrix

Run first in staging or a disposable Supabase branch.

Schema tests:

- Migration applies after Migration 1.
- Migration refuses to apply if `public.is_admin()` still references
  `user_metadata`.
- Existing products remain queryable.
- Existing product variants remain queryable.
- Existing inventory rows remain queryable.
- Existing product kit items remain queryable.
- Duplicate non-null variant SKUs fail with a clear migration error.

Public/anonymous RLS:

- Can read `visibility = 'public'` active/coming-soon/sold-out products.
- Can read `visibility = 'unlisted'` active/coming-soon/sold-out products by id
  or slug.
- Cannot read `visibility = 'private'` products.
- Cannot read `materials`.
- Cannot read `inventory_movements`.
- Cannot insert/update/delete product, variant, inventory, material, kit item,
  or movement rows.

Owner RLS:

- Authenticated owner can read their private product.
- Authenticated owner can read variants, inventory snapshots, and kit items for
  their private product.
- Authenticated owner cannot mutate product/inventory tables unless they are
  also admin.

Admin RLS:

- App-metadata admin can read and mutate products, variants, inventory,
  materials, kit items, and inventory movements.
- A user with only `user_metadata.is_admin = true` cannot mutate admin tables.

Data integrity:

- `materials.quantity_on_hand < 0` is rejected.
- `materials.quantity_reserved < 0` is rejected.
- `materials.reorder_point < 0` is rejected.
- `materials.unit_cost < 0` is rejected.
- Invalid `products.source_type`, `sale_mode`, or `visibility` is rejected.
- Invalid `product_variants.inventory_mode` is rejected.
- Invalid `product_kit_items.verification_status` is rejected.
- `inventory_movements` with both `material_id` and `variant_id` is rejected.
- `inventory_movements` with neither `material_id` nor `variant_id` is rejected.
- `inventory_movements.quantity_delta = 0` is rejected.

Storefront regression:

- Home/originals listing still shows existing products.
- Product detail pages still show existing variants, images, inventory, and kit
  contents.
- Admin product editor still updates existing product fields and first variant
  inventory.
- Kit contents editor still creates/updates/deletes product kit items without a
  `material_id`.

## Expected TypeScript Type Changes

Regenerate Supabase database types after applying the migration.

Expected additions:

- `products.Row.source_type`
- `products.Row.sale_mode`
- `products.Row.visibility`
- `products.Row.owner_id`
- `product_variants.Row.inventory_mode`
- New `materials` table types.
- `product_kit_items.Row.material_id`
- `product_kit_items.Row.waste_percentage`
- `product_kit_items.Row.verification_status`
- New `inventory_movements` table types.

Existing types remain:

- `products.status`
- `product_variants.is_active`
- `inventory.*`
- Existing `product_kit_items` columns

## Application Queries To Update After Deployment

Not required for the migration to preserve current storefront reads, but needed
for the next product/inventory work:

- `lib/catalog.ts`
  - Add `visibility = 'public'` to listing queries so unlisted products do not
    appear in general listings.
  - Decide whether detail-by-slug should allow `visibility = 'unlisted'`.
  - Read `source_type`, `sale_mode`, and variant `inventory_mode` as product
    management grows.

- `app/admin/products/actions.ts`
  - Add admin workflows for `source_type`, `sale_mode`, `visibility`,
    `owner_id`, variant `inventory_mode`, materials, linked kit items, and
    inventory movements.

- `components/admin/product-edit-form.tsx`
  - Expose the new product classification fields.
  - Expose variant `inventory_mode`.

- `components/admin/kit-contents-editor.tsx`
  - Allow optional `material_id`, `waste_percentage`, and
    `verification_status`.

- New admin inventory UI
  - Manage `materials`.
  - Record `inventory_movements`.
  - Avoid direct public exposure of supplier or unit-cost fields.

## Rollback Considerations

This migration is additive, but rollback should still be treated carefully.

Low-risk rollback options:

- Leave new columns/tables in place and stop using them in application code.
- Revert RLS policies to the previous visibility-agnostic public read logic if
  storefront access unexpectedly breaks.
- Keep `materials` and `inventory_movements` inaccessible via RLS while
  investigating issues.

Destructive rollback options are not recommended in production:

- Dropping `materials` would lose component inventory rows.
- Dropping `inventory_movements` would lose stock audit history.
- Removing product classification columns would discard source/sale/visibility
  decisions.

Before any destructive cleanup:

- Export data.
- Confirm no application code reads the new columns/tables.
- Confirm no order, cart, checkout, or admin workflows depend on the new data.
