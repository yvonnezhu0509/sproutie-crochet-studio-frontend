'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ProductSaleMode,
  ProductSourceType,
  ProductStatus,
  ProductVisibility,
  VariantInventoryMode,
  DbImage,
  DbInventory,
  DbKitItem,
  DbProduct,
  DbVariant,
} from '@/lib/catalog'
import {
  evaluateProductPublicationReadiness,
  type PublicationStatus,
} from '@/lib/product-publication-readiness'

export interface ProductMetadataPayload {
  tagline: string
  bagType: string
  construction: string
  constructionOverview: string
  dimensionsIn: string
  dimensionsCm: string
  toolsNotIncluded: string[]
  techniques: string[]
  customizationOptions: string[]
  careInstructions: string[]
  patternFormat: string
  availability: string
}

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
  metadata?: ProductMetadataPayload
}

export interface CreateProductPayload {
  name: string
  slug: string
  source_type: ProductSourceType
  sale_mode: ProductSaleMode
  visibility: ProductVisibility
}

export interface CreateProductResult {
  error: string | null
  productId: string | null
}

const PRODUCT_SOURCE_TYPES = ['sproutie_original', 'sproutie_ai', 'customer_ai'] as const
const PRODUCT_SALE_MODES = ['stocked', 'made_to_order', 'digital'] as const
const PRODUCT_VISIBILITIES = ['public', 'unlisted', 'private'] as const
const VARIANT_INVENTORY_MODES = ['assembled', 'component_based', 'unlimited'] as const
const PUBLIC_CATALOG_STATUSES: ProductStatus[] = ['coming_soon', 'active', 'sold_out']

function isPublicationStatus(status: ProductStatus): status is PublicationStatus {
  return PUBLIC_CATALOG_STATUSES.includes(status)
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type ClassificationVariant = {
  inventory_mode: string
}

export interface ProductVariantPayload {
  variant_name: string
  sku: string
  price_cents: number
  inventory_mode: VariantInventoryMode
  is_active: boolean
  option_values: Record<string, string>
  low_stock_threshold: number
}

function isAllowedValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value)
}

function metadataRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function normalizeMetadataList(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  )
}

function normalizeProductMetadata(
  metadata: ProductMetadataPayload,
): ProductMetadataPayload {
  return {
    tagline: metadata.tagline.trim(),
    bagType: metadata.bagType.trim(),
    construction: metadata.construction.trim(),
    constructionOverview: metadata.constructionOverview.trim(),
    dimensionsIn: metadata.dimensionsIn.trim(),
    dimensionsCm: metadata.dimensionsCm.trim(),
    toolsNotIncluded: normalizeMetadataList(metadata.toolsNotIncluded),
    techniques: normalizeMetadataList(metadata.techniques),
    customizationOptions: normalizeMetadataList(metadata.customizationOptions),
    careInstructions: normalizeMetadataList(metadata.careInstructions),
    patternFormat: metadata.patternFormat.trim(),
    availability: metadata.availability.trim(),
  }
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

function normalizeOptionValues(
  optionValues: Record<string, string>,
): { values: Record<string, string>; error: string | null } {
  const values: Record<string, string> = {}

  for (const [rawKey, rawValue] of Object.entries(optionValues)) {
    const key = rawKey.trim()
    const value = String(rawValue ?? '').trim()

    if (!key && !value) continue
    if (!key || !value) {
      return { values: {}, error: 'Each option needs both a label and a value.' }
    }
    if (values[key]) return { values: {}, error: `Option "${key}" is duplicated.` }
    values[key] = value
  }

  return { values, error: null }
}

function validateVariantPayload(
  payload: ProductVariantPayload,
): { error: string | null; optionValues: Record<string, string> } {
  if (!payload.variant_name.trim()) return { error: 'Variant name is required.', optionValues: {} }
  if (!payload.sku.trim()) return { error: 'SKU is required.', optionValues: {} }
  if (!Number.isFinite(payload.price_cents) || payload.price_cents < 0) {
    return { error: 'Price cannot be negative.', optionValues: {} }
  }
  if (!Number.isInteger(payload.price_cents)) {
    return { error: 'Price must be saved as whole cents.', optionValues: {} }
  }
  if (!Number.isFinite(payload.low_stock_threshold) || payload.low_stock_threshold < 0) {
    return { error: 'Low-stock threshold cannot be negative.', optionValues: {} }
  }
  if (!Number.isInteger(payload.low_stock_threshold)) {
    return { error: 'Low-stock threshold must be a whole number.', optionValues: {} }
  }

  const { values, error } = normalizeOptionValues(payload.option_values)
  return { error, optionValues: values }
}

function friendlyVariantError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('row-level security')) return 'You do not have permission to change variants.'
  if (lower.includes('duplicate') || lower.includes('unique')) return 'That SKU is already in use.'
  if (lower.includes('foreign key')) return 'The selected product or variant is no longer available.'
  if (lower.includes('violates check constraint')) return 'One or more variant values are outside the allowed range.'
  return 'Could not save the variant. Please check the fields and try again.'
}

