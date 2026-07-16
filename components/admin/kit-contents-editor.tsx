'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  LinkIcon,
  Plus,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  deleteKitItem,
  reorderKitItems,
  upsertKitItem,
  type KitItemPayload,
} from '@/app/admin/products/actions'
import type { Database } from '@/lib/supabase/database.types'
import type { DbKitItem, DbVariant } from '@/lib/catalog'

type Material = Database['public']['Tables']['materials']['Row']
type VerificationStatus = 'estimated' | 'sample_tested' | 'production_ready'

interface Props {
  productId: string
  productSlug: string
  initialItems: DbKitItem[]
  variants: DbVariant[]
  materials: Material[]
}

const GENERAL_VARIANT = '__general__'

const VERIFICATION_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: 'estimated', label: 'Estimated' },
  { value: 'sample_tested', label: 'Sample tested' },
  { value: 'production_ready', label: 'Production ready' },
]

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
  material_id: null,
  waste_percentage: 0,
  verification_status: 'estimated',
}

type EditingState = { id: string | null; form: KitItemPayload }

function variantKey(variantId: string | null) {
  return variantId ?? GENERAL_VARIANT
}

function formatMaterialLabel(material: Material) {
  const parts = [
    material.sku ? material.sku : null,
    material.color ? material.color : null,
    material.active ? null : 'inactive',
  ].filter(Boolean)

  return parts.length > 0 ? `${material.name} (${parts.join(' / ')})` : material.name
}

function availableQuantity(material: Material) {
  return material.quantity_on_hand - material.quantity_reserved
}

