'use client'

import { useMemo, useState, useTransition } from 'react'
import { Pencil, Plus, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  setMaterialActive,
  upsertMaterial,
  type Material,
  type MaterialPayload,
} from '@/app/admin/materials/actions'

type MaterialFormState = {
  name: string
  sku: string
  category: string
  color: string
  unit: string
  quantity_on_hand: string
  quantity_reserved: string
  reorder_point: string
  unit_cost: string
  currency: string
  supplier_name: string
  supplier_url: string
  notes: string
  active: boolean
}

type EditingState = {
  id: string | null
  form: MaterialFormState
}

interface MaterialsManagerProps {
  initialMaterials: Material[]
}

const EMPTY_FORM: MaterialFormState = {
  name: '',
  sku: '',
  category: '',
  color: '',
  unit: 'unit',
  quantity_on_hand: '0',
  quantity_reserved: '0',
  reorder_point: '0',
  unit_cost: '',
  currency: 'USD',
  supplier_name: '',
  supplier_url: '',
  notes: '',
  active: true,
}

function formFromMaterial(material: Material): MaterialFormState {
  return {
    name: material.name,
    sku: material.sku ?? '',
    category: material.category,
    color: material.color ?? '',
    unit: material.unit,
    quantity_on_hand: String(material.quantity_on_hand),
    quantity_reserved: String(material.quantity_reserved),
    reorder_point: String(material.reorder_point),
    unit_cost: material.unit_cost === null ? '' : String(material.unit_cost),
    currency: material.currency,
    supplier_name: material.supplier_name ?? '',
    supplier_url: material.supplier_url ?? '',
    notes: material.notes ?? '',
    active: material.active,
  }
}

