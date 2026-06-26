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

      {/* Asymmetric editorial grid: large first item, two smaller below */}
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-6">
        {/* Featured lead — full column height */}
        {kits[0] && (
          <Link
            href={`/originals/${kits[0].slug}`}
            className="group relative flex flex-col gap-5"
            aria-label={`View the ${kits[0].name} kit`}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
              <Image
                src={kits[0].image}
                alt={`${kits[0].name} crochet bag`}
                fill
                sizes="(min-width: 1024px) 48vw, 92vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute left-4 top-4">
                <Badge className="border-transparent bg-background/85 text-xs text-foreground backdrop-blur">
                  {kits[0].availability}
                </Badge>
              </div>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-heading text-2xl font-semibold leading-snug">
                  {kits[0].name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {kits[0].tagline}
                </p>
              </div>
              <span className="shrink-0 font-heading text-xl font-semibold">
                ${kits[0].price}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground/70">
              {kits[0].skillLevel} &middot; {kits[0].makingTime}
            </p>
          </Link>
        )}

        {/* Right column — two stacked smaller items */}
        <div className="flex flex-col gap-10 lg:justify-between">
          {kits.slice(1, 3).map((kit) => (
            <Link
              key={kit.slug}
              href={`/originals/${kit.slug}`}
              className="group flex gap-5 sm:gap-6"
              aria-label={`View the ${kit.name} kit`}
            >
              <div className="relative aspect-square w-36 shrink-0 overflow-hidden bg-muted sm:w-44">
                <Image
                  src={kit.image}
                  alt={`${kit.name} crochet bag`}
                  fill
                  sizes="176px"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex flex-col justify-center gap-2">
                <h3 className="font-heading text-lg font-semibold leading-snug">
                  {kit.name}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {kit.tagline}
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-base font-semibold">${kit.price}</span>
                  <Badge variant="secondary" className="text-xs">
                    {kit.availability}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
