'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ProductStatus } from '@/lib/catalog'

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
