import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil } from 'lucide-react'
import { getAllKitsAdmin } from '@/lib/catalog'
import { CreateProductForm } from '@/components/admin/create-product-form'
import type { ProductSaleMode, ProductSourceType, ProductStatus, ProductVisibility, VariantInventoryMode } from '@/lib/catalog'

export const metadata: Metadata = { title: 'Products' }

const STATUS_COLORS: Record<ProductStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  coming_soon: 'bg-citrine text-citrine-foreground',
  active: 'bg-sprout text-sprout-foreground',
  sold_out: 'bg-warm text-warm-foreground',
  archived: 'bg-muted text-muted-foreground',
}

const SOURCE_LABELS: Record<ProductSourceType, string> = {
  sproutie_original: 'Original',
  sproutie_ai: 'Sproutie AI',
  customer_ai: 'Customer AI',
}

const SALE_MODE_LABELS: Record<ProductSaleMode, string> = {
  stocked: 'Stocked',
  made_to_order: 'Made to order',
  digital: 'Digital',
}

const VISIBILITY_LABELS: Record<ProductVisibility, string> = {
  public: 'Public',
  unlisted: 'Unlisted',
  private: 'Private',
}

const INVENTORY_MODE_LABELS: Record<VariantInventoryMode, string> = {
  assembled: 'Assembled',
  component_based: 'Component based',
  unlimited: 'Unlimited',
}

function badgeClass(visibility: ProductVisibility): string {
  if (visibility === 'public') return 'border-sprout/40 bg-sprout/10 text-sprout'
  if (visibility === 'private') return 'border-warm/40 bg-warm/10 text-warm-foreground'
  return 'border-border bg-muted text-muted-foreground'
}

export default async function AdminProductsPage() {
  const kits = await getAllKitsAdmin()

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Products</h1>
        <span className="text-sm text-muted-foreground">
          {kits.length} product{kits.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mt-6">
        <CreateProductForm />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {kits.map((kit) => {
          const inv = kit.variants[0] ? kit.inventory[kit.variants[0].id] : null
          const inventoryModes = Array.from(
            new Set(kit.variants.map((variant) => variant.inventory_mode)),
          )
          return (
            <div
              key={kit.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
            >
              {/* Thumbnail */}
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {kit.image && (
                  <Image
                    src={kit.image}
                    alt={kit.imageAlt}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{kit.name}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[kit.status]}`}
                  >
                    {kit.status.replace('_', ' ')}
                  </span>
                  {kit.isFeatured && (
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      Featured
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {SOURCE_LABELS[kit.sourceType]}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {SALE_MODE_LABELS[kit.saleMode]}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass(kit.visibility)}`}>
                    {VISIBILITY_LABELS[kit.visibility]}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  ${kit.price.toFixed(0)} &middot; {kit.difficulty || 'No difficulty set'}
                  {inv ? ` · ${inv.quantity_on_hand} in stock` : ''}
                  {inventoryModes.length
                    ? ` · ${inventoryModes.map((mode) => INVENTORY_MODE_LABELS[mode]).join(', ')}`
                    : ''}
                </p>
              </div>

              {/* Edit link */}
              <Link
                href={`/admin/products/${kit.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Edit ${kit.name}`}
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
