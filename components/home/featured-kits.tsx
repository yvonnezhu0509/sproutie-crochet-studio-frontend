import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { KitCard } from '@/components/kit-card'
import { getFeaturedKits } from '@/lib/products'

export function FeaturedKits() {
  const kits = getFeaturedKits()
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Featured original kits
          </p>
          <h2 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Designed, tested, and assembled in the studio.
          </h2>
        </div>
        <Link
          href="/originals"
          className={cn(buttonVariants({ variant: 'ghost' }), 'h-10 px-4')}
        >
          View all kits
          <ArrowRight className="size-4" data-icon="inline-end" />
        </Link>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {kits.map((kit) => (
          <KitCard key={kit.slug} kit={kit} />
        ))}
      </div>
    </section>
  )
}
