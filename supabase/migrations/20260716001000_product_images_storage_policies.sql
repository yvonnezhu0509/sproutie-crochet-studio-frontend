-- Product image Storage policies.
--
-- Review status: proposed only. Do not apply until explicitly approved.
--
-- The product-images bucket is public for reads by URL, but object management
-- must be limited to authenticated admins using server-controlled app_metadata
-- through public.is_admin().

begin;

drop policy if exists product_images_storage_admin_select on storage.objects;
drop policy if exists product_images_storage_admin_insert on storage.objects;
drop policy if exists product_images_storage_admin_update on storage.objects;
drop policy if exists product_images_storage_admin_delete on storage.objects;

create policy product_images_storage_admin_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin()
);

create policy product_images_storage_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.is_admin()
);

create policy product_images_storage_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin()
)
with check (
  bucket_id = 'product-images'
  and public.is_admin()
);

create policy product_images_storage_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin()
);

commit;