function formatQuantity(value: number, unit: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit}`
}

function formatMoney(value: number | null, currency: string) {
  if (value === null) return 'Not set'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 4,
  }).format(value)
}

function toNonNegativeNumber(value: string, label: string): { value: number; error: string | null } {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: 0, error: `${label} must be a non-negative number.` }
  }
  return { value: parsed, error: null }
}

function payloadFromForm(form: MaterialFormState): { payload: MaterialPayload | null; error: string | null } {
  if (!form.name.trim()) return { payload: null, error: 'Material name is required.' }
  if (!form.category.trim()) return { payload: null, error: 'Category is required.' }
  if (!form.unit.trim()) return { payload: null, error: 'Unit is required.' }

  const currency = form.currency.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(currency)) {
    return { payload: null, error: 'Currency must be a three-letter code like USD.' }
  }

  const quantityOnHand = toNonNegativeNumber(form.quantity_on_hand, 'Quantity on hand')
  if (quantityOnHand.error) return { payload: null, error: quantityOnHand.error }

  const quantityReserved = toNonNegativeNumber(form.quantity_reserved, 'Quantity reserved')
  if (quantityReserved.error) return { payload: null, error: quantityReserved.error }

  if (quantityReserved.value > quantityOnHand.value) {
    return { payload: null, error: 'Quantity reserved cannot exceed quantity on hand.' }
  }

  const reorderPoint = toNonNegativeNumber(form.reorder_point, 'Reorder point')
  if (reorderPoint.error) return { payload: null, error: reorderPoint.error }

  let unitCost: number | null = null
  if (form.unit_cost.trim()) {
    const parsed = toNonNegativeNumber(form.unit_cost, 'Unit cost')
    if (parsed.error) return { payload: null, error: parsed.error }
    unitCost = parsed.value
  }

  return {
    error: null,
    payload: {
      name: form.name,
      sku: form.sku,
      category: form.category,
      color: form.color,
      unit: form.unit,
      quantity_on_hand: quantityOnHand.value,
      quantity_reserved: quantityReserved.value,
      reorder_point: reorderPoint.value,
      unit_cost: unitCost,
      currency,
      supplier_name: form.supplier_name,
      supplier_url: form.supplier_url,
      notes: form.notes,
      active: form.active,
    },
  }
}

export function MaterialsManager({ initialMaterials }: MaterialsManagerProps) {
  const [materials, setMaterials] = useState(initialMaterials)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sortedMaterials = useMemo(
    () =>
      [...materials].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1
        return a.name.localeCompare(b.name)
      }),
    [materials],
  )

  function openNew() {
    setEditing({ id: null, form: EMPTY_FORM })
    setError(null)
    setSuccess(null)
  }

  function openEdit(material: Material) {
    setEditing({ id: material.id, form: formFromMaterial(material) })
    setError(null)
    setSuccess(null)
  }

  function updateForm(field: keyof MaterialFormState, value: string | boolean) {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            form: { ...prev.form, [field]: value },
          }
        : prev,
    )
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!editing) return

    const { payload, error: validationError } = payloadFromForm(editing.form)
    if (!payload) {
      setError(validationError)
      return
    }

    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await upsertMaterial(payload, editing.id ?? undefined)
      if (result.error || !result.material) {
        setError(result.error ?? 'Could not save the material.')
        return
      }

      setMaterials((prev) => {
        if (editing.id) {
          return prev.map((material) =>
            material.id === editing.id ? result.material! : material,
          )
        }
        return [result.material!, ...prev]
      })
      setEditing(null)
      setSuccess(editing.id ? 'Material updated.' : 'Material created.')
    })
  }

  function handleActiveChange(material: Material, active: boolean) {
    if (!active && !window.confirm(`Deactivate ${material.name}?`)) return

    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await setMaterialActive(material.id, active)
      if (result.error) {
        setError(result.error)
        return
      }

      setMaterials((prev) =>
        prev.map((item) =>
          item.id === material.id
            ? { ...item, active, updated_at: new Date().toISOString() }
            : item,
        ),
      )
      setSuccess(active ? 'Material reactivated.' : 'Material deactivated.')
    })
  }

  return (
    <div className="mt-6 grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {materials.length} material{materials.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={openNew}
          className={cn(buttonVariants(), 'h-9 gap-1.5 text-sm')}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add material
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-sprout/40 bg-sprout/15 px-4 py-3 text-sm text-sprout-foreground">
          {success}
        </div>
      )}

      {editing && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium">
                {editing.id ? 'Edit material' : 'New material'}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Component inventory is visible only to admins.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'shrink-0')}
              aria-label="Close material form"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Name *" className="sm:col-span-2">
              <input
                type="text"
                required
                value={editing.form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </Field>

            <Field label="SKU">
              <input
                type="text"
                value={editing.form.sku}
                onChange={(event) => updateForm('sku', event.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none ring-ring/50 focus:ring-2"
              />
            </Field>

            <Field label="Active">
              <label className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm">
                <input
                  type="checkbox"
                  checked={editing.form.active}
                  onChange={(event) => updateForm('active', event.target.checked)}
                  className="size-4 rounded border-input"
                />
                Available for use
              </label>
            </Field>

            <Field label="Category *">
              <input
                type="text"
                required
                value={editing.form.category}
                onChange={(event) => updateForm('category', event.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </Field>

            <Field label="Color">
              <input
                type="text"
                value={editing.form.color}
                onChange={(event) => updateForm('color', event.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </Field>

            <Field label="Unit *">
              <input
                type="text"
                required
                value={editing.form.unit}
                onChange={(event) => updateForm('unit', event.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </Field>

            <Field label="Currency *">
              <input
                type="text"
                required
                maxLength={3}
                value={editing.form.currency}
                onChange={(event) => updateForm('currency', event.target.value.toUpperCase())}
                className="rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs uppercase outline-none ring-ring/50 focus:ring-2"
              />
            </Field>

            <NumberField
              label="Quantity on hand"
              value={editing.form.quantity_on_hand}
              onChange={(value) => updateForm('quantity_on_hand', value)}
            />
            <NumberField
              label="Quantity reserved"
              value={editing.form.quantity_reserved}
              onChange={(value) => updateForm('quantity_reserved', value)}
            />
            <NumberField
              label="Reorder point"
              value={editing.form.reorder_point}
              onChange={(value) => updateForm('reorder_point', value)}
            />
            <NumberField
              label="Unit cost"
              value={editing.form.unit_cost}
              onChange={(value) => updateForm('unit_cost', value)}
              required={false}
            />

            <Field label="Supplier name" className="sm:col-span-2">
              <input
                type="text"
                value={editing.form.supplier_name}
                onChange={(event) => updateForm('supplier_name', event.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </Field>

            <Field label="Supplier URL" className="sm:col-span-2">
              <input
                type="url"
                value={editing.form.supplier_url}
                onChange={(event) => updateForm('supplier_url', event.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </Field>

            <Field label="Notes" className="sm:col-span-2 lg:col-span-4">
              <textarea
                value={editing.form.notes}
                onChange={(event) => updateForm('notes', event.target.value)}
                rows={3}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </Field>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className={cn(buttonVariants(), 'h-9 min-w-24 text-sm')}
            >
              {isPending ? 'Saving...' : 'Save material'}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setEditing(null)}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-9 text-sm')}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {sortedMaterials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="font-heading text-lg font-semibold">No materials yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Add yarn, hardware, packaging, and other components before building recipes.
          </p>
          <button
            type="button"
            onClick={openNew}
            className={cn(buttonVariants(), 'mt-5 h-9 gap-1.5 text-sm')}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add first material
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Name</Th>
                  <Th>SKU</Th>
                  <Th>Category</Th>
                  <Th>Color</Th>
                  <Th>On hand</Th>
                  <Th>Reserved</Th>
                  <Th>Available</Th>
                  <Th>Reorder</Th>
                  <Th>Unit cost</Th>
                  <Th>Status</Th>
                  <Th>Updated</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedMaterials.map((material) => {
                  const available = material.quantity_on_hand - material.quantity_reserved
                  const lowStock = available <= material.reorder_point
                  return (
                    <tr key={material.id} className={cn('transition-colors hover:bg-muted/30', !material.active && 'opacity-60')}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{material.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{material.unit}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {material.sku ?? 'Not set'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{material.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{material.color ?? 'Not set'}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {formatQuantity(material.quantity_on_hand, material.unit)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {formatQuantity(material.quantity_reserved, material.unit)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums',
                          lowStock
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-sprout/15 text-sprout-foreground',
                        )}>
                          {formatQuantity(available, material.unit)}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {formatQuantity(material.reorder_point, material.unit)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {formatMoney(material.unit_cost, material.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            'inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium',
                            material.active
                              ? 'bg-secondary text-secondary-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}>
                            {material.active ? 'Active' : 'Inactive'}
                          </span>
                          {lowStock && (
                            <span className="text-xs font-medium text-destructive">Low stock</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(material.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(material)}
                            className={cn(buttonVariants({ variant: 'outline' }), 'h-8 gap-1.5 text-xs')}
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleActiveChange(material, !material.active)}
                            className={cn(buttonVariants({ variant: material.active ? 'destructive' : 'outline' }), 'h-8 gap-1.5 text-xs')}
                          >
                            {material.active ? (
                              <>
                                <X className="size-3.5" aria-hidden="true" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <RotateCcw className="size-3.5" aria-hidden="true" />
                                Reactivate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <Field label={required ? `${label} *` : label}>
      <input
        type="number"
        min={0}
        step="any"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
      />
    </Field>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-medium text-muted-foreground',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  )
}