async function skuIsAlreadyUsed(
  supabase: SupabaseServerClient,
  sku: string,
  existingVariantId?: string,
): Promise<{ used: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id')
    .eq('sku', sku)
    .limit(1)

  if (error) {
    console.error('[admin] skuIsAlreadyUsed error:', error.message)
    return { used: false, error: 'Could not verify SKU uniqueness. Please try again.' }
  }

  return {
    used: (data ?? []).some((variant) => variant.id !== existingVariantId),
    error: null,
  }
}

async function ensureAssembledInventoryRow(
  supabase: SupabaseServerClient,
  variantId: string,
  lowStockThreshold: number,
): Promise<string | null> {
  const { data: existing, error: loadError } = await supabase
    .from('inventory')
    .select('variant_id')
    .eq('variant_id', variantId)
    .maybeSingle()

  if (loadError) {
    console.error('[admin] ensureAssembledInventoryRow load error:', loadError.message)
    return 'Could not verify the assembled inventory row.'
  }

  if (existing) {
    const { error } = await supabase
      .from('inventory')
      .update({
        low_stock_threshold: lowStockThreshold,
        track_inventory: true,
      })
      .eq('variant_id', variantId)

    if (error) {
      console.error('[admin] ensureAssembledInventoryRow update error:', error.message)
      return 'Could not update assembled inventory tracking.'
    }
    return null
  }

  const { error } = await supabase
    .from('inventory')
    .insert({
      variant_id: variantId,
      quantity_on_hand: 0,
      quantity_reserved: 0,
      low_stock_threshold: lowStockThreshold,
      track_inventory: true,
    })

  if (error) {
    console.error('[admin] ensureAssembledInventoryRow insert error:', error.message)
    return 'Could not initialize assembled inventory for this variant.'
  }

  return null
}

async function disableInventoryTracking(
  supabase: SupabaseServerClient,
  variantId: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('inventory')
    .update({ track_inventory: false })
    .eq('variant_id', variantId)

  if (error) {
    console.error('[admin] disableInventoryTracking error:', error.message)
    return 'Could not turn off assembled inventory tracking.'
  }

  return null
}

