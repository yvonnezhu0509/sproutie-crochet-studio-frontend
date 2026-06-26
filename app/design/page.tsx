import type { Metadata } from 'next'
import { DesignLab } from '@/components/design-lab/design-lab'

export const metadata: Metadata = {
  title: 'Bag Design Studio',
  description:
    'Choose a bag style, describe your inspiration, and receive a draft construction plan and materials estimate. A guided, front-end-only prototype.',
}

export default function DesignPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
      {/* Page header */}
      <div className="mb-14 grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:items-end">
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            AI Bag Design Studio &mdash; Prototype
          </p>
          <h1 className="text-balance font-heading text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight">
            Design your own bag.
          </h1>
        </div>
        <div className="flex flex-col gap-3 lg:pb-1">
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Describe an inspiration. Choose a bag style, size, and materials.
            Receive a draft construction plan and an estimated materials list.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Frontend prototype only &mdash; no account, no payment, no live AI.
            Every concept is reviewed by a real person before a custom kit is
            offered.
          </p>
        </div>
      </div>

      <DesignLab />
    </div>
  )
}
