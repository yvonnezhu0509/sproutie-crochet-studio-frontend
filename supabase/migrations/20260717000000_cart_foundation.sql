-- Authenticated shopping cart foundation.
-- Guest carts remain in localStorage until cart merge support is added.

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'converted', 'abandoned')),
  currency text not null default 'USD'
    check (char_length(currency) = 3 and currency = upper(currency)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index carts_one_active_per_user_idx
  on public.carts(user_id)
  where status = 'active';

create index carts_user_id_status_idx
  on public.carts(user_id, status);

create trigger carts_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();


create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  line_key text not null
    check (char_length(line_key) between 1 and 255),
  quantity integer not null default 1
    check (quantity between 1 and 99),
  configuration jsonb not null default '{}'::jsonb
    check (jsonb_typeof(configuration) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, line_key)
);

create index cart_items_cart_id_idx
  on public.cart_items(cart_id);

create index cart_items_variant_id_idx
  on public.cart_items(variant_id);

create trigger cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();


-- Prevent a cart item from combining a product with a variant belonging
-- to a different product.
create or replace function public.validate_cart_item_variant_product()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.product_variants pv
    where pv.id = new.variant_id
      and pv.product_id = new.product_id
  ) then
    raise exception 'Cart item variant does not belong to the selected product.';
  end if;

  return new;
end;
$$;

create trigger cart_items_validate_variant_product
  before insert or update of product_id, variant_id
  on public.cart_items
  for each row execute function public.validate_cart_item_variant_product();


alter table public.carts enable row level security;
alter table public.cart_items enable row level security;


create policy carts_owner_select
on public.carts
for select
to authenticated
using (user_id = auth.uid());

create policy carts_owner_insert
on public.carts
for insert
to authenticated
with check (user_id = auth.uid());

create policy carts_owner_update
on public.carts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy carts_owner_delete
on public.carts
for delete
to authenticated
using (user_id = auth.uid());

create policy carts_admin_all
on public.carts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


create policy cart_items_owner_select
on public.cart_items
for select
to authenticated
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
  )
);

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
  )
)
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_id
      and c.user_id = auth.uid()
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
  )
);

create policy cart_items_admin_all
on public.cart_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
