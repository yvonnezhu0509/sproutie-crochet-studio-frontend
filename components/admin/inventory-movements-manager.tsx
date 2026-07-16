'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  recordInventoryMovement,
  type InventoryMovementPayload,
  type InventoryTargetType,
} from '@/app/admin/inventory-movements/actions'
import type { Database } from '@/lib/supabase/database.types'

type Material = Pick<
  Database['public']['Tables']['materials']['Row'],
  'id' | 'name' | 'sku' | 'color' | 'unit' | 'quantity_on_hand' | 'quantity_reserved' | 'active'
>

type InventoryRow = Pick<
  Database['public']['Tables']['inventory']['Row'],
  'variant_id' | 'quantity_on_hand' | 'quantity_reserved' | 'track_inventory'
>

type VariantRow = Pick<
  Database['public']['Tables']['product_variants']['Row'],
  'id' | 'product_id' | 'sku' | 'variant_name' | 'is_active'
>

type ProductRow = Pick<
  Database['public']['Tables']['products']['Row'],
  'id' | 'name'
>

type Movement = Database['public']['Tables']['inventory_movements']['Row']

interface InventoryMovementsManagerProps {
  materials: Material[]
  variants: VariantRow[]
  inventory: InventoryRow[]
  products: ProductRow[]
  movements: Movement[]
}

type MovementForm = {
  targetType: InventoryTargetType
  targetId: string
  movement_type: string
  quantity_delta: string
  reference_type: string
  reference_id: string
  note: string
}

const MOVEMENT_TYPES = [
  'purchase',
  'assembly',
  'sale',
  'return',
  'damage',
  'correction',
  'reservation_release',
  'other',
]

const EMPTY_FORM: MovementForm = {
  targetType: 'material',
  targetId: '',
  movement_type: 'purchase',
  quantity_delta: '',
  reference_type: '',
  reference_id: '',
  note: '',
}

function availableQuantity(onHand: number, reserved: number) {
  return onHand - reserved
}

function formatQuantity(value: number, unit: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit}`
}

function signedQuantity(value: number, unit: string) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatQuantity(value, unit)}`
}

function shortId(value: string | null) {
  return value ? value.slice(0, 8) : 'Not available'
}

