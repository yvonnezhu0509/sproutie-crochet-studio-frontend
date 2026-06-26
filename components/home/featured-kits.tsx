import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getFeaturedKits } from '@/lib/products'

export function FeaturedKits() {
  const kits = getFeaturedKits()

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Studio Originals
          </p>
          <h2 className="text-balance font-heading text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight">
            Designed here. Made by you.
          </h2>
        </div>
        <Link
          href="/originals"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          View all kits
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Asymmetric editorial grid: 56% lead left, 44% right — 32px gap */}
      <div className="grid gap-y-8 lg:grid-cols-[56%_44%] lg:gap-x-8 lg:gap-y-0">
        {/* Left — featured lead: fixed 564px on desktop (= 2×270px cards + 24px gap) */}
        {kits[0] && (
          <Link
            href={`/originals/${kits[0].slug}`}
            className="group flex flex-col gap-4 lg:h-[564px]"
            aria-label={`View the ${kits[0].name} kit`}
          >
            {/* Image grows to fill remaining height after the text block */}
            <div className="relative aspect-[4/5] overflow-hidden bg-muted lg:aspect-auto lg:min-h-0 lg:flex-1">
              <Image
                src={kits[0].image}
                alt={`${kits[0].name} crochet bag`}
                fill
                sizes="(min-width: 1024px) 54vw, 92vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute left-3 top-3">
                <Badge className="border-transparent bg-background/85 text-xs text-foreground backdrop-blur">
                  {kits[0].availability}
                </Badge>
              </div>
            </div>
            {/* Text block — natural height, image above absorbs the rest */}
            <div className="flex shrink-0 flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-xl font-semibold leading-snug">
                    {kits[0].name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {kits[0].tagline}
                  </p>
                </div>
                <span className="shrink-0 font-heading text-lg font-semibold">
                  ${kits[0].price}
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground/70">
                {kits[0].skillLevel} &middot; {kits[0].makingTime}
              </p>
            </div>
          </Link>
        )}

        {/* Right column — two horizontal cards, 24px gap, each ~270px tall */}
        <div className="flex flex-col gap-6">
          {kits.slice(1, 3).map((kit) => (
            <Link
              key={kit.slug}
              href={`/originals/${kit.slug}`}
              className="group flex h-[270px] gap-0 overflow-hidden bg-muted/30"
              aria-label={`View the ${kit.name} kit`}
            >
              {/* Image — 46% of card width */}
              <div className="relative h-full w-[46%] shrink-0 overflow-hidden bg-muted">
                <Image
                  src={kit.image}
                  alt={`${kit.name} crochet bag`}
                  fill
                  sizes="(min-width: 1024px) 20vw, 45vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
              </div>
              {/* Text — remaining 54% */}
              <div className="flex flex-col justify-center gap-2 px-5 py-4">
                <Badge variant="secondary" className="w-fit text-xs">
                  {kit.availability}
                </Badge>
                <h3 className="font-heading text-base font-semibold leading-snug">
                  {kit.name}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {kit.tagline}
                </p>
                <span className="mt-auto font-heading text-sm font-semibold">
                  ${kit.price}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
