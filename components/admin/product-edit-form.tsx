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
} from '@/app/admin/products/actions'
import type {
  CatalogKit,
  ProductSaleMode,
  ProductSourceType,
  ProductStatus,
  ProductVisibility,
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

  // Storefront metadata
  const [tagline, setTagline] = useState(kit.tagline)
  const [bagType, setBagType] = useState(kit.bagType)
  const [construction, setConstruction] = useState(kit.construction)
  const [constructionOverview, setConstructionOverview] = useState(
    kit.constructionOverview,
  )
  const [dimensionsIn, setDimensionsIn] = useState(kit.dimensionsIn)
  const [dimensionsCm, setDimensionsCm] = useState(kit.dimensionsCm)
  const [toolsNotIncluded, setToolsNotIncluded] = useState(
    kit.toolsNotIncluded.join('\n'),
  )
  const [techniques, setTechniques] = useState(kit.techniques.join('\n'))
  const [customizationOptions, setCustomizationOptions] = useState(
    kit.customizationOptions.join('\n'),
  )
  const [careInstructions, setCareInstructions] = useState(
    kit.careInstructions.join('\n'),
  )
  const [patternFormat, setPatternFormat] = useState(kit.patternFormat)
  const [availability, setAvailability] = useState(kit.availability)

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
        metadata: {
          tagline,
          bagType,
          construction,
          constructionOverview,
          dimensionsIn,
          dimensionsCm,
          toolsNotIncluded: toolsNotIncluded.split('\n'),
          techniques: techniques.split('\n'),
          customizationOptions: customizationOptions.split('\n'),
          careInstructions: careInstructions.split('\n'),
          patternFormat,
          availability,
        },
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

      {/* Storefront metadata */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="text-sm font-medium">Storefront details</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Additional content displayed on product cards and product detail pages.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs text-muted-foreground">Tagline</span>
            <input
              type="text"
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Bag type</span>
            <input
              type="text"
              value={bagType}
              onChange={(event) => setBagType(event.target.value)}
              placeholder="Tote, Shoulder Bag, Crescent Bag…"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Construction method</span>
            <input
              type="text"
              value={construction}
              onChange={(event) => setConstruction(event.target.value)}
              placeholder="Worked in the round"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Availability label</span>
            <input
              type="text"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              placeholder="Early Access, Waitlist, Prototype…"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Pattern format</span>
            <input
              type="text"
              value={patternFormat}
              onChange={(event) => setPatternFormat(event.target.value)}
              placeholder="Printed booklet plus downloadable PDF"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Dimensions — inches</span>
            <input
              type="text"
              value={dimensionsIn}
              onChange={(event) => setDimensionsIn(event.target.value)}
              placeholder="13 in W × 12 in H × 4 in D"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Dimensions — centimeters</span>
            <input
              type="text"
              value={dimensionsCm}
              onChange={(event) => setDimensionsCm(event.target.value)}
              placeholder="33 cm × 30 cm × 10 cm"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Construction overview</span>
          <textarea
            value={constructionOverview}
            onChange={(event) => setConstructionOverview(event.target.value)}
            rows={3}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Techniques — one per line
            </span>
            <textarea
              value={techniques}
              onChange={(event) => setTechniques(event.target.value)}
              rows={5}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Tools not included — one per line
            </span>
            <textarea
              value={toolsNotIncluded}
              onChange={(event) => setToolsNotIncluded(event.target.value)}
              rows={5}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Customization options — one per line
            </span>
            <textarea
              value={customizationOptions}
              onChange={(event) => setCustomizationOptions(event.target.value)}
              rows={5}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Care instructions — one per line
            </span>
            <textarea
              value={careInstructions}
              onChange={(event) => setCareInstructions(event.target.value)}
              rows={5}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>
        </div>
      </section>

      {/* Inventory */}
      {firstVariant && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">Inventory</h2>
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