export function InventoryMovementsManager({
  materials,
  variants,
  inventory,
  products,
  movements,
}: InventoryMovementsManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<MovementForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [targetFilter, setTargetFilter] = useState<'all' | InventoryTargetType>('all')
  const [movementTypeFilter, setMovementTypeFilter] = useState('all')
  const [targetSearch, setTargetSearch] = useState('')
  const [dateOrder, setDateOrder] = useState<'desc' | 'asc'>('desc')

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const materialById = useMemo(() => new Map(materials.map((material) => [material.id, material])), [materials])
  const inventoryByVariantId = useMemo(
    () => new Map(inventory.map((row) => [row.variant_id, row])),
    [inventory],
  )
  const variantById = useMemo(() => new Map(variants.map((variant) => [variant.id, variant])), [variants])

  const variantTargets = useMemo(
    () =>
      variants
        .map((variant) => {
          const stock = inventoryByVariantId.get(variant.id)
          if (!stock?.track_inventory) return null
          return { variant, stock, product: productById.get(variant.product_id) ?? null }
        })
        .filter((target): target is NonNullable<typeof target> => Boolean(target)),
    [inventoryByVariantId, productById, variants],
  )

  const selectedMaterial = form.targetType === 'material' ? materialById.get(form.targetId) ?? null : null
  const selectedVariant = form.targetType === 'variant' ? variantTargets.find((target) => target.variant.id === form.targetId) ?? null : null
  const currentQuantity = selectedMaterial?.quantity_on_hand ?? selectedVariant?.stock.quantity_on_hand ?? null
  const currentReserved = selectedMaterial?.quantity_reserved ?? selectedVariant?.stock.quantity_reserved ?? null
  const unit = selectedMaterial?.unit ?? (selectedVariant ? 'kits' : '')
  const delta = Number(form.quantity_delta)
  const parsedDelta = Number.isFinite(delta) ? delta : null
  const resultingQuantity = currentQuantity !== null && parsedDelta !== null ? currentQuantity + parsedDelta : null
  const resultingAvailable =
    resultingQuantity !== null && currentReserved !== null
      ? availableQuantity(resultingQuantity, currentReserved)
      : null

  const filteredMovements = useMemo(() => {
    const search = targetSearch.trim().toLowerCase()
    return [...movements]
      .filter((movement) => {
        if (targetFilter === 'material' && !movement.material_id) return false
        if (targetFilter === 'variant' && !movement.variant_id) return false
        if (movementTypeFilter !== 'all' && movement.movement_type !== movementTypeFilter) return false

        if (!search) return true

        const targetName = movement.material_id
          ? materialById.get(movement.material_id)?.name ?? ''
          : (() => {
              const variant = movement.variant_id ? variantById.get(movement.variant_id) : null
              const product = variant ? productById.get(variant.product_id) : null
              return `${product?.name ?? ''} ${variant?.variant_name ?? ''} ${variant?.sku ?? ''}`
            })()

        return targetName.toLowerCase().includes(search)
      })
      .sort((a, b) =>
        dateOrder === 'desc'
          ? b.created_at.localeCompare(a.created_at)
          : a.created_at.localeCompare(b.created_at),
      )
  }, [
    dateOrder,
    materialById,
    movementTypeFilter,
    movements,
    productById,
    targetFilter,
    targetSearch,
    variantById,
  ])

  function updateForm(update: Partial<MovementForm>) {
    setForm((prev) => ({ ...prev, ...update }))
  }

  function validateForm(): string | null {
    if (!form.targetId) return 'Choose one inventory target.'
    if (!Number.isFinite(delta) || delta === 0) return 'Quantity delta must be non-zero.'
    if (form.targetType === 'variant' && !Number.isInteger(delta)) {
      return 'Assembled kit stock changes must use whole-number quantities.'
    }
    if (resultingQuantity !== null && resultingQuantity < 0) {
      return 'This movement would make stock negative.'
    }
    if (resultingQuantity !== null && currentReserved !== null && resultingQuantity < currentReserved) {
      return 'This movement would reduce stock below the reserved quantity.'
    }
    return null
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (delta < 0 && !window.confirm('Record a negative stock adjustment?')) return

    const payload: InventoryMovementPayload = {
      targetType: form.targetType,
      targetId: form.targetId,
      movement_type: form.movement_type,
      quantity_delta: delta,
      reference_type: form.reference_type,
      reference_id: form.reference_id,
      note: form.note,
    }

    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await recordInventoryMovement(payload)
      if (result.error) {
        setError(result.error)
        return
      }
      setForm((prev) => ({ ...EMPTY_FORM, targetType: prev.targetType }))
      setSuccess(
        result.newQuantity === null
          ? 'Inventory movement recorded.'
          : `Inventory movement recorded. New quantity: ${formatQuantity(result.newQuantity, unit)}.`,
      )
      router.refresh()
    })
  }

  return (
    <div className="mt-6 grid gap-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium">Record stock movement</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Positive values add stock. Negative values remove stock. The database function records the ledger row and stock update atomically.
            </p>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className={cn(buttonVariants(), 'h-9 gap-1.5 text-sm')}
          >
            <Plus className="size-4" aria-hidden="true" />
            {isPending ? 'Recording...' : 'Record movement'}
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-lg border border-sprout/40 bg-sprout/15 px-3 py-2 text-sm text-sprout-foreground">
            {success}
          </div>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Target type</span>
            <select
              value={form.targetType}
              onChange={(event) => updateForm({ targetType: event.target.value as InventoryTargetType, targetId: '' })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus:ring-2"
            >
              <option value="material">Material</option>
              <option value="variant">Assembled kit</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 lg:col-span-2">
            <span className="text-xs text-muted-foreground">Target</span>
            <select
              required
              value={form.targetId}
              onChange={(event) => updateForm({ targetId: event.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus:ring-2"
            >
              <option value="">Choose target</option>
              {form.targetType === 'material'
                ? materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                      {material.sku ? ` / ${material.sku}` : ''}
                      {material.color ? ` / ${material.color}` : ''} / {formatQuantity(material.quantity_on_hand, material.unit)}
                    </option>
                  ))
                : variantTargets.map(({ variant, stock, product }) => (
                    <option key={variant.id} value={variant.id}>
                      {product?.name ?? 'Product'} / {variant.variant_name}
                      {variant.sku ? ` / ${variant.sku}` : ''} / {formatQuantity(stock.quantity_on_hand, 'kits')}
                    </option>
                  ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Movement type</span>
            <select
              value={form.movement_type}
              onChange={(event) => updateForm({ movement_type: event.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus:ring-2"
            >
              {MOVEMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Quantity delta</span>
            <input
              type="number"
              required
              step={form.targetType === 'variant' ? 1 : 'any'}
              value={form.quantity_delta}
              onChange={(event) => updateForm({ quantity_delta: event.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <div className="rounded-lg border border-border bg-background px-3 py-2">
            <p className="text-xs text-muted-foreground">Current on hand</p>
            <p className="text-sm font-medium">
              {currentQuantity === null ? 'Choose target' : formatQuantity(currentQuantity, unit)}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background px-3 py-2">
            <p className="text-xs text-muted-foreground">Reserved</p>
            <p className="text-sm font-medium">
              {currentReserved === null ? 'Choose target' : formatQuantity(currentReserved, unit)}
            </p>
          </div>

          <div className={cn(
            'rounded-lg border px-3 py-2',
            resultingQuantity !== null &&
              (resultingQuantity < 0 || (currentReserved !== null && resultingQuantity < currentReserved))
              ? 'border-destructive/30 bg-destructive/10'
              : 'border-border bg-background',
          )}>
            <p className="text-xs text-muted-foreground">Result preview</p>
            <p className="text-sm font-medium">
              {resultingQuantity === null ? 'Enter quantity' : formatQuantity(resultingQuantity, unit)}
            </p>
          </div>

          <div className={cn(
            'rounded-lg border px-3 py-2',
            resultingAvailable !== null && resultingAvailable < 0
              ? 'border-destructive/30 bg-destructive/10'
              : 'border-border bg-background',
          )}>
            <p className="text-xs text-muted-foreground">Available after movement</p>
            <p className="text-sm font-medium">
              {resultingAvailable === null ? 'Enter quantity' : formatQuantity(resultingAvailable, unit)}
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Reference type</span>
            <input
              type="text"
              value={form.reference_type}
              onChange={(event) => updateForm({ reference_type: event.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Reference ID</span>
            <input
              type="text"
              value={form.reference_id}
              onChange={(event) => updateForm({ reference_id: event.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5 lg:col-span-4">
            <span className="text-xs text-muted-foreground">Note</span>
            <textarea
              value={form.note}
              onChange={(event) => updateForm({ note: event.target.value })}
              rows={3}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>
        </div>
      </form>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">Inventory history</h2>
            <p className="mt-1 text-xs text-muted-foreground">Append-only movement ledger. Existing rows cannot be edited here.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <select
              value={targetFilter}
              onChange={(event) => setTargetFilter(event.target.value as 'all' | InventoryTargetType)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs outline-none ring-ring/50 focus:ring-2"
            >
              <option value="all">All targets</option>
              <option value="material">Materials</option>
              <option value="variant">Assembled kits</option>
            </select>
            <select
              value={movementTypeFilter}
              onChange={(event) => setMovementTypeFilter(event.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs outline-none ring-ring/50 focus:ring-2"
            >
              <option value="all">All movement types</option>
              {MOVEMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
            <input
              type="search"
              value={targetSearch}
              onChange={(event) => setTargetSearch(event.target.value)}
              placeholder="Search target"
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs outline-none ring-ring/50 focus:ring-2"
            />
            <select
              value={dateOrder}
              onChange={(event) => setDateOrder(event.target.value as 'desc' | 'asc')}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs outline-none ring-ring/50 focus:ring-2"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
            No inventory movements found.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Date</Th>
                  <Th>Target</Th>
                  <Th>SKU</Th>
                  <Th>Type</Th>
                  <Th>Delta</Th>
                  <Th>Reference</Th>
                  <Th>Note</Th>
                  <Th>Actor</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMovements.map((movement) => {
                  const material = movement.material_id ? materialById.get(movement.material_id) ?? null : null
                  const variant = movement.variant_id ? variantById.get(movement.variant_id) ?? null : null
                  const product = variant ? productById.get(variant.product_id) ?? null : null
                  const movementUnit = material?.unit ?? (variant ? 'kits' : 'units')
                  const targetType = material ? 'Material' : 'Assembled kit'
                  const targetName = material
                    ? material.name
                    : `${product?.name ?? 'Product'} / ${variant?.variant_name ?? 'Variant'}`

                  return (
                    <tr key={movement.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(movement.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{targetName}</p>
                        <p className="text-xs text-muted-foreground">{targetType}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {material?.sku ?? variant?.sku ?? 'Not set'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{movement.movement_type.replace('_', ' ')}</td>
                      <td className={cn(
                        'px-4 py-3 font-medium tabular-nums',
                        movement.quantity_delta < 0 ? 'text-destructive' : 'text-sprout-foreground',
                      )}>
                        {signedQuantity(movement.quantity_delta, movementUnit)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {movement.reference_type || movement.reference_id
                          ? `${movement.reference_type ?? 'reference'} ${movement.reference_id ?? ''}`
                          : 'None'}
                      </td>
                      <td className="max-w-64 px-4 py-3 text-xs text-muted-foreground">
                        <span className="line-clamp-2">{movement.note ?? 'None'}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {shortId(movement.created_by)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
      {children}
    </th>
  )
}
