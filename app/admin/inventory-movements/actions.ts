'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const MOVEMENT_TYPES = [
  'purchase',
  'assembly',
  'sale',
  'return',
  'damage',
  'correction',
  'reservation_release',
  'other',
] as const

export type InventoryTargetType = 'material' | 'variant'

export interface InventoryMovementPayload {
  targetType: InventoryTargetType
  targetId: string
  movement_type: string
  quantity_delta: number
  reference_type: string
  reference_id: string
  note: string
}

type MovementResult = {
  error: string | null
  newQuantity: number | null
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function validatePayload(payload: InventoryMovementPayload): string | null {
  if (payload.targetType !== 'material' && payload.targetType !== 'variant') {
    return 'Choose a material or assembled kit target.'
  }
  if (!payload.targetId) return 'Choose an inventory target.'
  if (!MOVEMENT_TYPES.includes(payload.movement_type as typeof MOVEMENT_TYPES[number])) {
    return 'Choose a valid movement type.'
  }
  if (!Number.isFinite(payload.quantity_delta) || payload.quantity_delta === 0) {
    return 'Quantity delta must be non-zero.'
  }
  if (payload.targetType === 'variant' && !Number.isInteger(payload.quantity_delta)) {
    return 'Assembled kit stock changes must use whole-number quantities.'
  }
  return null
}

function friendlyMovementError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('function') && lower.includes('does not exist')) {
    return 'Inventory movement functions have not been applied yet.'
  }
  if (lower.includes('admin access') || lower.includes('row-level security')) {
    return 'You do not have permission to record inventory movements.'
  }
  if (lower.includes('reserved quantity')) return 'This movement would reduce stock below the reserved quantity.'
  if (lower.includes('negative')) return 'This movement would make stock negative.'
  if (lower.includes('not found')) return 'The selected inventory target was not found.'
  if (lower.includes('whole-number')) return 'Assembled kit stock changes must use whole-number quantities.'
  if (lower.includes('non-zero')) return 'Quantity delta must be non-zero.'
  return 'Could not record the inventory movement. Please check the fields and try again.'
}

export async function recordInventoryMovement(
  payload: InventoryMovementPayload,
): Promise<MovementResult> {
  const validationError = validatePayload(payload)
  if (validationError) return { error: validationError, newQuantity: null }

  const supabase = await createClient()

  if (payload.targetType === 'material') {
    const { data: material, error } = await supabase
      .from('materials')
      .select('quantity_on_hand, quantity_reserved')
      .eq('id', payload.targetId)
      .maybeSingle()

    if (error) {
      console.error('[admin] recordInventoryMovement material preflight error:', error.message)
      return { error: friendlyMovementError(error.message), newQuantity: null }
    }
    if (!material) return { error: 'The selected material was not found.', newQuantity: null }
    if (material.quantity_on_hand + payload.quantity_delta < 0) {
      return { error: 'This movement would make stock negative.', newQuantity: null }
    }
    if (material.quantity_on_hand + payload.quantity_delta < material.quantity_reserved) {
      return { error: 'This movement would reduce stock below the reserved quantity.', newQuantity: null }
    }

    const { data, error: rpcError } = await supabase
      .rpc('record_material_inventory_movement', {
        p_material_id: payload.targetId,
        p_movement_type: payload.movement_type,
        p_quantity_delta: payload.quantity_delta,
        p_reference_type: normalizeOptionalText(payload.reference_type),
        p_reference_id: normalizeOptionalText(payload.reference_id),
        p_note: normalizeOptionalText(payload.note),
      })
      .single()

    if (rpcError) {
      console.error('[admin] record material movement error:', rpcError.message)
      return { error: friendlyMovementError(rpcError.message), newQuantity: null }
    }

    revalidatePath('/admin/inventory-movements')
    revalidatePath('/admin/materials')
    return { error: null, newQuantity: data.new_quantity }
  }

  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('quantity_on_hand, quantity_reserved')
    .eq('variant_id', payload.targetId)
    .maybeSingle()

  if (error) {
    console.error('[admin] recordInventoryMovement variant preflight error:', error.message)
    return { error: friendlyMovementError(error.message), newQuantity: null }
  }
  if (!inventory) return { error: 'No inventory row exists for the selected variant.', newQuantity: null }
  if (inventory.quantity_on_hand + payload.quantity_delta < 0) {
    return { error: 'This movement would make stock negative.', newQuantity: null }
  }
  if (inventory.quantity_on_hand + payload.quantity_delta < inventory.quantity_reserved) {
    return { error: 'This movement would reduce stock below the reserved quantity.', newQuantity: null }
  }

  const { data, error: rpcError } = await supabase
    .rpc('record_variant_inventory_movement', {
      p_variant_id: payload.targetId,
      p_movement_type: payload.movement_type,
      p_quantity_delta: payload.quantity_delta,
      p_reference_type: normalizeOptionalText(payload.reference_type),
      p_reference_id: normalizeOptionalText(payload.reference_id),
      p_note: normalizeOptionalText(payload.note),
    })
    .single()

  if (rpcError) {
    console.error('[admin] record variant movement error:', rpcError.message)
    return { error: friendlyMovementError(rpcError.message), newQuantity: null }
  }

  revalidatePath('/admin/inventory-movements')
  revalidatePath('/admin/products')
  return { error: null, newQuantity: data.new_quantity }
}
