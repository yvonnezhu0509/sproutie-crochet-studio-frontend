import type { Metadata } from 'next'
import { MaterialsManager } from '@/components/admin/materials-manager'
import { createClient } from '@/lib/supabase/server'
import type { Material } from './actions'

export const metadata: Metadata = { title: 'Materials' }

export default async function AdminMaterialsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('active', { ascending: false })
    .order('name', { ascending: true })

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Materials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage component inventory for yarn, hardware, packaging, and supplies.
          </p>
        </div>
      </div>

      {error ? (
        <div role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Materials could not be loaded. Check that your admin session has access.
        </div>
      ) : (
        <MaterialsManager initialMaterials={(data ?? []) as Material[]} />
      )}
    </div>
  )
}
