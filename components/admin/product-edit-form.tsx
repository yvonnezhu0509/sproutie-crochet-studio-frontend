'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  updateProduct,
  updateProductStatus,
  updateInventory,
  updateVariantInventoryMode,
} from '@/app/admin/products/actions'
import type {
  CatalogKit,
  ProductSaleMode,
  ProductSourceType,
  ProductStatus,
  ProductVisibility,
  VariantInventoryMode,
} from '@/lib/catalog'

const STATUSES: { value: ProductStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'coming_soon', label: 'Coming Soon' },
  { value: 'active', label: 'Active' },
  { value: 'sold_out', label: 'Sold Out' },
  { value: 'archived', label: 'Archived' },
]

const SOURCE_TYPES: { value: ProductSourceType; label: string }[] = [
  { value: 'sproutie_original', label: 'Sproutie Original' },
  { value: 'sproutie_ai', label: 'Sproutie AI-assisted' },
  { value: 'customer_ai', label: 'Customer-generated AI' },
]

const SALE_MODES: { value: ProductSaleMode; label: string }[] = [
  { value: 'stocked', label: 'Stocked' },
  { value: 'made_to_order', label: 'Made to order' },
  { value: 'digital', label: 'Digital' },
]

const VISIBILITIES: { value: ProductVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
]

const INVENTORY_MODES: {
  value: VariantInventoryMode
  label: string
  description: string
}[] = [
  {
    value: 'assembled',
    label: 'Assembled',
    description: 'Tracks packaged kit stock in inventory.',
  },
  {
    value: 'component_based',
    label: 'Component based',
    description: 'Availability is derived from linked materials and BOM.',
  },
  {
    value: 'unlimited',
    label: 'Unlimited',
    description: 'For digital or non-stock-limited products.',
  },
]

interface Props {
  kit: CatalogKit
}

export function ProductEditForm({ kit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Core fields
  const [name, setName] = useState(kit.name)
  const [slug, setSlug] = useState(kit.slug)
  const [shortDesc, setShortDesc] = useState(kit.shortDescription)
  const [description, setDescription] = useState(kit.description)
  const [status, setStatus] = useState<ProductStatus>(kit.status)
  const [sourceType, setSourceType] = useState<ProductSourceType>(kit.sourceType)
  const [saleMode, setSaleMode] = useState<ProductSaleMode>(kit.saleMode)
  const [visibility, setVisibility] = useState<ProductVisibility>(kit.visibility)
  const [priceCents, setPriceCents] = useState(kit.priceCents)
  const [difficulty, setDifficulty] = useState(kit.difficulty)
  const [makingTime, setMakingTime] = useState(kit.makingTime)
  const [isFeatured, setIsFeatured] = useState(kit.isFeatured)

  // Inventory (first variant only for now)
  const firstVariant = kit.variants[0]
  const firstInventory = firstVariant ? kit.inventory[firstVariant.id] : null
  const [qty, setQty] = useState(firstInventory?.quantity_on_hand ?? 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await updateProduct(kit.id, {
        name,
        slug,
        short_description: shortDesc,
        description,
        status,
        source_type: sourceType,
        sale_mode: saleMode,
        visibility,
        base_price_cents: priceCents,
        difficulty,
        estimated_making_time: makingTime,
        is_featured: isFeatured,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        router.refresh()
      }
    })
  }

  function handleStatusChange(newStatus: ProductStatus) {
    setStatus(newStatus)
    startTransition(async () => {
      const result = await updateProductStatus(kit.id, newStatus, kit.slug)
      if (result.error) {
        setError(result.error)
        setStatus(kit.status)
      } else {
        setError(null)
        router.refresh()
      }
    })
  }

  function handleInventorySave() {
    if (!firstVariant) return
    startTransition(async () => {
      const result = await updateInventory(firstVariant.id, qty, kit.slug)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleInventoryModeChange(variantId: string, inventoryMode: VariantInventoryMode) {
    setError(null)
    startTransition(async () => {
      const result = await updateVariantInventoryMode(variantId, kit.id, kit.slug, inventoryMode)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Status quick-switch */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-medium">Status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleStatusChange(s.value)}
              disabled={isPending}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-colors border',
                status === s.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Core details */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-medium">Product details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Slug</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Price (USD cents)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={priceCents}
              onChange={(e) => setPriceCents(Number(e.target.value))}
              required
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
            <span className="text-xs text-muted-foreground/70">
              = ${(priceCents / 100).toFixed(2)}
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Difficulty</span>
            <input
              type="text"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Making time</span>
            <input
              type="text"
              value={makingTime}
              onChange={(e) => setMakingTime(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Source type</span>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as ProductSourceType)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            >
              {SOURCE_TYPES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Sale mode</span>
            <select
              value={saleMode}
              onChange={(e) => setSaleMode(e.target.value as ProductSaleMode)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            >
              {SALE_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Visibility</span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as ProductVisibility)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            >
              {VISIBILITIES.map((visibilityOption) => (
                <option key={visibilityOption.value} value={visibilityOption.value}>
                  {visibilityOption.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Owner</span>
            <div className="min-h-10 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {kit.ownerId ? (
                <span className="font-mono text-xs">{kit.ownerId}</span>
              ) : (
                'Sproutie-owned product'
              )}
            </div>
          </div>

          <label className="flex items-center gap-2.5 pt-5">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="size-4 rounded border-input"
            />
            <span className="text-sm">Featured on home page</span>
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Short description</span>
          <textarea
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            rows={2}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
          />
        </label>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Description (story)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
          />
        </label>
      </section>

      {/* Inventory */}
      {firstVariant && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">Inventory</h2>
          <div className="mb-5 grid gap-3">
            {kit.variants.map((variant) => (
              <label
                key={variant.id}
                className="grid gap-2 rounded-lg border border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_220px]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{variant.variant_name}</span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">
                    {variant.sku || variant.id}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {INVENTORY_MODES.find((mode) => mode.value === variant.inventory_mode)?.description}
                  </span>
                </span>
                <select
                  value={variant.inventory_mode}
                  onChange={(e) =>
                    handleInventoryModeChange(variant.id, e.target.value as VariantInventoryMode)
                  }
                  disabled={isPending}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus:ring-2"
                >
                  {INVENTORY_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="flex items-end gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">
                Quantity on hand ({firstVariant.variant_name})
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>
            <button
              type="button"
              onClick={handleInventorySave}
              disabled={isPending}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-10 text-xs')}
            >
              Save inventory
            </button>
          </div>
        </section>
      )}

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            buttonVariants(),
            'h-10 min-w-[120px] text-sm transition-all',
            saved && 'bg-sprout text-sprout-foreground',
          )}
        >
          {saved ? (
            <span className="flex items-center gap-1.5">
              <Check className="size-4" />
              Saved
            </span>
          ) : isPending ? (
            'Saving…'
          ) : (
            'Save changes'
          )}
        </button>

        <a
          href={`/originals/${kit.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          View on site
        </a>
      </div>
    </form>
  )
}
