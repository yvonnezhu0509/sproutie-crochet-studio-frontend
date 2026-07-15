-- Migration 1: Secure admin authorization
--
-- Review status: proposed only. Do not apply until the bootstrap procedure in
-- the companion report has been completed and explicitly approved.
--
-- Goal:
-- - Move admin authorization from client-editable user_metadata to
--   server-controlled app_metadata.
-- - Do not retain a fallback to user_metadata.
-- - Ensure every admin RLS policy uses the shared public.is_admin() function.

begin;

-- ---------------------------------------------------------------------------
-- Bootstrap guard
-- ---------------------------------------------------------------------------
-- Before this migration is applied, assign at least one administrator through
-- auth.users.raw_app_meta_data using a trusted server/admin channel, for example:
--
--   { "role": "admin" }
--
-- or:
--
--   { "roles": ["admin"] }
--
-- or:
--
--   { "is_admin": true }
--
-- This guard prevents accidentally replacing public.is_admin() before any
-- server-controlled administrator exists.
do $$
begin
  if not exists (
    select 1
    from auth.users u
    where lower(coalesce(u.raw_app_meta_data ->> 'role', '')) = 'admin'
       or lower(coalesce(u.raw_app_meta_data ->> 'is_admin', '')) in ('true', 't', '1', 'yes')
       or coalesce(u.raw_app_meta_data -> 'roles', '[]'::jsonb) ? 'admin'
  ) then
    raise exception
      'Secure admin bootstrap required: set an administrator in auth.users.raw_app_meta_data/app_metadata before applying this migration.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Shared secure admin helper
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin'
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')) in ('true', 't', '1', 'yes')
    or coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ? 'admin';
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

comment on function public.is_admin() is
  'Returns true only when the JWT contains server-controlled app_metadata admin claims. Does not read user_metadata.';

-- ---------------------------------------------------------------------------
-- Admin RLS policies
-- ---------------------------------------------------------------------------
-- Recreate admin policies so every policy uses public.is_admin(). Public read
-- policies are intentionally left unchanged in this migration.

drop policy if exists products_admin_all on public.products;
create policy products_admin_all
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists variants_admin_all on public.product_variants;
create policy variants_admin_all
on public.product_variants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists inventory_admin_all on public.inventory;
create policy inventory_admin_all
on public.inventory
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists kit_items_admin_all on public.product_kit_items;
create policy kit_items_admin_all
on public.product_kit_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

commit;
