'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus, Save, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  createProductVariant,
  deleteProductVariant,
  updateProductVariant,
  type ProductVariantPayload,
} from '@/app/admin/products/actions'
import type { DbInventory, DbVariant, ProductSaleMode, VariantInventoryMode } from '@/lib/catalog'

type OptionPair = {
  id: string
  key: string
  value: string
}

type VariantFormState = {
  variant_name: string
  sku: string
  price_cents: number
  inventory_mode: VariantInventoryMode
  is_active: boolean
  low_stock_threshold: number
  options: OptionPair[]
}

interface Props {
  productId: string
  productSlug: string
  saleMode: ProductSaleMode
  productBasePriceCents: number
  variants: DbVariant[]
  inventory: Record<string, DbInventory>
}

const INVENTORY_MODES: {
  value: VariantInventoryMode
  label: string
  description: string
}[] = [
  {
    value: 'assembled',
    label: 'Assembled',
    description: 'Tracks packaged kit stock in inventory.',
  },
  {
    value: 'component_based',
    label: 'Component based',
    description: 'Availability is derived from linked materials and BOM.',
  },
  {
    value: 'unlimited',
    label: 'Unlimited',
    description: 'For digital or non-stock-limited products.',
  },
]

const INVENTORY_MODE_LABELS: Record<VariantInventoryMode, string> = {
  assembled: 'Assembled',
  component_based: 'Component based',
  unlimited: 'Unlimited',
}

function newOptionPair(key = '', value = ''): OptionPair {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    key,
    value,
  }
}

function optionPairsFromRecord(optionValues: Record<string, unknown>): OptionPair[] {
  return Object.entries(optionValues ?? {}).map(([key, value]) =>
    newOptionPair(key, typeof value === 'string' ? value : JSON.stringify(value)),
  )
}

function defaultInventoryMode(saleMode: ProductSaleMode): VariantInventoryMode {
  if (saleMode === 'digital') return 'unlimited'
  if (saleMode === 'stocked') return 'assembled'
  return 'component_based'
}

function formFromVariant(variant: DbVariant, inventory?: DbInventory): VariantFormState {
  return {
    variant_name: variant.variant_name,
    sku: variant.sku ?? '',
    price_cents: variant.price_cents,
    inventory_mode: variant.inventory_mode,
    is_active: variant.is_active,
    low_stock_threshold: inventory?.low_stock_threshold ?? 0,
    options: optionPairsFromRecord(variant.option_values),
  }
}

function collectPayload(form: VariantFormState): { payload: ProductVariantPayload | null; error: string | null } {
  if (!form.variant_name.trim()) return { payload: null, error: 'Variant name is required.' }
  if (!form.sku.trim()) return { payload: null, error: 'SKU is required.' }
  if (!Number.isFinite(form.price_cents) || form.price_cents < 0) {
    return { payload: null, error: 'Price cannot be negative.' }
  }
  if (!Number.isInteger(form.price_cents)) {
    return { payload: null, error: 'Price must be saved as whole cents.' }
  }
  if (!Number.isFinite(form.low_stock_threshold) || form.low_stock_threshold < 0) {
    return { payload: null, error: 'Low-stock threshold cannot be negative.' }
  }
  if (!Number.isInteger(form.low_stock_threshold)) {
    return { payload: null, error: 'Low-stock threshold must be a whole number.' }
  }

  const optionValues: Record<string, string> = {}
  for (const option of form.options) {
    const key = option.key.trim()
    const value = option.value.trim()

    if (!key && !value) continue
    if (!key || !value) return { payload: null, error: 'Each option needs both a label and a value.' }
    if (optionValues[key]) return { payload: null, error: `Option "${key}" is duplicated.` }
    optionValues[key] = value
  }

  return {
    payload: {
      variant_name: form.variant_name.trim(),
      sku: form.sku.trim(),
      price_cents: form.price_cents,
      inventory_mode: form.inventory_mode,
      is_active: form.is_active,
      option_values: optionValues,
      low_stock_threshold: form.low_stock_threshold,
    },
    error: null,
  }
}

function modeDescription(mode: VariantInventoryMode): string {
  return INVENTORY_MODES.find((item) => item.value === mode)?.description ?? ''
}

