import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative min-h-[92svh] overflow-hidden">
      <div className="relative mx-auto grid max-w-7xl items-end gap-0 px-6 pb-16 pt-20 sm:px-8 lg:min-h-[92svh] lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16 lg:px-12 lg:pb-24 lg:pt-28">
        {/* Left — editorial text block */}
        <div className="flex flex-col gap-8 lg:pb-12">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Sproutie House — Est. 2024
          </p>

          <h1 className="text-balance font-heading text-[clamp(2.6rem,6vw,5.25rem)] font-semibold leading-[1.0] tracking-tight text-foreground">
            Every bag starts<br className="hidden sm:block" /> with an idea.
          </h1>

          <p className="max-w-sm text-pretty text-lg leading-relaxed text-muted-foreground">
            Original crochet bag kits from the studio — plus a guided design
            tool to turn your own inspiration into a bag you can make.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/design"
              className={cn(buttonVariants({ variant: 'default' }), 'h-12 px-7 text-sm')}
            >
              Open the Design Studio
            </Link>
            <Link
              href="/originals"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'h-12 px-6 text-sm text-foreground underline-offset-4 hover:underline',
              )}
            >
              Explore Studio Originals
            </Link>
          </div>

          <p className="text-xs text-muted-foreground/70">
            Prices in USD &middot; US crochet terminology &middot; Early-stage prototype
          </p>
        </div>

        {/* Right — dominant image, no border, slight reveal crop */}
        <div className="relative -mx-6 mt-10 sm:-mx-8 lg:mx-0 lg:mt-0">
          <div className="relative aspect-[3/4] overflow-hidden lg:aspect-auto lg:h-[80svh] lg:max-h-[760px]">
            <Image
              src="/hero-tote-flatlay.png"
              alt="An experimental crochet bag with translucent panels, watery blue and dusty pink yarn, on a cool white studio background"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </div>
          {/* floating caption */}
          <div className="absolute bottom-6 right-6 rounded-xl bg-background/90 px-4 py-2.5 backdrop-blur">
            <p className="text-xs font-medium text-muted-foreground">
              Untitled No. 4 — studio concept, 2024
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
