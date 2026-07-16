'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

export type Material = Database['public']['Tables']['materials']['Row']

export interface MaterialPayload {
  name: string
  sku: string
  category: string
  color: string
  unit: string
  quantity_on_hand: number
  quantity_reserved: number
  reorder_point: number
  unit_cost: number | null
  currency: string
  supplier_name: string
  supplier_url: string
  notes: string
  active: boolean
}

type MaterialMutationResult = {
  error: string | null
  material: Material | null
}

type MaterialValidationResult =
  | {
      error: string
      row: null
    }
  | {
      error: null
      row: Database['public']['Tables']['materials']['Insert']
    }

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function validateMaterialPayload(payload: MaterialPayload): MaterialValidationResult {
  const name = payload.name.trim()
  const category = payload.category.trim()
  const unit = payload.unit.trim()
  const currency = payload.currency.trim().toUpperCase()

  if (!name) return { error: 'Material name is required.', row: null }
  if (!category) return { error: 'Category is required.', row: null }
  if (!unit) return { error: 'Unit is required.', row: null }
  if (!/^[A-Z]{3}$/.test(currency)) {
    return { error: 'Currency must be a three-letter code like USD.', row: null }
  }

  const quantities = [
    ['quantity on hand', payload.quantity_on_hand],
    ['quantity reserved', payload.quantity_reserved],
    ['reorder point', payload.reorder_point],
  ] as const

  for (const [label, value] of quantities) {
    if (!Number.isFinite(value) || value < 0) {
      return { error: `${label} must be a non-negative number.`, row: null }
    }
  }

  if (payload.quantity_reserved > payload.quantity_on_hand) {
    return { error: 'Quantity reserved cannot exceed quantity on hand.', row: null }
  }

  if (payload.unit_cost !== null && (!Number.isFinite(payload.unit_cost) || payload.unit_cost < 0)) {
    return { error: 'Unit cost must be empty or a non-negative number.', row: null }
  }

  const supplierUrl = normalizeOptionalText(payload.supplier_url)
  if (supplierUrl) {
    try {
      new URL(supplierUrl)
    } catch {
      return { error: 'Supplier URL must be a valid URL.', row: null }
    }
  }

  return {
    error: null,
    row: {
      name,
      sku: normalizeOptionalText(payload.sku),
      category,
      color: normalizeOptionalText(payload.color),
      unit,
      quantity_on_hand: payload.quantity_on_hand,
      quantity_reserved: payload.quantity_reserved,
      reorder_point: payload.reorder_point,
      unit_cost: payload.unit_cost,
      currency,
      supplier_name: normalizeOptionalText(payload.supplier_name),
      supplier_url: supplierUrl,
      notes: normalizeOptionalText(payload.notes),
      active: payload.active,
    },
  }
}

function friendlyDatabaseError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('materials_sku_unique')) return 'A material with that SKU already exists.'
  if (lower.includes('row-level security')) return 'You do not have permission to change materials.'
  if (lower.includes('violates check constraint')) return 'One or more material values are outside the allowed range.'
  return 'Could not save the material. Please check the fields and try again.'
}

export async function upsertMaterial(
  payload: MaterialPayload,
  id?: string,
): Promise<MaterialMutationResult> {
  const validation = validateMaterialPayload(payload)
  if (validation.error || !validation.row) {
    return { error: validation.error ?? 'Material values are invalid.', material: null }
  }

  const supabase = await createClient()
  const row = validation.row
  const query = id
    ? supabase.from('materials').update(row).eq('id', id)
    : supabase.from('materials').insert(row)

  const { data, error } = await query.select().single()

  if (error) {
    console.error('[admin] upsertMaterial error:', error.message)
    return { error: friendlyDatabaseError(error.message), material: null }
  }

  revalidatePath('/admin/materials')
  revalidatePath('/admin')
  return { error: null, material: data }
}

export async function setMaterialActive(
  id: string,
  active: boolean,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('materials')
    .update({ active })
    .eq('id', id)

  if (error) {
    console.error('[admin] setMaterialActive error:', error.message)
    return { error: friendlyDatabaseError(error.message) }
  }

  revalidatePath('/admin/materials')
  revalidatePath('/admin')
  return { error: null }
}
