import type { Metadata } from 'next'
import { InventoryMovementsManager } from '@/components/admin/inventory-movements-manager'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Inventory Movements' }

export default async function AdminInventoryMovementsPage() {
  const supabase = await createClient()

  const [
    { data: materials, error: materialsError },
    { data: variants, error: variantsError },
    { data: inventory, error: inventoryError },
    { data: products, error: productsError },
    { data: movements, error: movementsError },
  ] = await Promise.all([
    supabase
      .from('materials')
      .select('id, name, sku, color, unit, quantity_on_hand, quantity_reserved, active')
      .order('active', { ascending: false })
      .order('name', { ascending: true }),
    supabase
      .from('product_variants')
      .select('id, product_id, sku, variant_name, is_active')
      .order('variant_name', { ascending: true }),
    supabase
      .from('inventory')
      .select('variant_id, quantity_on_hand, quantity_reserved, track_inventory'),
    supabase
      .from('products')
      .select('id, name')
      .order('name', { ascending: true }),
    supabase
      .from('inventory_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const loadError =
    materialsError || variantsError || inventoryError || productsError || movementsError

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Stock movements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record audited component and assembled-kit stock adjustments.
        </p>
      </div>

      {loadError ? (
        <div role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Inventory movement data could not be loaded. Check that your admin session has access.
        </div>
      ) : (
        <InventoryMovementsManager
          materials={materials ?? []}
          variants={variants ?? []}
          inventory={inventory ?? []}
          products={products ?? []}
          movements={movements ?? []}
        />
      )}
    </div>
  )
}
