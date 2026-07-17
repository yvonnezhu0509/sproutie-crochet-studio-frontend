'use client'

import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { useCart } from '@/lib/cart'
import type { CatalogKit } from '@/lib/catalog'
import { useProductVariantSelection } from '@/components/product-variant-selection'

interface Props {
  kit: CatalogKit
}

export function AddToCartSection({ kit }: Props) {
  const { addItem, openDrawer } = useCart()
  const activeVariants = kit.variants.filter((variant) => variant.is_active)
  const { selectedVariantId, setSelectedVariantId } =
    useProductVariantSelection()
  const [selectedYarn, setSelectedYarn] = useState<string>(
    kit.customizationOptions[0] ?? '',
  )
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const selectedVariant =
    activeVariants.find((variant) => variant.id === selectedVariantId) ?? null
  const selectedVariantImage =
    kit.galleryImages.find((image) => image.variant_id === selectedVariant?.id) ?? null
  const unitPrice = selectedVariant
    ? selectedVariant.price_cents / 100
    : kit.price

  function handleAddToCart() {
    addItem({
      productId: kit.id,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.variant_name,
      name: kit.name,
      slug: kit.slug,
      image: selectedVariantImage?.image_url ?? kit.image,
      yarnOption: selectedYarn || undefined,
      quantity: qty,
      unitPrice,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    openDrawer()
  }

  return (
    <div className="flex flex-col gap-5">
      {activeVariants.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Variant</legend>
          <div className="flex flex-col gap-1.5">
            {activeVariants.map((variant) => (
              <label
                key={variant.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
                  selectedVariantId === variant.id
                    ? 'border-primary bg-secondary text-secondary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="product-variant"
                    value={variant.id}
                    checked={selectedVariantId === variant.id}
                    onChange={() => setSelectedVariantId(variant.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                      selectedVariantId === variant.id
                        ? 'border-primary bg-primary'
                        : 'border-border',
                    )}
                  >
                    {selectedVariantId === variant.id && (
                      <span className="size-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </span>
                  {variant.variant_name}
                </span>
                <span className="font-medium">
                  ${(variant.price_cents / 100).toFixed(2)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Yarn / customization option */}
      {kit.customizationOptions.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Customization</legend>
          <div className="flex flex-col gap-1.5">
            {kit.customizationOptions.map((opt) => (
              <label
                key={opt}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
                  selectedYarn === opt
                    ? 'border-primary bg-secondary text-secondary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                )}
              >
                <input
                  type="radio"
                  name="yarn-option"
                  value={opt}
                  checked={selectedYarn === opt}
                  onChange={() => setSelectedYarn(opt)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                    selectedYarn === opt
                      ? 'border-primary bg-primary'
                      : 'border-border',
                  )}
                >
                  {selectedYarn === opt && (
                    <span className="size-1.5 rounded-full bg-primary-foreground" />
                  )}
                </span>
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity</span>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-1">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-medium tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to cart CTA */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleAddToCart}
          className={cn(
            buttonVariants(),
            'h-12 w-full gap-2 text-sm transition-all',
            added && 'bg-sprout text-sprout-foreground',
          )}
        >
          <ShoppingBag className="size-4" />
          {added ? 'Added to bag!' : 'Add to Bag'}
        </button>

        {kit.status !== 'active' && (
          <p className="text-center text-xs text-muted-foreground">
            {kit.status === 'coming_soon'
              ? 'Join the waitlist — we\u2019ll notify you when this kit ships.'
              : kit.status === 'sold_out'
              ? 'Currently sold out — check back soon.'
              : 'This kit is not yet available for purchase.'}
          </p>
        )}
      </div>
    </div>
  )
}
