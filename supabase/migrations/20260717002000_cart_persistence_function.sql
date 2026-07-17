-- Atomically replace the authenticated user's active cart contents.
-- Pricing and display data are never accepted from the client.

begin;

create or replace function public.replace_active_cart_items(
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_line_key text;
  v_quantity integer;
  v_configuration jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Cart items must be a JSON array.';
  end if;

  if jsonb_array_length(p_items) > 100 then
    raise exception 'Cart cannot contain more than 100 lines.';
  end if;

  insert into public.carts (user_id, status, currency)
  values (v_user_id, 'active', 'USD')
  on conflict (user_id) where status = 'active'
  do update set updated_at = public.carts.updated_at
  returning id into v_cart_id;

  delete from public.cart_items
  where cart_id = v_cart_id;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_variant_id := (v_item ->> 'variant_id')::uuid;
    v_line_key := v_item ->> 'line_key';
    v_quantity := (v_item ->> 'quantity')::integer;
    v_configuration := coalesce(v_item -> 'configuration', '{}'::jsonb);

    if v_line_key is null or char_length(v_line_key) not between 1 and 255 then
      raise exception 'Cart line key must contain between 1 and 255 characters.';
    end if;

    if v_quantity is null or v_quantity not between 1 and 99 then
      raise exception 'Cart quantity must be between 1 and 99.';
    end if;

    if jsonb_typeof(v_configuration) <> 'object' then
      raise exception 'Cart configuration must be a JSON object.';
    end if;

    if not exists (
      select 1
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
      where pv.id = v_variant_id
        and pv.product_id = v_product_id
        and pv.is_active = true
        and p.visibility in ('public', 'unlisted')
        and p.status in ('active', 'sold_out')
    ) then
      raise exception 'Cart item is not available.';
    end if;

    insert into public.cart_items (
      cart_id,
      product_id,
      variant_id,
      line_key,
      quantity,
      configuration
    )
    values (
      v_cart_id,
      v_product_id,
      v_variant_id,
      v_line_key,
      v_quantity,
      v_configuration
    );
  end loop;

  update public.carts
  set updated_at = now()
  where id = v_cart_id;

  return v_cart_id;
end;
$$;

revoke all on function public.replace_active_cart_items(jsonb) from public;
grant execute on function public.replace_active_cart_items(jsonb) to authenticated;

commit;
