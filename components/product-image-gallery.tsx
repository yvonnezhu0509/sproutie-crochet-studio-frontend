'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { CatalogKit, DbImage } from '@/lib/catalog'
import { useProductVariantSelection } from '@/components/product-variant-selection'

interface Props {
  kit: CatalogKit
}

const STATUS_LABEL: Record<string, string> = {
  coming_soon: 'Waitlist',
  active: 'Early Access',
  sold_out: 'Sold Out',
}

function imageAlt(image: DbImage, productName: string, index: number): string {
  return image.alt_text?.trim() || `${productName} view ${index + 1}`
}

export function ProductImageGallery({ kit }: Props) {
  const { selectedVariantId } = useProductVariantSelection()

  const displayedImages = useMemo(() => {
    const variantImages = kit.galleryImages.filter(
      (image) => image.variant_id === selectedVariantId,
    )
    const generalImages = kit.galleryImages.filter(
      (image) => image.variant_id === null,
    )

    return variantImages.length > 0
      ? [...variantImages, ...generalImages]
      : generalImages.length > 0
        ? generalImages
        : kit.galleryImages
  }, [kit.galleryImages, selectedVariantId])

  const [selectedImageId, setSelectedImageId] = useState(
    displayedImages[0]?.id ?? '',
  )

  useEffect(() => {
    setSelectedImageId(displayedImages[0]?.id ?? '')
  }, [displayedImages])

  const selectedImage =
    displayedImages.find((image) => image.id === selectedImageId) ??
    displayedImages[0] ??
    null

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        <Image
          src={selectedImage?.image_url ?? kit.image}
          alt={
            selectedImage?.alt_text?.trim() ||
            kit.imageAlt
          }
          fill
          priority
          sizes="(min-width: 1024px) 56vw, 90vw"
          className="object-cover"
        />
        <div className="absolute left-4 top-4 flex gap-2">
          <Badge variant="secondary">
            {STATUS_LABEL[kit.status] ?? kit.status}
          </Badge>
          <Badge variant="outline">{kit.difficulty}</Badge>
        </div>
      </div>

      {displayedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {displayedImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedImageId(image.id)}
              aria-label={`Show ${imageAlt(image, kit.name, index)}`}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ${
                selectedImage?.id === image.id
                  ? 'ring-2 ring-primary'
                  : 'ring-border'
              }`}
            >
              <Image
                src={image.image_url}
                alt={imageAlt(image, kit.name, index)}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
