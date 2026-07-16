'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type ProductImage = Database['public']['Tables']['product_images']['Row']

type ProductImageResult = {
  error: string | null
  uploadedCount?: number
}

type ProductRecord = {
  id: string
  slug: string
  name: string
}

const PRODUCT_IMAGES_BUCKET = 'product-images'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function friendlyImageError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('row-level security') || lower.includes('permission')) {
    return 'You do not have permission to change product images.'
  }
  if (lower.includes('bucket') || lower.includes('storage')) {
    return 'Product image storage is not available. Check the Supabase Storage bucket and policies.'
  }
  if (lower.includes('not found')) return 'The selected product image was not found.'
  return 'Could not update product images. Please try again.'
}

async function loadProduct(
  supabase: SupabaseServerClient,
  productId: string,
): Promise<{ product: ProductRecord | null; error: string | null }> {
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name')
    .eq('id', productId)
    .single()

  if (error || !data) {
    if (error) console.error('[admin] loadProduct image action error:', error.message)
    return { product: null, error: 'Could not verify this product before changing images.' }
  }

  return { product: data, error: null }
}

function revalidateProductImagePaths(product: ProductRecord) {
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${product.id}`)
  revalidatePath('/originals')
  revalidatePath(`/originals/${product.slug}`)
  revalidatePath('/')
}

function imageAltFallback(productName: string): string {
  return `${productName} product image`
}

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    return `${file.name || 'Image'} must be a JPEG, PNG, or WebP file.`
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name || 'Image'} must be 5 MB or smaller.`
  }
  return null
}

function storagePathForFile(productId: string, file: File): string {
  const extension = ALLOWED_IMAGE_TYPES[file.type] ?? 'bin'
  return `products/${productId}/${crypto.randomUUID()}.${extension}`
}

