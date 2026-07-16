/**
 * Server-side catalog data layer.
 * All reads hit the Supabase `products` / `product_variants` / `product_images`
 * / `inventory` tables via the server client (RLS applies automatically).
 *
 * The shape mirrors the legacy `OriginalKit` type so existing UI components
 * can be swapped in incrementally.
 */

import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Database row types (mirrors DDL exactly)
// ---------------------------------------------------------------------------

export type ProductStatus = 'draft' | 'coming_soon' | 'active' | 'sold_out' | 'archived'
export type ProductSourceType = 'sproutie_original' | 'sproutie_ai' | 'customer_ai'
export type ProductSaleMode = 'stocked' | 'made_to_order' | 'digital'
export type ProductVisibility = 'public' | 'unlisted' | 'private'
export type VariantInventoryMode = 'assembled' | 'component_based' | 'unlimited'

export interface DbProduct {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  status: ProductStatus
  source_type: ProductSourceType
  sale_mode: ProductSaleMode
  visibility: ProductVisibility
  owner_id: string | null
  base_price_cents: number
  currency: string
  difficulty: string | null
  estimated_making_time: string | null
  is_featured: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DbVariant {
  id: string
  product_id: string
  sku: string | null
  variant_name: string
  option_values: Record<string, unknown>
  price_cents: number
  inventory_mode: VariantInventoryMode
  is_active: boolean
}

export interface DbImage {
  id: string
  product_id: string
  variant_id: string | null
  image_url: string
  alt_text: string | null
  sort_order: number
}

export interface DbInventory {
  variant_id: string
  quantity_on_hand: number
  quantity_reserved: number
  low_stock_threshold: number
  track_inventory: boolean
}

export interface DbKitItem {
  id: string
  product_id: string
  variant_id: string | null
  material_id: string | null
  category: string
  item_name: string
  quantity: number
  unit: string
  specification: string | null
  is_optional: boolean
  customer_visible: boolean
  sort_order: number
  waste_percentage: number
  verification_status: string
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Enriched catalog type (used by the frontend)
// ---------------------------------------------------------------------------

export interface CatalogKit {
  // Core identity
  id: string
  slug: string
  name: string
  tagline: string
  shortDescription: string
  description: string
  status: ProductStatus
  sourceType: ProductSourceType
  saleMode: ProductSaleMode
  visibility: ProductVisibility
  ownerId: string | null
  // Pricing
  priceCents: number
  price: number // dollars, for display convenience
  currency: string
  // Product details
  difficulty: string
  makingTime: string
  bagType: string
  construction: string
  constructionOverview: string
  dimensionsIn: string
  dimensionsCm: string
  // Content arrays (stored in metadata)
  kitContents: string[]
  toolsNotIncluded: string[]
  techniques: string[]
  customizationOptions: string[]
  careInstructions: string[]
  patternFormat: string
  availability: string
  // Images
  image: string   // primary image url
  gallery: string[]
  // Variants
  variants: DbVariant[]
  // Inventory (keyed by variant_id)
  inventory: Record<string, DbInventory>
  // Misc
  isFeatured: boolean
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function kitFromRow(
  product: DbProduct,
  variants: DbVariant[],
  images: DbImage[],
  inventoryRows: DbInventory[],
): CatalogKit {
  const meta = (product.metadata ?? {}) as Record<string, unknown>

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)
  const gallery = sortedImages.map((img) => img.image_url)

