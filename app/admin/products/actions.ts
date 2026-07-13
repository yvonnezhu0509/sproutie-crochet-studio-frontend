'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ProductStatus, DbKitItem } from '@/lib/catalog'

export interface UpdateProductPayload {
  name: string
  slug: string
  short_description: string
  description: string
  status: ProductStatus
  base_price_cents: number
  difficulty: string
  estimated_making_time: string
  is_featured: boolean
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update({
      name: payload.name,
      slug: payload.slug,
      short_description: payload.short_description,
      description: payload.description,
      status: payload.status,
      base_price_cents: payload.base_price_cents,
      difficulty: payload.difficulty,
      estimated_making_time: payload.estimated_making_time,
      is_featured: payload.is_featured,
    })
    .eq('id', id)

  if (error) {
    console.error('[admin] updateProduct error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin/products')
  revalidatePath('/admin')
  revalidatePath('/originals')
  revalidatePath(`/originals/${payload.slug}`)
  revalidatePath('/')
  return { error: null }
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus,
  slug: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('[admin] updateProductStatus error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin/products')
  revalidatePath('/admin')
  revalidatePath('/originals')
  revalidatePath(`/originals/${slug}`)
  revalidatePath('/')
  return { error: null }
}

export async function updateInventory(
  variantId: string,
  quantityOnHand: number,
  productSlug: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory')
    .update({ quantity_on_hand: quantityOnHand })
    .eq('variant_id', variantId)

  if (error) {
    console.error('[admin] updateInventory error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin/products')
  revalidatePath(`/originals/${productSlug}`)
  return { error: null }
}

// ---------------------------------------------------------------------------
// Kit item actions
// ---------------------------------------------------------------------------

export interface KitItemPayload {
  category: string
  item_name: string
  quantity: number
  unit: string
  specification: string
  is_optional: boolean
  customer_visible: boolean
  sort_order: number
  variant_id: string | null
}

export async function upsertKitItem(
  productId: string,
  productSlug: string,
  payload: KitItemPayload,
  existingId?: string,
): Promise<{ error: string | null; item: DbKitItem | null }> {
  const supabase = await createClient()

  const row = {
    product_id: productId,
    variant_id: payload.variant_id || null,
    category: payload.category.trim(),
    item_name: payload.item_name.trim(),
    quantity: payload.quantity,
    unit: payload.unit.trim(),
    specification: payload.specification.trim() || null,
    is_optional: payload.is_optional,
    customer_visible: payload.customer_visible,
    sort_order: payload.sort_order,
  }

  let data: DbKitItem | null = null
  let error: { message: string } | null = null

  if (existingId) {
    const result = await supabase
      .from('product_kit_items')
      .update(row)
      .eq('id', existingId)
      .select()
      .single()
    data = result.data as DbKitItem | null
    error = result.error
  } else {
    const result = await supabase
      .from('product_kit_items')
      .insert(row)
      .select()
      .single()
    data = result.data as DbKitItem | null
    error = result.error
  }

  if (error) {
    console.error('[admin] upsertKitItem error:', error.message)
    return { error: error.message, item: null }
  }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/originals/${productSlug}`)
  return { error: null, item: data }
}

export async function deleteKitItem(
  itemId: string,
  productId: string,
  productSlug: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('product_kit_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('[admin] deleteKitItem error:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/originals/${productSlug}`)
  return { error: null }
}

export async function reorderKitItems(
  items: { id: string; sort_order: number }[],
  productId: string,
  productSlug: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const updates = items.map(({ id, sort_order }) =>
    supabase
      .from('product_kit_items')
      .update({ sort_order })
      .eq('id', id),
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) {
    console.error('[admin] reorderKitItems error:', firstError.error.message)
    return { error: firstError.error.message }
  }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/originals/${productSlug}`)
  return { error: null }
}