function friendlyProductError(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('row-level security')) {
    return 'You do not have permission to create products.'
  }

  if (
    lower.includes('products_slug_key') ||
    lower.includes('duplicate') ||
    lower.includes('unique')
  ) {
    return 'A product with that slug already exists.'
  }

  if (lower.includes('violates check constraint')) {
    return 'One or more product values are outside the allowed range.'
  }

  return 'Could not create the product. Please check the fields and try again.'
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<CreateProductResult> {
  const name = payload.name.trim()
  const slug = payload.slug.trim().toLowerCase()

  if (!name) {
    return { error: 'Product name is required.', productId: null }
  }

  if (!slug) {
    return { error: 'Product slug is required.', productId: null }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      error: 'Slug may contain only lowercase letters, numbers, and single hyphens.',
      productId: null,
    }
  }

  const classificationError = validateProductClassification(
    {
      source_type: payload.source_type,
      sale_mode: payload.sale_mode,
      visibility: payload.visibility,
      status: 'draft',
    },
    null,
    [],
  )

  if (classificationError) {
    return { error: classificationError, productId: null }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      slug,
      status: 'draft',
      source_type: payload.source_type,
      sale_mode: payload.sale_mode,
      visibility: payload.visibility,
      base_price_cents: 0,
      currency: 'USD',
      metadata: {},
    })
    .select('id')
    .single()

  if (error || !data) {
    if (error) {
      console.error('[admin] createProduct error:', error.message)
    }

    return {
      error: error
        ? friendlyProductError(error.message)
        : 'Could not create the product.',
      productId: null,
    }
  }

  revalidatePath('/admin/products')
  revalidatePath('/admin')

  return { error: null, productId: data.id }
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
      .select('owner_id, slug, status, visibility, metadata')
      .eq('id', id)
      .single(),
    supabase
      .from('product_variants')
      .select('*')
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

  const currentStatus = existingProduct.status as ProductStatus
  const updatedMetadata = payload.metadata
    ? {
        ...metadataRecord(existingProduct.metadata),
        ...normalizeProductMetadata(payload.metadata),
      }
    : existingProduct.metadata

  const isBecomingPublic =
    existingProduct.visibility !== 'public' &&
    payload.visibility === 'public'

  if (isBecomingPublic && isPublicationStatus(currentStatus)) {
    const variantRows = (variants ?? []) as DbVariant[]
    const variantIds = variantRows.map((variant) => variant.id)

    const [
      { data: images, error: imagesError },
      { data: kitItems, error: kitItemsError },
    ] = await Promise.all([
      supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id),
      supabase
        .from('product_kit_items')
        .select('*')
        .eq('product_id', id),
    ])

    if (imagesError || kitItemsError) {
      if (imagesError) {
        console.error('[admin] visibility readiness images error:', imagesError.message)
      }
      if (kitItemsError) {
        console.error('[admin] visibility readiness kit items error:', kitItemsError.message)
      }

      return {
        error: 'Could not complete the publication readiness checks. Please try again.',
      }
    }

    let inventoryRows: DbInventory[] = []

    if (variantIds.length > 0) {
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .in('variant_id', variantIds)

      if (inventoryError) {
        console.error('[admin] visibility readiness inventory error:', inventoryError.message)
        return {
          error: 'Could not complete the publication readiness checks. Please try again.',
        }
      }

      inventoryRows = (inventory ?? []) as DbInventory[]
    }

    const readiness = evaluateProductPublicationReadiness({
      targetStatus: currentStatus,
      product: {
        name: payload.name,
        slug: payload.slug,
        short_description: payload.short_description,
        description: payload.description,
        base_price_cents: payload.base_price_cents,
        difficulty: payload.difficulty,
        estimated_making_time: payload.estimated_making_time,
        sale_mode: payload.sale_mode,
      },
      metadata: metadataRecord(updatedMetadata),
      variants: variantRows,
      images: (images ?? []) as DbImage[],
      inventory: inventoryRows,
      kitItems: (kitItems ?? []) as DbKitItem[],
    })

    if (!readiness.ready) {
      return {
        error: `This product is not ready to become public: ${readiness.blockers
          .map((check) => check.description)
          .join(' ')}`,
      }
    }
  }

  const { error } = await supabase
    .from('products')
    .update({
      name: payload.name,
      slug: payload.slug,
      short_description: payload.short_description,
      description: payload.description,
      source_type: payload.source_type,
      sale_mode: payload.sale_mode,
      visibility: payload.visibility,
      base_price_cents: payload.base_price_cents,
      difficulty: payload.difficulty,
      estimated_making_time: payload.estimated_making_time,
      is_featured: payload.is_featured,
      metadata: updatedMetadata,
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

  const [
    { data: product, error: productError },
    { data: variants, error: variantsError },
    { data: images, error: imagesError },
    { data: kitItems, error: kitItemsError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id),
    supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id),
    supabase
      .from('product_kit_items')
      .select('*')
      .eq('product_id', id),
  ])

  if (productError || !product) {
    if (productError) {
      console.error('[admin] updateProductStatus load error:', productError.message)
    }
    return { error: 'Could not verify this product before changing status.' }
  }

  if (product.status === status) {
    return { error: null }
  }

  if (
    product.source_type === 'customer_ai' &&
    product.visibility === 'public' &&
    PUBLIC_CATALOG_STATUSES.includes(status)
  ) {
    return {
      error: 'Customer-generated products cannot appear in public listings until reviewed.',
    }
  }

  if (isPublicationStatus(status) && product.visibility === 'public') {
    if (variantsError || imagesError || kitItemsError) {
      if (variantsError) {
        console.error('[admin] readiness variants error:', variantsError.message)
      }
      if (imagesError) {
        console.error('[admin] readiness images error:', imagesError.message)
      }
      if (kitItemsError) {
        console.error('[admin] readiness kit items error:', kitItemsError.message)
      }

      return {
        error: 'Could not complete the publication readiness checks. Please try again.',
      }
    }

    const variantRows = (variants ?? []) as DbVariant[]
    const variantIds = variantRows.map((variant) => variant.id)

    let inventoryRows: DbInventory[] = []

    if (variantIds.length > 0) {
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .in('variant_id', variantIds)

      if (inventoryError) {
        console.error('[admin] readiness inventory error:', inventoryError.message)
        return {
          error: 'Could not complete the publication readiness checks. Please try again.',
        }
      }

      inventoryRows = (inventory ?? []) as DbInventory[]
    }

    const readiness = evaluateProductPublicationReadiness({
      targetStatus: status,
      product: product as DbProduct,
      metadata: metadataRecord(product.metadata),
      variants: variantRows,
      images: (images ?? []) as DbImage[],
      inventory: inventoryRows,
      kitItems: (kitItems ?? []) as DbKitItem[],
    })

    if (!readiness.ready) {
      return {
        error: `This product is not ready to publish: ${readiness.blockers
          .map((check) => check.description)
          .join(' ')}`,
      }
    }
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

export async function createProductVariant(
  productId: string,
  productSlug: string,
  payload: ProductVariantPayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const sku = payload.sku.trim()
  const variantName = payload.variant_name.trim()
  const payloadValidation = validateVariantPayload(payload)
  if (payloadValidation.error) return { error: payloadValidation.error }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, sale_mode')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    if (productError) console.error('[admin] createProductVariant product error:', productError.message)
    return { error: 'Could not verify this product before creating a variant.' }
  }

  const modeError = validateVariantInventoryMode(product.sale_mode, payload.inventory_mode)
  if (modeError) return { error: modeError }

  const skuCheck = await skuIsAlreadyUsed(supabase, sku)
  if (skuCheck.error) return { error: skuCheck.error }
  if (skuCheck.used) return { error: 'That SKU is already in use.' }

  const shouldInitializeInventory = payload.inventory_mode === 'assembled'

  const { data: variant, error: insertError } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      sku,
      variant_name: variantName,
      option_values: payloadValidation.optionValues,
      price_cents: payload.price_cents,
      inventory_mode: payload.inventory_mode,
      is_active: shouldInitializeInventory ? false : payload.is_active,
    })
    .select('id')
    .single()

  if (insertError || !variant) {
    if (insertError) console.error('[admin] createProductVariant insert error:', insertError.message)
    return { error: insertError ? friendlyVariantError(insertError.message) : 'Could not create the variant.' }
  }

  if (shouldInitializeInventory) {
    const inventoryError = await ensureAssembledInventoryRow(
      supabase,
      variant.id,
      payload.low_stock_threshold,
    )

    if (inventoryError) {
      const { error: cleanupError } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variant.id)
        .eq('product_id', productId)

      if (cleanupError) {
        console.error('[admin] createProductVariant cleanup delete error:', cleanupError.message)
        revalidatePath(`/admin/products/${productId}`)
        return {
          error: `${inventoryError} Cleanup also failed, so an incomplete inactive variant may require admin attention.`,
        }
      }

      revalidatePath(`/admin/products/${productId}`)
      return {
        error: `${inventoryError} The variant was not created.`,
      }
    }

    if (payload.is_active) {
      const { error: activateError } = await supabase
        .from('product_variants')
        .update({ is_active: true })
        .eq('id', variant.id)
        .eq('product_id', productId)

      if (activateError) {
        console.error('[admin] createProductVariant activate error:', activateError.message)
        revalidatePath(`/admin/products/${productId}`)
        return { error: 'The variant was created with inventory tracking but could not be activated.' }
      }
    }
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/originals/${productSlug}`)
  revalidatePath('/')
  return { error: null }
}

export async function updateProductVariant(
  productId: string,
  productSlug: string,
  variantId: string,
  payload: ProductVariantPayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const sku = payload.sku.trim()
  const variantName = payload.variant_name.trim()
  const payloadValidation = validateVariantPayload(payload)
  if (payloadValidation.error) return { error: payloadValidation.error }

  const [
    { data: product, error: productError },
    { data: variant, error: variantError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, sale_mode')
      .eq('id', productId)
      .single(),
    supabase
      .from('product_variants')
      .select('id, product_id, inventory_mode, is_active')
      .eq('id', variantId)
      .eq('product_id', productId)
      .maybeSingle(),
  ])

  if (productError || !product) {
    if (productError) console.error('[admin] updateProductVariant product error:', productError.message)
    return { error: 'Could not verify this product before saving the variant.' }
  }

  if (variantError || !variant) {
    if (variantError) console.error('[admin] updateProductVariant variant error:', variantError.message)
    return { error: 'The selected variant does not belong to this product.' }
  }

  const modeError = validateVariantInventoryMode(product.sale_mode, payload.inventory_mode)
  if (modeError) return { error: modeError }

  const skuCheck = await skuIsAlreadyUsed(supabase, sku, variantId)
  if (skuCheck.error) return { error: skuCheck.error }
  if (skuCheck.used) return { error: 'That SKU is already in use.' }

  if (payload.inventory_mode === 'assembled') {
    const inventoryError = await ensureAssembledInventoryRow(
      supabase,
      variantId,
      payload.low_stock_threshold,
    )
    if (inventoryError) return { error: inventoryError }
  } else if (variant.inventory_mode === 'assembled') {
    const trackingError = await disableInventoryTracking(supabase, variantId)
    if (trackingError) return { error: trackingError }
  }

  const { error } = await supabase
    .from('product_variants')
    .update({
      sku,
      variant_name: variantName,
      option_values: payloadValidation.optionValues,
      price_cents: payload.price_cents,
      inventory_mode: payload.inventory_mode,
      is_active: payload.is_active,
    })
    .eq('id', variantId)
    .eq('product_id', productId)

  if (error) {
    console.error('[admin] updateProductVariant error:', error.message)
    if (payload.inventory_mode === 'assembled' && variant.inventory_mode !== 'assembled') {
      await disableInventoryTracking(supabase, variantId)
    }
    if (payload.inventory_mode !== 'assembled' && variant.inventory_mode === 'assembled') {
      await ensureAssembledInventoryRow(supabase, variantId, payload.low_stock_threshold)
    }
    return { error: friendlyVariantError(error.message) }
  }

  if (payload.inventory_mode !== 'assembled' && variant.inventory_mode !== 'assembled') {
    await disableInventoryTracking(supabase, variantId)
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/originals/${productSlug}`)
  revalidatePath('/')
  return { error: null }
}

export async function deleteProductVariant(
  productId: string,
  productSlug: string,
  variantId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .select('id, is_active')
    .eq('id', variantId)
    .eq('product_id', productId)
    .maybeSingle()

  if (variantError || !variant) {
    if (variantError) {
      console.error('[admin] deleteProductVariant load error:', variantError.message)
    }
    return { error: 'The selected variant does not belong to this product.' }
  }

  if (variant.is_active) {
    return { error: 'Deactivate this variant before permanently deleting it.' }
  }

  const { data: movement, error: movementError } = await supabase
    .from('inventory_movements')
    .select('id')
    .eq('variant_id', variantId)
    .limit(1)
    .maybeSingle()

  if (movementError) {
    console.error('[admin] deleteProductVariant movement check error:', movementError.message)
    return { error: 'Could not verify this variant’s inventory history.' }
  }

  if (movement) {
    return {
      error: 'This variant has inventory movement history and cannot be permanently deleted.',
    }
  }

  const { error: deleteError } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', variantId)
    .eq('product_id', productId)

  if (deleteError) {
    console.error('[admin] deleteProductVariant delete error:', deleteError.message)
    return { error: friendlyVariantError(deleteError.message) }
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
