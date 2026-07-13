import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil } from 'lucide-react'
import { getAllKitsAdmin } from '@/lib/catalog'
import type { ProductStatus } from '@/lib/catalog'

export const metadata: Metadata = { title: 'Products' }

const STATUS_COLORS: Record<ProductStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  coming_soon: 'bg-citrine text-citrine-foreground',
  active: 'bg-sprout text-sprout-foreground',
  sold_out: 'bg-warm text-warm-foreground',
  archived: 'bg-muted text-muted-foreground',
}

export default async function AdminProductsPage() {
  const kits = await getAllKitsAdmin()

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Products</h1>
        <span className="text-sm text-muted-foreground">
          {kits.length} product{kits.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {kits.map((kit) => {
          const inv = kit.variants[0] ? kit.inventory[kit.variants[0].id] : null
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
                    alt={kit.name}
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
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  ${kit.price.toFixed(0)} &middot; {kit.difficulty || 'No difficulty set'}
                  {inv ? ` · ${inv.quantity_on_hand} in stock` : ''}
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
