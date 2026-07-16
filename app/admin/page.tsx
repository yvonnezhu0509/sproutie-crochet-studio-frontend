import type { Metadata } from 'next'
import Link from 'next/link'
import { Package, ArrowRight } from 'lucide-react'
import { getAllKitsAdmin } from '@/lib/catalog'
import type { ProductStatus } from '@/lib/catalog'

export const metadata: Metadata = { title: 'Dashboard' }

const STATUS_COLORS: Record<ProductStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  coming_soon: 'bg-citrine text-citrine-foreground',
  active: 'bg-sprout text-sprout-foreground',
  sold_out: 'bg-warm text-warm-foreground',
  archived: 'bg-muted text-muted-foreground',
}

export default async function AdminDashboardPage() {
  const kits = await getAllKitsAdmin()

  const counts = kits.reduce<Record<ProductStatus, number>>(
    (acc, k) => {
      acc[k.status] = (acc[k.status] ?? 0) + 1
      return acc
    },
    { draft: 0, coming_soon: 0, active: 0, sold_out: 0, archived: 0 },
  )

  const stats = [
    { label: 'Total products', value: kits.length },
    { label: 'Active', value: counts.active },
    { label: 'Coming soon', value: counts.coming_soon },
    { label: 'Draft', value: counts.draft },
  ]

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-heading text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Package className="size-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Products</p>
              <p className="text-xs text-muted-foreground">Manage the product catalog</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
        </Link>
        <Link
          href="/admin/materials"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Package className="size-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Materials</p>
              <p className="text-xs text-muted-foreground">Manage component inventory</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
        </Link>
      </div>

      {/* Recent products */}
      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold">All products</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Name
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {kits.map((kit) => (
                <tr key={kit.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/products/${kit.id}`}
                      className="hover:text-primary hover:underline underline-offset-4"
                    >
                      {kit.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground sm:table-cell">
                    {kit.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[kit.status]}`}
                    >
                      {kit.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    ${kit.price.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
