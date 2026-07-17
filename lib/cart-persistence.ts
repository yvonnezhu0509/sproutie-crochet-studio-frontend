import type { SupabaseClient } from '@supabase/supabase-js'
import type { CartItem } from '@/lib/cart-model'
import type { Database, Json } from '@/lib/supabase/database.types'

type BrowserSupabaseClient = SupabaseClient<Database>

const PRODUCT_IMAGE_FALLBACK = '/placeholder.svg'

export async function loadAuthenticatedCart(
  supabase: BrowserSupabaseClient,
  userId: string,
): Promise<CartItem[]> {
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (cartError) {
    throw new Error(cartError.message)
  }

  if (!cart) return []

  const { data: lines, error: linesError } = await supabase
    .from('cart_items')
    .select(
      'line_key, product_id, variant_id, quantity, configuration, created_at',
    )
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true })

  if (linesError) {
    throw new Error(linesError.message)
  }

  if (!lines?.length) return []

  const productIds = [...new Set(lines.map((line) => line.product_id))]
  const variantIds = [...new Set(lines.map((line) => line.variant_id))]

  const [
    { data: products, error: productsError },
    { data: variants, error: variantsError },
    { data: images, error: imagesError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, base_price_cents')
      .in('id', productIds),
    supabase
      .from('product_variants')
      .select('id, product_id, variant_name, price_cents, is_active')
      .in('id', variantIds),
    supabase
      .from('product_images')
      .select('product_id, variant_id, image_url, sort_order, created_at')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  if (productsError) throw new Error(productsError.message)
  if (variantsError) throw new Error(variantsError.message)
  if (imagesError) throw new Error(imagesError.message)

  const productsById = new Map(
    (products ?? []).map((product) => [product.id, product]),
  )
  const variantsById = new Map(
    (variants ?? []).map((variant) => [variant.id, variant]),
  )

  return lines.flatMap((line): CartItem[] => {
    const product = productsById.get(line.product_id)
    const variant = variantsById.get(line.variant_id)

    if (
      !product ||
      !variant ||
      !variant.is_active ||
      variant.product_id !== product.id
    ) {
      return []
    }

    const productImages = (images ?? []).filter(
      (image) => image.product_id === product.id,
    )
    const variantImage = productImages.find(
      (image) => image.variant_id === variant.id,
    )
    const primaryImage = productImages[0]
    const configuration = readConfiguration(line.configuration)
    const priceCents =
      variant.price_cents > 0
        ? variant.price_cents
        : product.base_price_cents

    return [
      {
        id: line.line_key,
        productId: product.id,
        variantId: variant.id,
        variantName: variant.variant_name,
        name: product.name,
        slug: product.slug,
        image:
          variantImage?.image_url ??
          primaryImage?.image_url ??
          PRODUCT_IMAGE_FALLBACK,
        designId: readOptionalString(configuration.design_id),
        color: readOptionalString(configuration.color),
        size: readOptionalString(configuration.size),
        yarnOption: readOptionalString(configuration.yarn_option),
        accessories: readOptionalStringArray(configuration.accessories),
        quantity: line.quantity,
        unitPrice: priceCents / 100,
      },
    ]
  })
}

export async function replaceAuthenticatedCart(
  supabase: BrowserSupabaseClient,
  items: CartItem[],
): Promise<void> {
  const payload: Json = items.map((item) => {
    if (!item.variantId) {
      throw new Error(`Cart line ${item.id} does not have a product variant.`)
    }

    if (item.id.length < 1 || item.id.length > 255) {
      throw new Error('Cart line identifier must contain 1–255 characters.')
    }

    const configuration: Record<string, Json | undefined> = {
      design_id: item.designId,
      color: item.color,
      size: item.size,
      yarn_option: item.yarnOption,
      accessories: item.accessories,
    }

    return {
      product_id: item.productId,
      variant_id: item.variantId,
      line_key: item.id,
      quantity: Math.min(99, Math.max(1, Math.trunc(item.quantity))),
      configuration,
    }
  })

  const { error } = await supabase.rpc('replace_active_cart_items', {
    p_items: payload,
  })

  if (error) {
    throw new Error(error.message)
  }
}

function readConfiguration(
  value: Json,
): Record<string, Json | undefined> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
  }

  return {}
}

function readOptionalString(value: Json | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0
    ? value
    : undefined
}

function readOptionalStringArray(
  value: Json | undefined,
): string[] | undefined {
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === 'string')
  ) {
    return undefined
  }

  return value
}