function formatQuantity(value: number, unit: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit}`
}

function materialById(materials: Material[]) {
  return new Map(materials.map((material) => [material.id, material]))
}

function unitWarning(unit: string, material: Material | null) {
  if (!material) return null
  if (!unit.trim()) return null
  if (unit.trim().toLowerCase() === material.unit.trim().toLowerCase()) return null
  return `Warning: recipe unit "${unit}" differs from material unit "${material.unit}".`
}

function calculateFulfillableEstimate(items: DbKitItem[], materials: Material[]) {
  const materialsById = materialById(materials)
  const requiredRows = items.filter((item) => !item.is_optional && item.material_id)

  if (requiredRows.length === 0) {
    return { label: 'Estimate not available', detail: 'No required material-linked rows for this selection.' }
  }

  let estimate = Number.POSITIVE_INFINITY
  for (const item of requiredRows) {
    const material = item.material_id ? materialsById.get(item.material_id) : null
    if (!material || !material.active) {
      return { label: 'Estimate not available', detail: 'A required linked material is inactive or missing.' }
    }

    const requiredQuantity = item.quantity * (1 + item.waste_percentage / 100)
    if (requiredQuantity <= 0) {
      return { label: 'Estimate not available', detail: 'A required row has an invalid quantity.' }
    }

    estimate = Math.min(estimate, Math.floor(availableQuantity(material) / requiredQuantity))
  }

  return {
    label: `${Math.max(0, estimate).toLocaleString()} kit${estimate === 1 ? '' : 's'}`,
    detail: 'Estimate from active linked materials. Inventory movements are not recorded here.',
  }
}

export function KitContentsEditor({
  productId,
  productSlug,
  initialItems,
  variants,
  materials,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState<DbKitItem[]>(initialItems)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedVariantKey, setSelectedVariantKey] = useState(
    variants[0]?.id ?? GENERAL_VARIANT,
  )

  const materialsById = useMemo(() => materialById(materials), [materials])
  const selectedVariantId =
    selectedVariantKey === GENERAL_VARIANT ? null : selectedVariantKey

  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => variantKey(item.variant_id) === selectedVariantKey)
        .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)),
    [items, selectedVariantKey],
  )

  const estimate = useMemo(
    () => calculateFulfillableEstimate(visibleItems, materials),
    [visibleItems, materials],
  )

  const selectedMaterial = editing?.form.material_id
    ? materialsById.get(editing.form.material_id) ?? null
    : null
  const formUnitWarning = editing ? unitWarning(editing.form.unit, selectedMaterial) : null

  function openNew() {
    setEditing({
      id: null,
      form: {
        ...EMPTY_FORM,
        variant_id: selectedVariantId,
        sort_order: visibleItems.length,
      },
    })
    setError(null)
  }

  function openEdit(item: DbKitItem) {
    setSelectedVariantKey(variantKey(item.variant_id))
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
        material_id: item.material_id,
        waste_percentage: item.waste_percentage,
        verification_status: item.verification_status,
      },
    })
    setError(null)
  }

  function updateForm(update: Partial<KitItemPayload>) {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            form: { ...prev.form, ...update },
          }
        : prev,
    )
  }

  function handleMaterialChange(materialId: string) {
    const material = materialId ? materialsById.get(materialId) : null
    setEditing((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        form: {
          ...prev.form,
          material_id: material?.id ?? null,
          item_name: prev.form.item_name.trim() ? prev.form.item_name : material?.name ?? '',
          unit: prev.form.unit.trim() ? prev.form.unit : material?.unit ?? '',
        },
      }
    })
  }

  function validateForm(form: KitItemPayload) {
    if (!form.category.trim()) return 'Category is required.'
    if (!form.item_name.trim()) return 'Item name is required.'
    if (!form.unit.trim()) return 'Unit is required.'
    if (!Number.isFinite(form.quantity) || form.quantity <= 0) {
      return 'Quantity must be greater than zero.'
    }
    if (!Number.isFinite(form.waste_percentage) || form.waste_percentage < 0 || form.waste_percentage > 100) {
      return 'Waste percentage must be between 0 and 100.'
    }
    if (!VERIFICATION_OPTIONS.some((option) => option.value === form.verification_status)) {
      return 'Verification status is invalid.'
    }
    return null
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!editing) return

    const validationError = validateForm(editing.form)
    if (validationError) {
      setError(validationError)
      return
    }

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
            return prev.map((item) => (item.id === editing.id ? result.item! : item))
          }
          return [...prev, result.item!]
        })
      }
      setEditing(null)
      router.refresh()
    })
  }

  function handleDelete(item: DbKitItem) {
    if (!window.confirm(`Delete "${item.item_name}" from this recipe?`)) return

    setDeletingId(item.id)
    startTransition(async () => {
      const result = await deleteKitItem(item.id, productId, productSlug)
      if (result.error) {
        setError(result.error)
        setDeletingId(null)
        return
      }
      setItems((prev) => prev.filter((existing) => existing.id !== item.id))
      setDeletingId(null)
      router.refresh()
    })
  }

  function moveItem(item: DbKitItem, direction: 'up' | 'down') {
    const idx = visibleItems.findIndex((existing) => existing.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= visibleItems.length) return

    const updatedVisible = visibleItems.map((existing, index) => {
      if (index === idx) return { ...existing, sort_order: visibleItems[swapIdx].sort_order }
      if (index === swapIdx) return { ...existing, sort_order: visibleItems[idx].sort_order }
      return existing
    })

    setItems((prev) =>
      prev.map((existing) =>
        updatedVisible.find((updated) => updated.id === existing.id) ?? existing,
      ),
    )

    startTransition(async () => {
      const result = await reorderKitItems(
        updatedVisible.map((updated) => ({ id: updated.id, sort_order: updated.sort_order })),
        productId,
        productSlug,
      )
      if (result.error) setError(result.error)
      router.refresh()
    })
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Kit recipe / BOM</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Link recipe rows to component inventory when stock should affect fulfillment estimates.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          disabled={isPending}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-8 gap-1.5 text-xs')}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add item
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Recipe selection</span>
          <select
            value={selectedVariantKey}
            onChange={(event) => {
              setSelectedVariantKey(event.target.value)
              setEditing(null)
              setError(null)
            }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus:ring-2"
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.variant_name}
                {variant.sku ? ` / ${variant.sku}` : ''}
              </option>
            ))}
            <option value={GENERAL_VARIANT}>General / no variant</option>
          </select>
        </label>

        <div className="rounded-lg border border-border bg-background px-4 py-2">
          <p className="text-xs text-muted-foreground">Fulfillable estimate</p>
          <p className="text-sm font-medium">{estimate.label}</p>
          <p className="text-xs text-muted-foreground">{estimate.detail}</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {editing && (
        <form
          onSubmit={handleSave}
          className="mb-5 rounded-lg border border-primary/30 bg-primary/5 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-primary">
              {editing.id ? 'Edit recipe item' : 'New recipe item'}
            </p>
            <span className="text-xs text-muted-foreground">
              Variant: {editing.form.variant_id
                ? variants.find((variant) => variant.id === editing.form.variant_id)?.variant_name ?? 'Unknown'
                : 'General'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Linked inventory material</span>
              <select
                value={editing.form.material_id ?? ''}
                onChange={(event) => handleMaterialChange(event.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              >
                <option value="">No linked material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {formatMaterialLabel(material)} / {formatQuantity(availableQuantity(material), material.unit)} available
                  </option>
                ))}
              </select>
            </label>

            {selectedMaterial && (
              <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground sm:col-span-2">
                <span className="font-medium text-foreground">{selectedMaterial.name}</span>
                {selectedMaterial.sku && <span> / SKU {selectedMaterial.sku}</span>}
                {selectedMaterial.color && <span> / {selectedMaterial.color}</span>}
                <span> / {formatQuantity(availableQuantity(selectedMaterial), selectedMaterial.unit)} available</span>
                {!selectedMaterial.active && <span className="font-medium text-destructive"> / inactive</span>}
              </div>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Category *</span>
              <input
                type="text"
                required
                value={editing.form.category}
                onChange={(event) => updateForm({ category: event.target.value })}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Item name *</span>
              <input
                type="text"
                required
                value={editing.form.item_name}
                onChange={(event) => updateForm({ item_name: event.target.value })}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Quantity *</span>
              <input
                type="number"
                required
                min={0.000001}
                step="any"
                value={editing.form.quantity}
                onChange={(event) => updateForm({ quantity: Number(event.target.value) })}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Unit *</span>
              <input
                type="text"
                required
                value={editing.form.unit}
                onChange={(event) => updateForm({ unit: event.target.value })}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            {formUnitWarning && (
              <p className="rounded-lg border border-citrine/40 bg-citrine/15 px-3 py-2 text-xs text-citrine-foreground sm:col-span-2">
                {formUnitWarning}
              </p>
            )}

            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Customer-visible kit description</span>
              <input
                type="text"
                value={editing.form.specification ?? ''}
                onChange={(event) => updateForm({ specification: event.target.value })}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Waste percentage</span>
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                value={editing.form.waste_percentage}
                onChange={(event) => updateForm({ waste_percentage: Number(event.target.value) })}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Verification status</span>
              <select
                value={editing.form.verification_status}
                onChange={(event) => updateForm({ verification_status: event.target.value })}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              >
                {VERIFICATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Sort order</span>
              <input
                type="number"
                min={0}
                step={1}
                value={editing.form.sort_order}
                onChange={(event) => updateForm({ sort_order: Number(event.target.value) })}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>

            <div className="flex items-center gap-5 pt-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.form.is_optional}
                  onChange={(event) => updateForm({ is_optional: event.target.checked })}
                  className="size-4 rounded border-input"
                />
                Optional item
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.form.customer_visible}
                  onChange={(event) => updateForm({ customer_visible: event.target.checked })}
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
              {isPending ? 'Saving...' : editing.id ? 'Update item' : 'Add item'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs')}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {visibleItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center">
          <p className="text-sm font-medium">No recipe items for this selection</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a material-linked row for inventory planning, or an informational row for customers.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {visibleItems.map((item, idx) => {
            const material = item.material_id ? materialsById.get(item.material_id) ?? null : null
            const warning = unitWarning(item.unit, material)
            const isFirst = idx === 0
            const isLast = idx === visibleItems.length - 1

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-opacity',
                  deletingId === item.id && 'opacity-40',
                  !item.customer_visible && 'opacity-70',
                )}
              >
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

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{item.item_name}</span>
                    {material && (
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        material.active
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}>
                        <LinkIcon className="size-3" aria-hidden="true" />
                        {material.name}
                        {material.sku ? ` / ${material.sku}` : ''}
                        {!material.active ? ' / inactive' : ''}
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {item.verification_status.replace('_', ' ')}
                    </span>
                  </div>
                  {item.specification && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Customer text: {item.specification}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{item.category}</span>
                    <span>
                      {item.quantity} {item.unit}
                    </span>
                    {item.waste_percentage > 0 && <span>{item.waste_percentage}% waste</span>}
                    {item.is_optional && <span className="italic">optional</span>}
                    {item.customer_visible ? <span>customer-visible</span> : <span>admin-only</span>}
                    {warning && <span className="font-medium text-citrine-foreground">{warning}</span>}
                  </div>
                </div>

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
