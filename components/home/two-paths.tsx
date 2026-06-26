import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export function TwoPaths() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
      <p className="mb-12 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
        Two ways in
      </p>

      <div className="grid gap-0 divide-y divide-border sm:divide-x sm:divide-y-0 sm:grid-cols-2">
        {/* Path A */}
        <div className="flex flex-col gap-6 pb-12 pr-0 sm:pb-0 sm:pr-12 lg:pr-16">
          <span className="font-heading text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-foreground text-balance">
            Design your own bag
          </span>
          <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
            Describe a mood or a color story. Choose a bag style, size, and
            materials. Receive a draft construction plan and a materials
            estimate.
          </p>
          <Link
            href="/design"
            className="group mt-2 inline-flex w-fit items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
          >
            Open the Design Studio
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
          <p className="text-xs text-muted-foreground/70">
            Frontend prototype only &middot; No account required
          </p>
        </div>

        {/* Path B */}
        <div className="flex flex-col gap-6 pl-0 pt-12 sm:pl-12 sm:pt-0 lg:pl-16">
          <span className="font-heading text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-foreground text-balance">
            Shop Studio Originals
          </span>
          <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
            Original crochet bag kits designed, tested, and assembled in the
            studio — with everything you need to start making.
          </p>
          <Link
            href="/originals"
            className="group mt-2 inline-flex w-fit items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
          >
            Explore original kits
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
          <p className="text-xs text-muted-foreground/70">
            Early-access pricing &middot; Prices in USD
          </p>
        </div>
      </div>
    </section>
  )
}