export function ProductVariantsManager({
  productId,
  productSlug,
  saleMode,
  productBasePriceCents,
  variants,
  inventory,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedVariantId, setSavedVariantId] = useState<string | null>(null)

  function makeCreateForm(): VariantFormState {
    return {
      variant_name: '',
      sku: '',
      price_cents: productBasePriceCents,
      inventory_mode: defaultInventoryMode(saleMode),
      is_active: true,
      low_stock_threshold: 0,
      options: [newOptionPair()],
    }
  }

  const [createForm, setCreateForm] = useState<VariantFormState>(() => makeCreateForm())
  const [forms, setForms] = useState<Record<string, VariantFormState>>(() =>
    Object.fromEntries(variants.map((variant) => [variant.id, formFromVariant(variant, inventory[variant.id])])),
  )

  function updateCreateForm(patch: Partial<VariantFormState>) {
    setCreateForm((current) => ({ ...current, ...patch }))
  }

  function updateVariantForm(variantId: string, patch: Partial<VariantFormState>) {
    setForms((current) => ({
      ...current,
      [variantId]: { ...current[variantId], ...patch },
    }))
  }

  function updateOption(
    formKind: 'create' | 'variant',
    variantId: string | null,
    optionId: string,
    patch: Partial<OptionPair>,
  ) {
    if (formKind === 'create') {
      setCreateForm((current) => ({
        ...current,
        options: current.options.map((option) => option.id === optionId ? { ...option, ...patch } : option),
      }))
      return
    }

    if (!variantId) return
    setForms((current) => ({
      ...current,
      [variantId]: {
        ...current[variantId],
        options: current[variantId].options.map((option) =>
          option.id === optionId ? { ...option, ...patch } : option,
        ),
      },
    }))
  }

  function addOption(formKind: 'create' | 'variant', variantId: string | null) {
    if (formKind === 'create') {
      setCreateForm((current) => ({ ...current, options: [...current.options, newOptionPair()] }))
      return
    }
    if (!variantId) return
    setForms((current) => ({
      ...current,
      [variantId]: {
        ...current[variantId],
        options: [...current[variantId].options, newOptionPair()],
      },
    }))
  }

  function removeOption(formKind: 'create' | 'variant', variantId: string | null, optionId: string) {
    if (formKind === 'create') {
      setCreateForm((current) => ({
        ...current,
        options: current.options.filter((option) => option.id !== optionId),
      }))
      return
    }
    if (!variantId) return
    setForms((current) => ({
      ...current,
      [variantId]: {
        ...current[variantId],
        options: current[variantId].options.filter((option) => option.id !== optionId),
      },
    }))
  }

  function handleCreate() {
    const { payload, error: validationError } = collectPayload(createForm)
    if (validationError || !payload) {
      setError(validationError)
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createProductVariant(productId, productSlug, payload)
      if (result.error) {
        setError(result.error)
        router.refresh()
        return
      }
      setCreateForm(makeCreateForm())
      setSavedVariantId('new')
      setTimeout(() => setSavedVariantId(null), 2500)
      router.refresh()
    })
  }

  function handleSave(variant: DbVariant) {
    const form = forms[variant.id]
    const { payload, error: validationError } = collectPayload(form)
    if (validationError || !payload) {
      setError(validationError)
      return
    }

    if (variant.is_active && !payload.is_active) {
      const confirmed = window.confirm('Deactivate this variant? It will stay visible in admin and historical references, but it will not appear as an active storefront option.')
      if (!confirmed) return
    }

    setError(null)
    startTransition(async () => {
      const result = await updateProductVariant(productId, productSlug, variant.id, payload)
      if (result.error) {
        setError(result.error)
        router.refresh()
        return
      }
      setSavedVariantId(variant.id)
      setTimeout(() => setSavedVariantId(null), 2500)
      router.refresh()
    })
  }

  function handleDelete(variant: DbVariant) {
    if (variant.is_active) {
      setError('Deactivate this variant before permanently deleting it.')
      return
    }

    const confirmed = window.confirm(
      `Permanently delete "${variant.variant_name}"? This cannot be undone.`,
    )
    if (!confirmed) return

    setError(null)
    startTransition(async () => {
      const result = await deleteProductVariant(productId, productSlug, variant.id)
      if (result.error) {
        setError(result.error)
        router.refresh()
        return
      }

      router.refresh()
    })
  }

  function renderOptionEditor(
    form: VariantFormState,
    formKind: 'create' | 'variant',
    variantId: string | null,
  ) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Option values</span>
          <button
            type="button"
            onClick={() => addOption(formKind, variantId)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add option
          </button>
        </div>

        {form.options.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            No option values. This will save as an empty object.
          </p>
        ) : (
          <div className="grid gap-2">
            {form.options.map((option) => (
              <div key={option.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  type="text"
                  value={option.key}
                  onChange={(event) => updateOption(formKind, variantId, option.id, { key: event.target.value })}
                  placeholder="Color"
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
                />
                <input
                  type="text"
                  value={option.value}
                  onChange={(event) => updateOption(formKind, variantId, option.id, { value: event.target.value })}
                  placeholder="Sea Blue"
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => removeOption(formKind, variantId, option.id)}
                  className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Remove option"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderFormFields(form: VariantFormState, onChange: (patch: Partial<VariantFormState>) => void) {
    const lowStockRelevant = form.inventory_mode === 'assembled'
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Variant name</span>
            <input
              type="text"
              value={form.variant_name}
              onChange={(event) => onChange({ variant_name: event.target.value })}
              required
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">SKU</span>
            <input
              type="text"
              value={form.sku}
              onChange={(event) => onChange({ sku: event.target.value })}
              required
              className="rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Price (USD cents)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={form.price_cents}
              onChange={(event) => onChange({ price_cents: Number(event.target.value) })}
              required
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Inventory mode</span>
            <select
              value={form.inventory_mode}
              onChange={(event) => onChange({ inventory_mode: event.target.value as VariantInventoryMode })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
            >
              {INVENTORY_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground/80">{modeDescription(form.inventory_mode)}</span>
          </label>

          {lowStockRelevant && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Low-stock threshold</span>
              <input
                type="number"
                min={0}
                step={1}
                value={form.low_stock_threshold}
                onChange={(event) => onChange({ low_stock_threshold: Number(event.target.value) })}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
              />
            </label>
          )}

          <label className="flex items-center gap-2.5 pt-5">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => onChange({ is_active: event.target.checked })}
              className="size-4 rounded border-input"
            />
            <span className="text-sm">Active storefront variant</span>
          </label>
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Variants</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage SKUs, option values, pricing, active status, and inventory mode.
          </p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {variants.length} variant{variants.length === 1 ? '' : 's'}
        </span>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-border bg-background p-4">
        <h3 className="text-sm font-medium">Create variant</h3>
        <div className="mt-4 space-y-4">
          {renderFormFields(createForm, updateCreateForm)}
          {renderOptionEditor(createForm, 'create', null)}
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className={cn(buttonVariants(), 'h-10 text-sm')}
          >
            <Plus className="mr-1.5 size-4" />
            Create variant
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {variants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No variants yet.
          </div>
        ) : (
          variants.map((variant) => {
            const form = forms[variant.id] ?? formFromVariant(variant, inventory[variant.id])
            const stock = inventory[variant.id]
            const hasAssembledStock = variant.inventory_mode === 'assembled'
            return (
              <article key={variant.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-medium">{variant.variant_name}</h3>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        variant.is_active
                          ? 'bg-sprout text-sprout-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}>
                        {variant.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        {INVENTORY_MODE_LABELS[variant.inventory_mode]}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {variant.sku || 'No SKU'} | ${(variant.price_cents / 100).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {hasAssembledStock && stock
                        ? `${stock.quantity_on_hand} on hand, ${stock.quantity_reserved} reserved, threshold ${stock.low_stock_threshold}`
                        : stock
                          ? `Preserved assembled snapshot: ${stock.quantity_on_hand} on hand, tracking ${stock.track_inventory ? 'on' : 'off'}`
                          : 'No assembled stock snapshot'}
                    </p>
                  </div>
                  {savedVariantId === variant.id && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sprout px-2 py-0.5 text-xs font-medium text-sprout-foreground">
                      <Check className="size-3" />
                      Saved
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  {renderFormFields(form, (patch) => updateVariantForm(variant.id, patch))}
                  {renderOptionEditor(form, 'variant', variant.id)}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSave(variant)}
                      disabled={isPending}
                      className={cn(buttonVariants({ variant: 'outline' }), 'h-10 text-sm')}
                    >
                      <Save className="mr-1.5 size-4" />
                      Save variant
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(variant)}
                      disabled={isPending || variant.is_active}
                      title={variant.is_active ? 'Deactivate this variant before deleting it.' : undefined}
                      className={cn(buttonVariants({ variant: 'destructive' }), 'h-10 text-sm')}
                    >
                      <Trash2 className="mr-1.5 size-4" />
                      Delete variant
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
