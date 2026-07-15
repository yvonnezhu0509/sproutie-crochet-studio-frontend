# Migration 1 Report: Secure Admin Authorization

Status: proposed for review only. Do not apply until explicitly approved.

SQL file: `supabase/migrations/20260715000000_secure_admin_authorization.sql`

## Complete Proposed SQL

The complete proposed SQL is in:

- `supabase/migrations/20260715000000_secure_admin_authorization.sql`

## Purpose

Move admin authorization away from client-editable `user_metadata` and into
server-controlled `app_metadata`.

The migration replaces `public.is_admin()` so it reads only JWT
`app_metadata`. It does not retain any `user_metadata` fallback.

## Bootstrap Procedure

Complete this before applying the migration:

1. Identify the current administrator user in Supabase Auth.
2. Assign admin status in server-controlled app metadata using the Supabase
   Dashboard, a trusted service-role script, or a Supabase admin API call.
3. Use one of these app metadata shapes:
   - `{ "role": "admin" }`
   - `{ "roles": ["admin"] }`
   - `{ "is_admin": true }`
4. Preserve any existing app metadata keys while adding the admin claim.
5. Have the administrator sign out and sign back in so the JWT refreshes with
   the new `app_metadata`.
6. Verify the refreshed session contains the admin claim in `app_metadata`.
7. Apply the migration only after the bootstrap is confirmed.

The migration includes a guard that raises an exception if no app-metadata admin
exists in `auth.users.raw_app_meta_data`.

## RLS Policies Affected

Recreated to use `public.is_admin()`:

- `products_admin_all` on `public.products`
- `variants_admin_all` on `public.product_variants`
- `inventory_admin_all` on `public.inventory`
- `kit_items_admin_all` on `public.product_kit_items`

Public read policies are not changed by this migration.

## Security Outcome

- Admin authorization comes from `app_metadata`.
- Client-controlled `user_metadata` is ignored.
- Ordinary authenticated users cannot gain admin RLS access by editing their
  profile metadata.
- Ordinary authenticated users retain no product, variant, inventory, or kit
  item mutation policy.

## Test Matrix

Before applying:

- Confirm one admin user has app metadata containing an accepted admin claim.
- Confirm that user has signed out and signed back in.

After applying:

- As admin: select, insert/update test rows in a non-production-safe test flow
  or staging clone; admin RLS should allow product/inventory mutations.
- As ordinary authenticated user: setting `user_metadata.is_admin = true`
  should not grant access.
- As ordinary authenticated user: attempts to insert/update/delete
  `products`, `product_variants`, `inventory`, and `product_kit_items` should
  be denied by RLS.
- As public/anonymous user: existing storefront reads should still work.

## Application Follow-Up Required

The database policy migration is not enough by itself. The current Next.js
middleware should also stop checking `user.user_metadata?.is_admin` for
`/admin` access and should use `app_metadata` or a server-side authorization
check instead.

Known file to update after migration approval:

- `middleware.ts`

## Rollback Considerations

Rollback is possible but security-sensitive:

- Reverting `public.is_admin()` to `user_metadata` would reintroduce the
  vulnerability and is not recommended.
- A safer emergency rollback is to restore only the previous policy names while
  continuing to use app-metadata-backed `public.is_admin()`.
- If admin access is lost, use Supabase Dashboard or service-role admin API to
  set the admin claim in `app_metadata`, then have the admin sign out and sign
  back in.

## Expected TypeScript Type Changes

No database table columns are added or removed in this migration, so generated
database table types should not change.

Application auth/session typing may need to account for admin claims on
`user.app_metadata` instead of `user.user_metadata`.
