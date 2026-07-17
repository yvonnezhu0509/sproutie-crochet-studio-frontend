-- Restrict customer writes to active carts.
-- Converted and abandoned carts must remain immutable to customers.

begin;

drop policy if exists carts_owner_insert on public.carts;
drop policy if exists carts_owner_update on public.carts;
drop policy if exists carts_owner_delete on public.carts;

create policy carts_owner_insert
on public.carts
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'active'
);

create policy carts_owner_delete
on public.carts
for delete
to authenticated
using (
  user_id = auth.uid()
  and status = 'active'
);


drop policy if exists cart_items_owner_insert on public.cart_items;
drop policy if exists cart_items_owner_update on public.cart_items;
drop policy if exists cart_items_owner_delete on public.cart_items;

create policy cart_items_owner_insert
on public.cart_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
      and c.status = 'active'
  )
);

create policy cart_items_owner_update
on public.cart_items
for update
to authenticated
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
      and c.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
      and c.status = 'active'
  )
);

create policy cart_items_owner_delete
on public.cart_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
      and c.status = 'active'
  )
);

commit;
