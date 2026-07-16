-- Inventory movement transaction functions.
--
-- Review status: proposed only. Do not apply until explicitly approved.
--
-- These functions atomically update the stock snapshot and append exactly one
-- immutable inventory_movements ledger row. They rely on public.is_admin(),
-- which must read server-controlled app_metadata.

begin;

create or replace function public.record_material_inventory_movement(
  p_material_id uuid,
  p_movement_type text,
  p_quantity_delta numeric,
  p_reference_type text default null,
  p_reference_id text default null,
  p_note text default null
)
returns table (
  movement_id uuid,
  new_quantity numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_quantity numeric;
  v_reserved_quantity numeric;
  v_new_quantity numeric;
begin
  if not public.is_admin() then
    raise exception 'Admin access is required to record inventory movements.';
  end if;

  if p_material_id is null then
    raise exception 'Material is required.';
  end if;

  if nullif(trim(p_movement_type), '') is null then
    raise exception 'Movement type is required.';
  end if;

  if p_quantity_delta is null or p_quantity_delta = 0 then
    raise exception 'Quantity delta must be non-zero.';
  end if;

  select m.quantity_on_hand, m.quantity_reserved
  into v_current_quantity, v_reserved_quantity
  from public.materials m
  where m.id = p_material_id
  for update;

  if not found then
    raise exception 'Material not found.';
  end if;

  v_new_quantity := v_current_quantity + p_quantity_delta;

  if v_new_quantity < 0 then
    raise exception 'This movement would make material stock negative.';
  end if;

  if v_new_quantity < v_reserved_quantity then
    raise exception 'This movement would reduce material stock below the reserved quantity.';
  end if;

  update public.materials
  set quantity_on_hand = v_new_quantity
  where id = p_material_id;

  insert into public.inventory_movements (
    material_id,
    variant_id,
    movement_type,
    quantity_delta,
    reference_type,
    reference_id,
    note,
    created_by
  )
  values (
    p_material_id,
    null,
    trim(p_movement_type),
    p_quantity_delta,
    nullif(trim(coalesce(p_reference_type, '')), ''),
    nullif(trim(coalesce(p_reference_id, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    auth.uid()
  )
  returning id into movement_id;

  new_quantity := v_new_quantity;
  return next;
end;
$$;

create or replace function public.record_variant_inventory_movement(
  p_variant_id uuid,
  p_movement_type text,
  p_quantity_delta numeric,
  p_reference_type text default null,
  p_reference_id text default null,
  p_note text default null
)
returns table (
  movement_id uuid,
  new_quantity numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_quantity integer;
  v_reserved_quantity integer;
  v_new_quantity numeric;
begin
  if not public.is_admin() then
    raise exception 'Admin access is required to record inventory movements.';
  end if;

  if p_variant_id is null then
    raise exception 'Variant is required.';
  end if;

  if nullif(trim(p_movement_type), '') is null then
    raise exception 'Movement type is required.';
  end if;

  if p_quantity_delta is null or p_quantity_delta = 0 then
    raise exception 'Quantity delta must be non-zero.';
  end if;

  if p_quantity_delta <> trunc(p_quantity_delta) then
    raise exception 'Assembled kit stock movements must use whole-number quantities.';
  end if;

  select i.quantity_on_hand, i.quantity_reserved
  into v_current_quantity, v_reserved_quantity
  from public.inventory i
  where i.variant_id = p_variant_id
  for update;

  if not found then
    raise exception 'Inventory row not found for selected variant.';
  end if;

  v_new_quantity := v_current_quantity + p_quantity_delta;

  if v_new_quantity < 0 then
    raise exception 'This movement would make assembled kit stock negative.';
  end if;

  if v_new_quantity < v_reserved_quantity then
    raise exception 'This movement would reduce assembled kit stock below the reserved quantity.';
  end if;

  update public.inventory
  set quantity_on_hand = v_new_quantity::integer
  where variant_id = p_variant_id;

  insert into public.inventory_movements (
    material_id,
    variant_id,
    movement_type,
    quantity_delta,
    reference_type,
    reference_id,
    note,
    created_by
  )
  values (
    null,
    p_variant_id,
    trim(p_movement_type),
    p_quantity_delta,
    nullif(trim(coalesce(p_reference_type, '')), ''),
    nullif(trim(coalesce(p_reference_id, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    auth.uid()
  )
  returning id into movement_id;

  new_quantity := v_new_quantity;
  return next;
end;
$$;

revoke all on function public.record_material_inventory_movement(uuid, text, numeric, text, text, text) from public;
revoke all on function public.record_variant_inventory_movement(uuid, text, numeric, text, text, text) from public;

grant execute on function public.record_material_inventory_movement(uuid, text, numeric, text, text, text) to authenticated;
grant execute on function public.record_variant_inventory_movement(uuid, text, numeric, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Append-only movement ledger access
-- ---------------------------------------------------------------------------
-- Admins may read movement history, but no client role may directly insert,
-- update, or delete ledger rows. New rows are inserted only inside the
-- SECURITY DEFINER functions above, which run as their function owner.
alter table public.inventory_movements enable row level security;

drop policy if exists inventory_movements_admin_all on public.inventory_movements;
drop policy if exists inventory_movements_admin_select on public.inventory_movements;

create policy inventory_movements_admin_select
on public.inventory_movements
for select
to authenticated
using (public.is_admin());

revoke insert, update, delete on public.inventory_movements from anon, authenticated;

commit;
