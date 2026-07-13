'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  upsertKitItem,
  deleteKitItem,
  reorderKitItems,
  type KitItemPayload,
} from '@/app/admin/products/actions'
import type { DbKitItem, DbVariant } from '@/lib/catalog'

interface Props {
  productId: string
  productSlug: string
  initialItems: DbKitItem[]
  variants: DbVariant[]
}

const EMPTY_FORM: KitItemPayload = {
  category: '',
  item_name: '',
  quantity: 1,
  unit: '',
  specification: '',
  is_optional: false,
  customer_visible: true,
  sort_order: 0,
  variant_id: null,
}

type EditingState = { id: string | null; form: KitItemPayload }

// Group items by category, preserving sort order within each group
function groupByCategory(items: DbKitItem[]): Record<string, DbKitItem[]> {
  const groups: Record<string, DbKitItem[]> = {}
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }
  return groups
}

export function KitContentsEditor({ productId, productSlug, initialItems, variants }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState<DbKitItem[]>(initialItems)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const groups = groupByCategory(items)
  const categories = Object.keys(groups)

  function openNew() {
    setEditing({
      id: null,
      form: {
        ...EMPTY_FORM,
        sort_order: items.length,
      },
    })
    setError(null)
  }

  function openEdit(item: DbKitItem) {
    setEditing({
      id: item.id,
      form: {
        category: item.category,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        specification: item.specification ?? '',
        is_optional: item.is_optional,
        customer_visible: item.customer_visible,
        sort_order: item.sort_order,
        variant_id: item.variant_id,
      },
    })
    setError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setError(null)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setError(null)
    startTransition(async () => {
      const result = await upsertKitItem(
        productId,
        productSlug,
        editing.form,
        editing.id ?? undefined,
      )
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.item) {
        setItems((prev) => {
          if (editing.id) {
            return prev.map((i) => (i.id === editing.id ? result.item! : i))
          }
          return [...prev, result.item!]
        })
      }
      setEditing(null)
      router.refresh()
    })
  }

  function handleDelete(item: DbKitItem) {
    setDeletingId(item.id)
    startTransition(async () => {
      const result = await deleteKitItem(item.id, productId, productSlug)
      if (result.error) {
        setError(result.error)
        setDeletingId(null)
        return
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setDeletingId(null)
      router.refresh()
    })
  }

  function moveItem(item: DbKitItem, direction: 'up' | 'down') {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((i) => i.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const updated = sorted.map((i, j) => {
      if (j === idx) return { ...i, sort_order: sorted[swapIdx].sort_order }
      if (j === swapIdx) return { ...i, sort_order: sorted[idx].sort_order }
      return i
    })
    setItems(updated)

    startTransition(async () => {
      await reorderKitItems(
        updated.map((i) => ({ id: i.id, sort_order: i.sort_order })),
        productId,
        productSlug,
      )
      router.refresh()
    })
  }

  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">Kit contents</h2>
        <button
          type="button"
          onClick={openNew}
          disabled={isPending}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-8 gap-1.5 text-xs')}
        >
          <Plus className="size-3.5" />
          Add item
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Inline add / edit form */}
      {editing && (
        <form
          onSubmit={handleSave}
          className="mb-5 rounded-lg border border-primary/30 bg-primary/5 p-4"
        >
          <p className="mb-3 text-xs font-medium text-primary">
            {editing.id ? 'Edit item' : 'New item'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Category *</span>
              <input
                type="text"
                required
                placeholder="e.g. Yarn, Hook, Pattern"
                value={editing.form.category}
                onChange={(e) =>
                  setEditing((prev) => prev && { ...prev, form: { ...prev.form, category: e.target.value } })
                }
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Item name *</span>
              <input
                type="text"
                required
                placeholder="e.g. Raffia yarn 100g"
                value={editing.form.item_name}
                onChange={(e) =>
                  setEditing((prev) => prev && { ...prev, form: { ...prev.form, item_name: e.target.value } })
                }
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Quantity *</span>
              <input
                type="number"
                required
                min={0}
                step="any"
                value={editing.form.quantity}
                onChange={(e) =>
                  setEditing((prev) => prev && { ...prev, form: { ...prev.form, quantity: Number(e.target.value) } })
                }
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Unit</span>
              <input
                type="text"
                placeholder="e.g. skeins, pcs, g"
                value={editing.form.unit}
                onChange={(e) =>
                  setEditing((prev) => prev && { ...prev, form: { ...prev.form, unit: e.target.value } })
                }
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Specification / notes</span>
              <input
                type="text"
                placeholder="e.g. Color: Natural, Weight: 3mm"
                value={editing.form.specification ?? ''}
                onChange={(e) =>
                  setEditing((prev) => prev && { ...prev, form: { ...prev.form, specification: e.target.value } })
                }
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Sort order</span>
              <input
                type="number"
                min={0}
                step={1}
                value={editing.form.sort_order}
                onChange={(e) =>
                  setEditing((prev) => prev && { ...prev, form: { ...prev.form, sort_order: Number(e.target.value) } })
                }
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            {variants.length > 0 && (
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Variant (optional)</span>
                <select
                  value={editing.form.variant_id ?? ''}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev && { ...prev, form: { ...prev.form, variant_id: e.target.value || null } }
                    )
                  }
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
                >
                  <option value="">All variants</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.variant_name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="flex items-center gap-5 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.form.is_optional}
                  onChange={(e) =>
                    setEditing((prev) => prev && { ...prev, form: { ...prev.form, is_optional: e.target.checked } })
                  }
                  className="size-4 rounded border-input"
                />
                Optional item
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.form.customer_visible}
                  onChange={(e) =>
                    setEditing((prev) => prev && { ...prev, form: { ...prev.form, customer_visible: e.target.checked } })
                  }
                  className="size-4 rounded border-input"
                />
                Visible to customers
              </label>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className={cn(buttonVariants({ size: 'sm' }), 'text-xs')}
            >
              {isPending ? 'Saving…' : editing.id ? 'Update item' : 'Add item'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs')}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Items list */}
      {sortedItems.length === 0 ? (
        <p className="text-center py-6 text-sm text-muted-foreground">
          No kit items yet. Click &ldquo;Add item&rdquo; to start building the contents list.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {sortedItems.map((item, idx) => {
            const isFirst = idx === 0
            const isLast = idx === sortedItems.length - 1
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-opacity',
                  deletingId === item.id && 'opacity-40',
                  !item.customer_visible && 'opacity-60',
                )}
              >
                {/* Reorder */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveItem(item, 'up')}
                    disabled={isFirst || isPending}
                    aria-label="Move up"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(item, 'down')}
                    disabled={isLast || isPending}
                    aria-label="Move down"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate">{item.item_name}</span>
                  {item.specification && (
                    <span className="ml-1.5 text-muted-foreground">&mdash; {item.specification}</span>
                  )}
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">{item.category}</span>
                    <span>
                      {item.quantity} {item.unit}
                    </span>
                    {item.is_optional && <span className="italic">optional</span>}
                  </div>
                </div>

                {/* Visibility badge */}
                <span
                  aria-label={item.customer_visible ? 'Visible' : 'Hidden'}
                  title={item.customer_visible ? 'Visible to customers' : 'Hidden from customers'}
                  className="text-muted-foreground"
                >
                  {item.customer_visible ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                </span>

                {/* Actions */}
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  disabled={isPending}
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={isPending || deletingId === item.id}
                  aria-label={`Delete ${item.item_name}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
