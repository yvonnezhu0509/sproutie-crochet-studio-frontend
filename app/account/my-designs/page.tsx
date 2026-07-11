import Link from 'next/link'
import { Palette } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Designs',
}

export default function MyDesignsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">My Designs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bag concepts you have created in the Design Studio.
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
          <Palette className="size-6 text-secondary-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold">No saved designs yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground text-balance">
            Designs you save from the AI Bag Design Studio will appear here. Start by building your first concept.
          </p>
        </div>
        <Link
          href="/design"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open Design Studio
        </Link>
      </div>
    </div>
  )
}
