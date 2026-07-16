'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import {
  createProduct,
  type CreateProductPayload,
} from '@/app/admin/products/actions'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  ProductSaleMode,
  ProductSourceType,
  ProductVisibility,
} from '@/lib/catalog'

type ProductFormState = {
  name: string
  slug: string
  source_type: ProductSourceType
  sale_mode: ProductSaleMode
  visibility: ProductVisibility
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  slug: '',
  source_type: 'sproutie_original',
  sale_mode: 'stocked',
  visibility: 'private',
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function CreateProductForm() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [slugWasEdited, setSlugWasEdited] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function updateName(name: string) {
    setForm((current) => ({
      ...current,
      name,
      slug: slugWasEdited ? current.slug : slugify(name),
    }))
  }

  function updateSlug(slug: string) {
    setSlugWasEdited(true)
    setForm((current) => ({
      ...current,
      slug: slugify(slug),
    }))
  }

  function closeForm() {
    if (isPending) return
    setIsOpen(false)
    setForm(EMPTY_FORM)
    setSlugWasEdited(false)
    setError(null)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const payload: CreateProductPayload = {
      name: form.name,
      slug: form.slug,
      source_type: form.source_type,
      sale_mode: form.sale_mode,
      visibility: form.visibility,
    }

    startTransition(async () => {
      const result = await createProduct(payload)

      if (result.error || !result.productId) {
        setError(result.error ?? 'Could not create the product.')
        return
      }

      router.push(`/admin/products/${result.productId}`)
    })
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(buttonVariants(), 'h-9 gap-1.5 text-sm')}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add product
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">New product</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The product will be created as a draft. You can complete its
            publication requirements on the next page.
          </p>
        </div>

        <button
          type="button"
          onClick={closeForm}
          disabled={isPending}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'shrink-0',
          )}
          aria-label="Close product form"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Product name *</span>
          <input
            type="text"
            required
            autoFocus
            value={form.name}
            onChange={(event) => updateName(event.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Slug *</span>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(event) => updateSlug(event.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none ring-ring/50 focus:ring-2"
          />
          <span className="text-xs text-muted-foreground/70">
            Used in the storefront URL.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Source type</span>
          <select
            value={form.source_type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                source_type: event.target.value as ProductSourceType,
              }))
            }
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
          >
            <option value="sproutie_original">Sproutie Original</option>
            <option value="sproutie_ai">Sproutie AI-assisted</option>
            <option value="customer_ai">Customer-generated AI</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Sale mode</span>
          <select
            value={form.sale_mode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sale_mode: event.target.value as ProductSaleMode,
              }))
            }
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
          >
            <option value="stocked">Stocked</option>
            <option value="made_to_order">Made to order</option>
            <option value="digital">Digital</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Visibility</span>
          <select
            value={form.visibility}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                visibility: event.target.value as ProductVisibility,
              }))
            }
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
          >
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
            <option value="public">Public</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={cn(buttonVariants(), 'h-9 min-w-32 text-sm')}
        >
          {isPending ? 'Creating…' : 'Create product'}
        </button>

        <button
          type="button"
          onClick={closeForm}
          disabled={isPending}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-9 text-sm')}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
