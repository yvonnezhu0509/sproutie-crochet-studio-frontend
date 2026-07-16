'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ProductSaleMode,
  ProductSourceType,
  ProductStatus,
  ProductVisibility,
  VariantInventoryMode,
  DbKitItem,
} from '@/lib/catalog'

export interface UpdateProductPayload {
  name: string
  slug: string
  short_description: string
  description: string
  status: ProductStatus
  source_type: ProductSourceType
  sale_mode: ProductSaleMode
  visibility: ProductVisibility
  base_price_cents: number
  difficulty: string
  estimated_making_time: string
  is_featured: boolean
}

const PRODUCT_SOURCE_TYPES = ['sproutie_original', 'sproutie_ai', 'customer_ai'] as const
const PRODUCT_SALE_MODES = ['stocked', 'made_to_order', 'digital'] as const
const PRODUCT_VISIBILITIES = ['public', 'unlisted', 'private'] as const
const VARIANT_INVENTORY_MODES = ['assembled', 'component_based', 'unlimited'] as const
const PUBLIC_CATALOG_STATUSES: ProductStatus[] = ['coming_soon', 'active', 'sold_out']

type ClassificationVariant = {
  inventory_mode: string
}

function isAllowedValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value)
}

function validateProductClassification(
  payload: Pick<UpdateProductPayload, 'source_type' | 'sale_mode' | 'visibility' | 'status'>,
  ownerId: string | null,
  variants: ClassificationVariant[],
): string | null {
  if (!isAllowedValue(PRODUCT_SOURCE_TYPES, payload.source_type)) return 'Source type is invalid.'
  if (!isAllowedValue(PRODUCT_SALE_MODES, payload.sale_mode)) return 'Sale mode is invalid.'
  if (!isAllowedValue(PRODUCT_VISIBILITIES, payload.visibility)) return 'Visibility is invalid.'

  if (payload.source_type !== 'customer_ai' && ownerId) {
    return 'Sproutie-owned product types cannot have a customer owner.'
  }

  if (payload.source_type === 'customer_ai' && payload.visibility === 'public') {
    return 'Customer-generated products must stay private or unlisted until explicitly reviewed.'
  }

  if (payload.sale_mode === 'digital' && variants.some((variant) => variant.inventory_mode !== 'unlimited')) {
    return 'Digital products must use unlimited inventory mode for every variant.'
  }

  if (payload.sale_mode === 'stocked' && variants.some((variant) => variant.inventory_mode === 'unlimited')) {
    return 'Stocked products cannot use unlimited inventory mode.'
  }

  if (
    payload.source_type === 'customer_ai' &&
    payload.visibility === 'public' &&
    PUBLIC_CATALOG_STATUSES.includes(payload.status)
  ) {
    return 'Customer-generated products cannot appear in public listings until reviewed.'
  }

  return null
}