function managedStoragePathFromUrl(imageUrl: string, productId: string): string | null {
  try {
    const parsed = new URL(imageUrl)
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`
    const markerIndex = parsed.pathname.indexOf(marker)
    if (markerIndex === -1) return null

    const path = decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length))
    if (!path.startsWith(`products/${productId}/`)) return null
    if (path.includes('..') || path.startsWith('/')) return null
    return path
  } catch {
    return null
  }
}

async function fetchImages(
  supabase: SupabaseServerClient,
  productId: string,
): Promise<{ images: ProductImage[]; error: string | null }> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[admin] fetch product images error:', error.message)
    return { images: [], error: friendlyImageError(error.message) }
  }

  return { images: (data ?? []) as ProductImage[], error: null }
}

async function normalizeImageOrder(
  supabase: SupabaseServerClient,
  productId: string,
  images: ProductImage[],
): Promise<string | null> {
  const updates = images.map((image, index) =>
    supabase
      .from('product_images')
      .update({ sort_order: index })
      .eq('id', image.id)
      .eq('product_id', productId),
  )

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)
  if (failed?.error) {
    console.error('[admin] normalize product image order error:', failed.error.message)
    return friendlyImageError(failed.error.message)
  }

  return null
}

export async function uploadProductImages(
  productId: string,
  formData: FormData,
): Promise<ProductImageResult> {
  const supabase = await createClient()
  const { product, error: productError } = await loadProduct(supabase, productId)
  if (productError || !product) return { error: productError ?? 'Product was not found.' }

  const files = formData
    .getAll('files')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  if (files.length === 0) return { error: 'Choose at least one image to upload.' }

  const { images: existingImages, error: imagesError } = await fetchImages(supabase, productId)
  if (imagesError) return { error: imagesError }

  const failures: string[] = []
  let nextSortOrder = existingImages.length
  let uploadedCount = 0

  for (const file of files) {
    const validationError = validateImageFile(file)
    if (validationError) {
      failures.push(validationError)
      continue
    }

    const path = storagePathForFile(productId, file)
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[admin] product image upload error:', uploadError.message)
      failures.push(`${file.name || 'Image'} could not be uploaded.`)
      continue
    }

    const { data: publicUrlData } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(path)

    const { error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url: publicUrlData.publicUrl,
        alt_text: imageAltFallback(product.name),
        sort_order: nextSortOrder,
      })

    if (insertError) {
      console.error('[admin] product image row insert error:', insertError.message)
      const { error: cleanupError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .remove([path])
      if (cleanupError) {
        console.error('[admin] product image upload cleanup error:', cleanupError.message)
      }
      failures.push(`${file.name || 'Image'} uploaded but could not be attached to the product.`)
      continue
    }

    uploadedCount += 1
    nextSortOrder += 1
  }

  revalidateProductImagePaths(product)

  if (failures.length > 0) {
    const prefix = uploadedCount > 0 ? `${uploadedCount} image${uploadedCount === 1 ? '' : 's'} uploaded. ` : ''
    return { error: `${prefix}${failures.join(' ')}`, uploadedCount }
  }

  return { error: null, uploadedCount }
}

export async function updateProductImageAltText(
  productId: string,
  imageId: string,
  altText: string,
): Promise<ProductImageResult> {
  const supabase = await createClient()
  const { product, error: productError } = await loadProduct(supabase, productId)
  if (productError || !product) return { error: productError ?? 'Product was not found.' }

  const normalizedAlt = altText.trim() || imageAltFallback(product.name)
  const { error } = await supabase
    .from('product_images')
    .update({ alt_text: normalizedAlt })
    .eq('id', imageId)
    .eq('product_id', productId)

  if (error) {
    console.error('[admin] update product image alt text error:', error.message)
    return { error: friendlyImageError(error.message) }
  }

  revalidateProductImagePaths(product)
  return { error: null }
}

export async function setPrimaryProductImage(
  productId: string,
  imageId: string,
): Promise<ProductImageResult> {
  const supabase = await createClient()
  const { product, error: productError } = await loadProduct(supabase, productId)
  if (productError || !product) return { error: productError ?? 'Product was not found.' }

  const { images, error: imagesError } = await fetchImages(supabase, productId)
  if (imagesError) return { error: imagesError }

  const target = images.find((image) => image.id === imageId)
  if (!target) return { error: 'The selected image does not belong to this product.' }

  const reordered = [target, ...images.filter((image) => image.id !== imageId)]
  const orderError = await normalizeImageOrder(supabase, productId, reordered)
  if (orderError) return { error: orderError }

  revalidateProductImagePaths(product)
  return { error: null }
}

export async function moveProductImage(
  productId: string,
  imageId: string,
  direction: 'up' | 'down',
): Promise<ProductImageResult> {
  const supabase = await createClient()
  const { product, error: productError } = await loadProduct(supabase, productId)
  if (productError || !product) return { error: productError ?? 'Product was not found.' }

  const { images, error: imagesError } = await fetchImages(supabase, productId)
  if (imagesError) return { error: imagesError }

  const index = images.findIndex((image) => image.id === imageId)
  if (index === -1) return { error: 'The selected image does not belong to this product.' }

  const nextIndex = direction === 'up' ? index - 1 : index + 1
  if (nextIndex < 0 || nextIndex >= images.length) return { error: null }

  const reordered = [...images]
  const current = reordered[index]
  const next = reordered[nextIndex]
  reordered[index] = next
  reordered[nextIndex] = current

  const orderError = await normalizeImageOrder(supabase, productId, reordered)
  if (orderError) return { error: orderError }

  revalidateProductImagePaths(product)
  return { error: null }
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<ProductImageResult> {
  const supabase = await createClient()
  const { product, error: productError } = await loadProduct(supabase, productId)
  if (productError || !product) return { error: productError ?? 'Product was not found.' }

  const { images, error: imagesError } = await fetchImages(supabase, productId)
  if (imagesError) return { error: imagesError }

  const image = images.find((item) => item.id === imageId)
  if (!image) return { error: 'The selected image does not belong to this product.' }

  const managedStoragePath = managedStoragePathFromUrl(image.image_url, productId)
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)
    .eq('product_id', productId)

  if (deleteError) {
    console.error('[admin] delete product image row error:', deleteError.message)
    return { error: friendlyImageError(deleteError.message) }
  }

  const remainingImages = images.filter((item) => item.id !== imageId)
  const orderError = await normalizeImageOrder(supabase, productId, remainingImages)

  if (managedStoragePath) {
    const { error: storageDeleteError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([managedStoragePath])

    if (storageDeleteError) {
      console.error('[admin] delete product image storage object error:', storageDeleteError.message)
      revalidateProductImagePaths(product)
      return {
        error: 'The image was removed from the product, but the managed Storage object could not be cleaned up.',
      }
    }
  }

  revalidateProductImagePaths(product)
  if (orderError) return { error: orderError }
  return { error: null }
}
