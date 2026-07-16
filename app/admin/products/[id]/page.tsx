import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { DbVariant, DbInventory, ProductSaleMode, ProductSourceType, ProductVisibility } from '@/lib/catalog'
import { getKitItemsAdmin } from '@/lib/catalog'
import { ProductEditForm } from '@/components/admin/product-edit-form'
import { KitContentsEditor } from '@/components/admin/kit-contents-editor'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name').eq('id', id).single()
  return { title: data?.name ? `Edit: ${data.name}` : 'Edit product' }
}

export default async function AdminProductDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()

  const [
    { data: product },
    { data: variants },
    { data: images },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('product_variants').select('*').eq('product_id', id),
    supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
  ])

  if (!product) notFound()

  const variantIds = (variants ?? []).map((v) => v.id)
  const [{ data: inventory }, { data: materials }, kitItems] = await Promise.all([
    supabase.from('inventory').select('*').in('variant_id', variantIds),
    supabase
      .from('materials')
      .select('*')
      .order('active', { ascending: false })
      .order('name', { ascending: true }),
    getKitItemsAdmin(id),
  ])

  // Build a CatalogKit shape to pass into the form
  const sortedImages = [...(images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const gallery = sortedImages.map((img: { image_url: string }) => img.image_url)
  const meta = (product.metadata ?? {}) as Record<string, unknown>
  const inventoryMap: Record<string, DbInventory> = {}
  for (const row of (inventory ?? [])) {
    inventoryMap[row.variant_id] = row as DbInventory
  }

  const kit = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: (meta.tagline as string) ?? '',
    shortDescription: product.short_description ?? '',
    description: product.description ?? '',
    status: product.status,
    sourceType: product.source_type as ProductSourceType,
    saleMode: product.sale_mode as ProductSaleMode,
    visibility: product.visibility as ProductVisibility,
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
    variants: (variants ?? []) as DbVariant[],
    inventory: inventoryMap,
    isFeatured: product.is_featured,
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Products
        </Link>
      </nav>

      <h1 className="font-heading text-2xl font-semibold">{product.name}</h1>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{product.id}</p>

      <div className="mt-8 flex flex-col gap-8">
        <ProductEditForm kit={kit} />
        <KitContentsEditor
          productId={product.id}
          productSlug={product.slug}
          initialItems={kitItems}
          variants={(variants ?? []) as DbVariant[]}
          materials={materials ?? []}
        />
      </div>
    </div>
  )
}
