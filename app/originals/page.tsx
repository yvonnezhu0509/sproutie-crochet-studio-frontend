import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { originalKits } from '@/lib/products'

export const metadata: Metadata = {
  title: 'Studio Originals',
  description:
    'Original crochet bag kits designed, tested, and assembled by Sproutie House. Each kit includes yarn, hardware, handles, lining, and a printed pattern.',
}

export default function OriginalsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
      {/* Page header */}
      <div className="mb-16 grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:items-end">
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Studio Originals
          </p>
          <h1 className="text-balance font-heading text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight">
            Designed here.<br className="hidden lg:block" /> Made by you.
          </h1>
        </div>
        <div className="flex flex-col gap-3 lg:pb-1">
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Each original kit is designed and tested in the studio. Kits include
            all the yarn, hardware, handles, lining fabric, and a printed
            pattern &mdash; plus a downloadable PDF with photo tutorials.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Early-access phase &mdash; prices in USD &mdash; join the waitlist
            for availability updates.
          </p>
        </div>
      </div>

      {/* Product list — editorial borderless layout */}
      <ol className="flex flex-col gap-0 divide-y divide-border">
        {originalKits.map((kit, i) => (
          <li key={kit.slug}>
            <Link
              href={`/originals/${kit.slug}`}
              className="group grid gap-6 py-10 sm:grid-cols-[auto_1fr] sm:gap-10 lg:grid-cols-[320px_1fr]"
              aria-label={`View the ${kit.name} kit`}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted sm:aspect-square">
                <Image
                  src={kit.image}
                  alt={`${kit.name} crochet bag`}
                  fill
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 40vw, 90vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>

              {/* Details */}
              <div className="flex flex-col justify-center gap-4">
                <div className="flex flex-wrap items-start gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {kit.availability}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {kit.skillLevel}
                  </Badge>
                </div>

                <div>
                  <h2 className="font-heading text-2xl font-semibold leading-snug sm:text-3xl">
                    {kit.name}
                  </h2>
                  <p className="mt-1 font-heading text-xl font-semibold text-muted-foreground">
                    ${kit.price}
                  </p>
                </div>

                <p className="max-w-prose text-pretty leading-relaxed text-muted-foreground">
                  {kit.shortDescription}
                </p>

                <p className="text-xs text-muted-foreground/70">
                  {kit.makingTime} &middot; {kit.bagType} &middot;{' '}
                  {kit.construction}
                </p>

                <span className="mt-2 inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline-offset-4 group-hover:underline">
                  View kit details
                  <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