  const inventoryMap: Record<string, DbInventory> = {}
  for (const row of inventoryRows) {
    inventoryMap[row.variant_id] = row
  }

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: (meta.tagline as string) ?? '',
    shortDescription: product.short_description ?? '',
    description: product.description ?? '',
    status: product.status,
    sourceType: product.source_type,
    saleMode: product.sale_mode,
    visibility: product.visibility,
    ownerId: product.owner_id,
    priceCents: product.base_price_cents,
    price: product.base_price_cents / 100,
    currency: product.currency,
    difficulty: product.difficulty ?? '',
    makingTime: product.estimated_making_time ?? '',
    bagType: (meta.bagType as string) ?? '',
    construction: (meta.construction as string) ?? '',
    constructionOverview: (meta.constructionOverview as string) ?? '',
    dimensionsIn: (meta.dimensionsIn as string) ?? '',
    dimensionsCm: (meta.dimensionsCm as string) ?? '',
    kitContents: (meta.kitContents as string[]) ?? [],
    toolsNotIncluded: (meta.toolsNotIncluded as string[]) ?? [],
    techniques: (meta.techniques as string[]) ?? [],
    customizationOptions: (meta.customizationOptions as string[]) ?? [],
    careInstructions: (meta.careInstructions as string[]) ?? [],
    patternFormat: (meta.patternFormat as string) ?? '',
    availability: (meta.availability as string) ?? '',
    image: gallery[0] ?? '',
    gallery,
    variants,
    inventory: inventoryMap,
    isFeatured: product.is_featured,
  }
}

// ---------------------------------------------------------------------------
// Public query functions
// ---------------------------------------------------------------------------

/** Fetch all publicly visible kits (coming_soon | active | sold_out). */
export async function getAllKits(): Promise<CatalogKit[]> {
  const supabase = await createClient()

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .in('status', ['coming_soon', 'active', 'sold_out'])
    .eq('visibility', 'public')
    .order('created_at', { ascending: true })

  if (prodErr || !products?.length) {
    if (prodErr) console.error('[catalog] getAllKits products error:', prodErr.message)
    return []
  }

  const productIds = products.map((p) => p.id)

  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds)
      .eq('is_active', true),
    supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true }),
  ])

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*')
    .in('variant_id', (variants ?? []).map((v: { id: string }) => v.id))

  return products.map((product) =>
    kitFromRow(
      product as DbProduct,
      (variants ?? []).filter((v: { product_id: string }) => v.product_id === product.id) as DbVariant[],
      (images ?? []).filter((img: { product_id: string }) => img.product_id === product.id) as DbImage[],
      (inventory ?? []) as DbInventory[],
    ),
  )
}

/** Fetch a single kit by slug. RLS decides whether private rows are visible. */
export async function getKitBySlug(slug: string): Promise<CatalogKit | null> {
  const supabase = await createClient()

  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .in('status', ['coming_soon', 'active', 'sold_out'])
    .in('visibility', ['public', 'unlisted', 'private'])
    .single()

  if (prodErr || !product) {
    if (prodErr && prodErr.code !== 'PGRST116') {
      console.error('[catalog] getKitBySlug error:', prodErr.message)
    }
    return null
  }

  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .eq('is_active', true),
    supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
  ])

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*')
    .in('variant_id', (variants ?? []).map((v) => v.id))

  return kitFromRow(
    product as DbProduct,
    (variants ?? []) as DbVariant[],
    (images ?? []) as DbImage[],
    (inventory ?? []) as DbInventory[],
  )
}

/** Fetch featured kits only. */
export async function getFeaturedKits(): Promise<CatalogKit[]> {
  const supabase = await createClient()

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .in('status', ['coming_soon', 'active', 'sold_out'])
    .eq('visibility', 'public')
    .eq('is_featured', true)
    .order('created_at', { ascending: true })

  if (prodErr || !products?.length) {
    if (prodErr) console.error('[catalog] getFeaturedKits error:', prodErr.message)
    return []
  }

  const productIds = products.map((p) => p.id)

  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds)
      .eq('is_active', true),
    supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true }),
  ])

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*')
    .in('variant_id', (variants ?? []).map((v: { id: string }) => v.id))

  return products.map((product) =>
    kitFromRow(
      product as DbProduct,
      (variants ?? []).filter((v: { product_id: string }) => v.product_id === product.id) as DbVariant[],
      (images ?? []).filter((img: { product_id: string }) => img.product_id === product.id) as DbImage[],
      (inventory ?? []) as DbInventory[],
    ),
  )
}

/** Fetch kit items for a product (public: customer_visible only via RLS). */
export async function getKitItems(productId: string): Promise<DbKitItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_kit_items')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) {
    console.error('[catalog] getKitItems error:', error.message)
    return []
  }
  return (data ?? []) as DbKitItem[]
}

/** Fetch ALL kit items for a product regardless of customer_visible (admin use). */
export async function getKitItemsAdmin(productId: string): Promise<DbKitItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_kit_items')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) {
    console.error('[catalog] getKitItemsAdmin error:', error.message)
    return []
  }
  return (data ?? []) as DbKitItem[]
}

/** Fetch ALL products regardless of status (admin use). */
export async function getAllKitsAdmin(): Promise<CatalogKit[]> {
  const supabase = await createClient()

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true })

  if (prodErr || !products?.length) {
    if (prodErr) console.error('[catalog] getAllKitsAdmin error:', prodErr.message)
    return []
  }

  const productIds = products.map((p) => p.id)

  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds),
    supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true }),
  ])

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*')
    .in('variant_id', (variants ?? []).map((v: { id: string }) => v.id))

  return products.map((product) =>
    kitFromRow(
      product as DbProduct,
      (variants ?? []).filter((v: { product_id: string }) => v.product_id === product.id) as DbVariant[],
      (images ?? []).filter((img: { product_id: string }) => img.product_id === product.id) as DbImage[],
      (inventory ?? []) as DbInventory[],
    ),
  )
}