function validateVariantInventoryMode(
  saleMode: string,
  inventoryMode: VariantInventoryMode,
): string | null {
  if (!isAllowedValue(VARIANT_INVENTORY_MODES, inventoryMode)) return 'Inventory mode is invalid.'
  if (saleMode === 'digital' && inventoryMode !== 'unlimited') {
    return 'Digital products must use unlimited inventory mode.'
  }
  if (saleMode === 'stocked' && inventoryMode === 'unlimited') {
    return 'Stocked products cannot use unlimited inventory mode.'
  }
  return null
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const [
    { data: existingProduct, error: productError },
    { data: variants, error: variantsError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('owner_id, slug')
      .eq('id', id)
      .single(),
    supabase
      .from('product_variants')
      .select('inventory_mode')
      .eq('product_id', id),
  ])

  if (productError || !existingProduct) {
    if (productError) console.error('[admin] updateProduct load error:', productError.message)
    return { error: 'Could not load this product before saving. Please refresh and try again.' }
  }

  if (variantsError) {
    console.error('[admin] updateProduct variants error:', variantsError.message)
    return { error: 'Could not verify variant inventory modes. Please refresh and try again.' }
  }

  const classificationError = validateProductClassification(
    payload,
    existingProduct.owner_id,
    variants ?? [],
  )
  if (classificationError) return { error: classificationError }

  const { error } = await supabase
    .from('products')
    .update({
      name: payload.name,
      slug: payload.slug,
      short_description: payload.short_description,
      description: payload.description,
      status: payload.status,
      source_type: payload.source_type,
      sale_mode: payload.sale_mode,
      visibility: payload.visibility,
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
  revalidatePath(`/originals/${existingProduct.slug}`)
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

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('source_type, visibility')
    .eq('id', id)
    .single()

  if (productError || !product) {
    if (productError) console.error('[admin] updateProductStatus load error:', productError.message)
    return { error: 'Could not verify this product before changing status.' }
  }

  if (
    product.source_type === 'customer_ai' &&
    product.visibility === 'public' &&
    PUBLIC_CATALOG_STATUSES.includes(status)
  ) {
    return { error: 'Customer-generated products cannot appear in public listings until reviewed.' }
  }

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

export async function updateVariantInventoryMode(
  variantId: string,
  productId: string,
  productSlug: string,
  inventoryMode: VariantInventoryMode,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const [
    { data: product, error: productError },
    { data: variant, error: variantError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('sale_mode')
      .eq('id', productId)
      .single(),
    supabase
      .from('product_variants')
      .select('id, product_id')
      .eq('id', variantId)
      .eq('product_id', productId)
      .maybeSingle(),
  ])

  if (productError || !product) {
    if (productError) console.error('[admin] updateVariantInventoryMode product error:', productError.message)
    return { error: 'Could not verify this product before saving inventory mode.' }
  }

  if (variantError || !variant) {
    if (variantError) console.error('[admin] updateVariantInventoryMode variant error:', variantError.message)
    return { error: 'The selected variant does not belong to this product.' }
  }

  const validationError = validateVariantInventoryMode(product.sale_mode, inventoryMode)
  if (validationError) return { error: validationError }

  const { error } = await supabase
    .from('product_variants')
    .update({ inventory_mode: inventoryMode })
    .eq('id', variantId)
    .eq('product_id', productId)

  if (error) {
    console.error('[admin] updateVariantInventoryMode error:', error.message)
    return { error: 'Could not save inventory mode. Please try again.' }
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/originals/${productSlug}`)
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
  material_id: string | null
  waste_percentage: number
  verification_status: string
}

const VERIFICATION_STATUSES = ['estimated', 'sample_tested', 'production_ready'] as const

function validateKitItemPayload(payload: KitItemPayload): string | null {
  if (!payload.category.trim()) return 'Category is required.'
  if (!payload.item_name.trim()) return 'Item name is required.'
  if (!payload.unit.trim()) return 'Unit is required.'
  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
    return 'Quantity must be greater than zero.'
  }
  if (!Number.isFinite(payload.waste_percentage) || payload.waste_percentage < 0 || payload.waste_percentage > 100) {
    return 'Waste percentage must be between 0 and 100.'
  }
  if (!VERIFICATION_STATUSES.includes(payload.verification_status as typeof VERIFICATION_STATUSES[number])) {
    return 'Verification status is invalid.'
  }
  return null
}

function friendlyKitItemError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('row-level security')) return 'You do not have permission to change recipes.'
  if (lower.includes('foreign key')) return 'The selected variant or material is no longer available.'
  if (lower.includes('violates check constraint')) return 'One or more recipe values are outside the allowed range.'
  return 'Could not save the recipe item. Please check the fields and try again.'
}

async function validateVariantForProduct(
  productId: string,
  variantId: string | null,
): Promise<string | null> {
  if (!variantId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_variants')
    .select('product_id')
    .eq('id', variantId)
    .maybeSingle()

  if (error) {
    console.error('[admin] validateVariantForProduct error:', error.message)
    return 'Could not verify the selected variant. Please try again.'
  }

  if (!data || data.product_id !== productId) {
    return 'The selected variant does not belong to this product.'
  }

  return null
}

export async function upsertKitItem(
  productId: string,
  productSlug: string,
  payload: KitItemPayload,
  existingId?: string,
): Promise<{ error: string | null; item: DbKitItem | null }> {
  const validationError = validateKitItemPayload(payload)
  if (validationError) return { error: validationError, item: null }

  const variantError = await validateVariantForProduct(productId, payload.variant_id)
  if (variantError) return { error: variantError, item: null }

  const supabase = await createClient()

  const row = {
    product_id: productId,
    variant_id: payload.variant_id || null,
    material_id: payload.material_id || null,
    category: payload.category.trim(),
    item_name: payload.item_name.trim(),
    quantity: payload.quantity,
    unit: payload.unit.trim(),
    specification: payload.specification.trim() || null,
    is_optional: payload.is_optional,
    customer_visible: payload.customer_visible,
    sort_order: payload.sort_order,
    waste_percentage: payload.waste_percentage,
    verification_status: payload.verification_status,
  }

  let data: DbKitItem | null = null
  let error: { message: string } | null = null

  if (existingId) {
    const result = await supabase
      .from('product_kit_items')
      .update(row)
      .eq('id', existingId)
      .eq('product_id', productId)
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
    return { error: friendlyKitItemError(error.message), item: null }
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
    .eq('product_id', productId)

  if (error) {
    console.error('[admin] deleteKitItem error:', error.message)
    return { error: friendlyKitItemError(error.message) }
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
      .eq('id', id)
      .eq('product_id', productId),
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) {
    console.error('[admin] reorderKitItems error:', firstError.error.message)
    return { error: friendlyKitItemError(firstError.error.message) }
  }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/originals/${productSlug}`)
  return { error: null }
}
