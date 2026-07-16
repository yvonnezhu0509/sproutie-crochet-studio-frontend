'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, ImageIcon, Save, Star, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { DbImage } from '@/lib/catalog'
import {
  deleteProductImage,
  moveProductImage,
  setPrimaryProductImage,
  updateProductImageAltText,
  uploadProductImages,
} from '@/app/admin/products/image-actions'

interface Props {
  productId: string
  productName: string
  images: DbImage[]
}

function fallbackAlt(productName: string): string {
  return `${productName} product image`
}

export function ProductImagesManager({ productId, productName, images }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedFileCount, setSelectedFileCount] = useState(0)
  const [altTextById, setAltTextById] = useState<Record<string, string>>(() =>
    Object.fromEntries(images.map((image) => [image.id, image.alt_text ?? ''])),
  )

  useEffect(() => {
    setAltTextById(Object.fromEntries(images.map((image) => [image.id, image.alt_text ?? ''])))
  }, [images])

  function clearMessages() {
    setError(null)
    setSuccess(null)
  }

  function handleUpload() {
    const files = Array.from(fileInputRef.current?.files ?? [])
    clearMessages()

    if (files.length === 0) {
      setError('Choose at least one image to upload.')
      return
    }

    startTransition(async () => {
      const failures: string[] = []
      let uploadedCount = 0

      for (const file of files) {
        const formData = new FormData()
        formData.append('files', file)

        const result = await uploadProductImages(productId, formData)
        uploadedCount += result.uploadedCount ?? 0
        if (result.error) failures.push(result.error)
      }

      if (failures.length > 0) setError(failures.join(' '))
      if (uploadedCount > 0) {
        setSuccess(`${uploadedCount} image${uploadedCount === 1 ? '' : 's'} uploaded.`)
      }

      if (fileInputRef.current) fileInputRef.current.value = ''
      setSelectedFileCount(0)
      router.refresh()
    })
  }

  function handleSaveAlt(imageId: string) {
    clearMessages()
    startTransition(async () => {
      const result = await updateProductImageAltText(productId, imageId, altTextById[imageId] ?? '')
      if (result.error) setError(result.error)
      else {
        setSuccess('Alt text saved.')
        router.refresh()
      }
    })
  }

  function handleSetPrimary(imageId: string) {
    clearMessages()
    startTransition(async () => {
      const result = await setPrimaryProductImage(productId, imageId)
      if (result.error) setError(result.error)
      else {
        setSuccess('Primary image updated.')
        router.refresh()
      }
    })
  }

  function handleMove(imageId: string, direction: 'up' | 'down') {
    clearMessages()
    startTransition(async () => {
      const result = await moveProductImage(productId, imageId, direction)
      if (result.error) setError(result.error)
      else {
        setSuccess('Image order updated.')
        router.refresh()
      }
    })
  }

  function handleDelete(image: DbImage, isPrimary: boolean) {
    const confirmed = window.confirm(
      isPrimary
        ? 'Delete the primary image? The next image will become primary.'
        : 'Delete this product image?',
    )
    if (!confirmed) return

    clearMessages()
    startTransition(async () => {
      const result = await deleteProductImage(productId, image.id)
      if (result.error) setError(result.error)
      else {
        setSuccess('Image deleted.')
        router.refresh()
      }
    })
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Product images</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload, order, and describe storefront images. The first image is primary.
          </p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {images.length} image{images.length === 1 ? '' : 's'}
        </span>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-xl border border-sprout/30 bg-sprout/10 px-4 py-3 text-sm text-sprout">
          {success}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-dashed border-border bg-background p-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg px-4 py-8 text-center transition-colors hover:bg-muted/50">
          <ImageIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">Choose JPEG, PNG, or WebP images</span>
          <span className="text-xs text-muted-foreground">Up to 5 MB each. Multiple images are supported.</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setSelectedFileCount(event.currentTarget.files?.length ?? 0)}
            className="sr-only"
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {selectedFileCount > 0
              ? `${selectedFileCount} file${selectedFileCount === 1 ? '' : 's'} selected`
              : 'No files selected'}
          </span>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isPending || selectedFileCount === 0}
            className={cn(buttonVariants(), 'h-10 text-sm')}
          >
            <Upload className="mr-1.5 size-4" />
            {isPending ? 'Working...' : 'Upload images'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No product images yet.
          </div>
        ) : (
          images.map((image, index) => {
            const isPrimary = index === 0
            const altValue = altTextById[image.id] ?? ''
            return (
              <article key={image.id} className="grid gap-4 rounded-xl border border-border bg-background p-4 md:grid-cols-[180px_1fr]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={image.image_url}
                    alt={image.alt_text?.trim() || fallbackAlt(productName)}
                    fill
                    sizes="180px"
                    className="object-cover"
                  />
                  {isPrimary && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm">
                      <Star className="size-3 fill-current" />
                      Primary
                    </span>
                  )}
                </div>

                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate font-mono text-xs text-muted-foreground">{image.image_url}</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMove(image.id, 'up')}
                        disabled={isPending || index === 0}
                        className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }))}
                        aria-label="Move image up"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(image.id, 'down')}
                        disabled={isPending || index === images.length - 1}
                        className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }))}
                        aria-label="Move image down"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        disabled={isPending || isPrimary}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs')}
                      >
                        <Star className="size-3.5" />
                        Set primary
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(image, isPrimary)}
                        disabled={isPending}
                        className={cn(buttonVariants({ variant: 'destructive', size: 'icon-sm' }))}
                        aria-label="Delete image"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Alt text</span>
                    <textarea
                      value={altValue}
                      onChange={(event) =>
                        setAltTextById((current) => ({
                          ...current,
                          [image.id]: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder={fallbackAlt(productName)}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleSaveAlt(image.id)}
                    disabled={isPending}
                    className={cn(buttonVariants({ variant: 'outline' }), 'h-10 text-sm')}
                  >
                    <Save className="mr-1.5 size-4" />
                    Save alt text
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
