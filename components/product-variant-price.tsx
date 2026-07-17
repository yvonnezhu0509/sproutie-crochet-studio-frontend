'use client'

import type { CatalogKit } from '@/lib/catalog'
import { useProductVariantSelection } from '@/components/product-variant-selection'

interface Props {
  kit: CatalogKit
}

export function ProductVariantPrice({ kit }: Props) {
  const { selectedVariantId } = useProductVariantSelection()

  const selectedVariant = kit.variants.find(
    (variant) => variant.is_active && variant.id === selectedVariantId,
  )

  const price = selectedVariant
    ? selectedVariant.price_cents / 100
    : kit.price

  return (
    <p className="mt-4 font-heading text-3xl font-semibold">
      ${price.toFixed(0)}
    </p>
  )
}
