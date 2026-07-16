'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import {
  archiveProduct,
  deleteProductPermanently,
  restoreProductToDraft,
} from '@/app/admin/products/lifecycle-actions'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProductStatus } from '@/lib/catalog'

interface Props {
  productId: string
  productName: string
  status: ProductStatus
}

export function ProductLifecycleActions({
  productId,
  productName,
  status,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleArchive() {
    const confirmed = window.confirm(
      `Archive "${productName}"? It will no longer appear in the storefront.`,
    )
    if (!confirmed) return

    setError(null)
    startTransition(async () => {
      const result = await archiveProduct(productId)

      if (result.error) {
        setError(result.error)
        return
      }

      router.refresh()
    })
  }

  function handleRestore() {
    const confirmed = window.confirm(
      `Restore "${productName}" to Draft?`,
    )
    if (!confirmed) return

    setError(null)
    startTransition(async () => {
      const result = await restoreProductToDraft(productId)

      if (result.error) {
        setError(result.error)
        return
      }

      router.refresh()
    })
  }

  function handleDelete() {
    const typedName = window.prompt(
      `Permanently delete "${productName}" and all of its variants, kit contents, inventory, and product images?\n\nType the exact product name to confirm:`,
    )

    if (typedName === null) return

    if (typedName !== productName) {
      setError('The product name did not match. Nothing was deleted.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await deleteProductPermanently(productId)

      if (!result.deleted) {
        setError(result.error ?? 'Could not delete the product.')
        return
      }

      if (result.error) {
        window.alert(result.error)
      }

      router.push('/admin/products')
      router.refresh()
    })
  }

  const canDelete = status === 'draft' || status === 'archived'

  return (
    <section className="rounded-xl border border-destructive/25 bg-card p-5">
      <div>
        <h2 className="text-sm font-medium">Product lifecycle</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Archive products you may need later. Permanent deletion is limited to
          drafts and archived products without inventory movement history.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {status === 'archived' ? (
          <button
            type="button"
            onClick={handleRestore}
            disabled={isPending}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-9 gap-1.5 text-sm',
            )}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Restore to Draft
          </button>
        ) : (
          <button
            type="button"
            onClick={handleArchive}
            disabled={isPending}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-9 gap-1.5 text-sm',
            )}
          >
            <Archive className="size-4" aria-hidden="true" />
            Archive product
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending || !canDelete}
          className={cn(
            buttonVariants({ variant: 'destructive' }),
            'h-9 gap-1.5 text-sm',
          )}
          title={
            canDelete
              ? undefined
              : 'Archive the product before permanently deleting it.'
          }
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete permanently
        </button>
      </div>
    </section>
  )
}
