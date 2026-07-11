import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Saved Kits',
}

export default function SavedKitsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Saved Kits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Studio Originals and kits you have bookmarked.
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
          <Bookmark className="size-6 text-secondary-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold">No saved kits yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground text-balance">
            Bookmark kits from the Studio Originals page to keep track of the ones you want to make.
          </p>
        </div>
        <Link
          href="/originals"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse Studio Originals
        </Link>
      </div>
    </div>
  )
}
