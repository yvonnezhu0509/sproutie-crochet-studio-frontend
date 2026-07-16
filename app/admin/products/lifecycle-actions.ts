'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ProductStatus } from '@/lib/catalog'

type LifecycleResult = {
  error: string | null
}

type DeleteProductResult = LifecycleResult & {
  deleted: boolean
}

type ProductRecord = {
  id: string
  name: string
  slug: string
  status: ProductStatus
}

const PRODUCT_IMAGES_BUCKET = 'product-images'

function revalidateProductPaths(product: ProductRecord) {
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${product.id}`)
  revalidatePath('/originals')
  revalidatePath(`/originals/${product.slug}`)
  revalidatePath('/')
}

function friendlyLifecycleError(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('row-level security') || lower.includes('permission')) {
    return 'You do not have permission to change this product.'
  }

  if (lower.includes('foreign key')) {
    return 'This product has inventory movement history and cannot be permanently deleted. Archive it instead.'
  }

  return 'Could not update the product lifecycle. Please try again.'
}

function managedStoragePathFromUrl(
  imageUrl: string,
  productId: string,
): string | null {
  try {
    const parsed = new URL(imageUrl)
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`
    const markerIndex = parsed.pathname.indexOf(marker)

    if (markerIndex === -1) return null

    const path = decodeURIComponent(
      parsed.pathname.slice(markerIndex + marker.length),
    )

    if (!path.startsWith(`products/${productId}/`)) return null
    if (path.includes('..') || path.startsWith('/')) return null

    return path
  } catch {
    return null
  }
}

async function loadProduct(
  productId: string,
): Promise<{ product: ProductRecord | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, status')
    .eq('id', productId)
    .single()

  if (error || !data) {
    if (error) {
      console.error('[admin] loadProduct lifecycle error:', error.message)
    }

    return {
      product: null,
      error: 'Could not verify this product.',
    }
  }

  return {
    product: data as ProductRecord,
    error: null,
  }
}

export async function archiveProduct(
  productId: string,
): Promise<LifecycleResult> {
  const { product, error: loadError } = await loadProduct(productId)
  if (loadError || !product) {
    return { error: loadError ?? 'Product was not found.' }
  }

  if (product.status === 'archived') {
    return { error: null }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ status: 'archived' })
    .eq('id', productId)

  if (error) {
    console.error('[admin] archiveProduct error:', error.message)
    return { error: friendlyLifecycleError(error.message) }
  }

  revalidateProductPaths(product)
  return { error: null }
}

export async function restoreProductToDraft(
  productId: string,
): Promise<LifecycleResult> {
  const { product, error: loadError } = await loadProduct(productId)
  if (loadError || !product) {
    return { error: loadError ?? 'Product was not found.' }
  }

  if (product.status === 'draft') {
    return { error: null }
  }

  if (product.status !== 'archived') {
    return {
      error: 'Only archived products can be restored through this action.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ status: 'draft' })
    .eq('id', productId)

  if (error) {
    console.error('[admin] restoreProductToDraft error:', error.message)
    return { error: friendlyLifecycleError(error.message) }
  }

  revalidateProductPaths(product)
  return { error: null }
}

export async function deleteProductPermanently(
  productId: string,
): Promise<DeleteProductResult> {
  const { product, error: loadError } = await loadProduct(productId)
  if (loadError || !product) {
    return {
      error: loadError ?? 'Product was not found.',
      deleted: false,
    }
  }

  if (product.status !== 'draft' && product.status !== 'archived') {
    return {
      error: 'Only draft or archived products can be permanently deleted.',
      deleted: false,
    }
  }

  const supabase = await createClient()

  const [
    { data: variants, error: variantsError },
    { data: images, error: imagesError },
  ] = await Promise.all([
    supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId),
    supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId),
  ])

  if (variantsError || imagesError) {
    if (variantsError) {
      console.error(
        '[admin] deleteProduct variants error:',
        variantsError.message,
      )
    }
    if (imagesError) {
      console.error('[admin] deleteProduct images error:', imagesError.message)
    }

    return {
      error: 'Could not verify whether this product can be safely deleted.',
      deleted: false,
    }
  }

  const variantIds = (variants ?? []).map((variant) => variant.id)

  if (variantIds.length > 0) {
    const { data: movement, error: movementError } = await supabase
      .from('inventory_movements')
      .select('id')
      .in('variant_id', variantIds)
      .limit(1)
      .maybeSingle()

    if (movementError) {
      console.error(
        '[admin] deleteProduct movement check error:',
        movementError.message,
      )
      return {
        error: 'Could not verify this product’s inventory history.',
        deleted: false,
      }
    }

    if (movement) {
      return {
        error:
          'This product has inventory movement history and cannot be permanently deleted. Archive it instead.',
        deleted: false,
      }
    }
  }

  const storagePaths = Array.from(
    new Set(
      (images ?? [])
        .map((image) =>
          managedStoragePathFromUrl(image.image_url, productId),
        )
        .filter((path): path is string => Boolean(path)),
    ),
  )

  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (deleteError) {
    console.error('[admin] deleteProduct row error:', deleteError.message)
    return {
      error: friendlyLifecycleError(deleteError.message),
      deleted: false,
    }
  }

  revalidateProductPaths(product)

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(storagePaths)

    if (storageError) {
      console.error(
        '[admin] deleteProduct storage cleanup error:',
        storageError.message,
      )
      return {
        error:
          'The product was deleted, but some managed image files could not be removed from Storage.',
        deleted: true,
      }
    }
  }

  return { error: null, deleted: true }
}
