import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Orders',
}

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your kit orders and purchase history.
        </p>
      </div>

      {/* Empty state columns — ready to wire up once orders table exists */}
      <div className="overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">
        <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="size-6 text-secondary-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold">No orders yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground text-balance">
              Sproutie kits are in an early-access phase. Once kit orders are open, your purchases will show here.
            </p>
          </div>
          <Link
            href="/originals"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Browse Studio Originals
          </Link>
        </div>
      </div>

      {/* Placeholder table header — shows the intended data structure */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Upcoming columns
          </p>
        </div>
        <div className="grid grid-cols-4 gap-4 px-5 py-3 text-xs text-muted-foreground">
          <span>Order number</span>
          <span>Kit name</span>
          <span>Date</span>
          <span>Status</span>
        </div>
      </div>
    </div>
  )
}
