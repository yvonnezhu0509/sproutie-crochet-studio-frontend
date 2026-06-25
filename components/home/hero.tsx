import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Early-stage studio · Original kits + an AI design prototype
          </span>
          <h1 className="text-balance font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Turn an idea into a crochet bag you can actually make.
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Explore original crochet bag kits or use our guided design studio to
            create a tote inspired by your own colors, needs, and ideas.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/design"
              className={cn(buttonVariants({ variant: 'default' }), 'h-12 px-7 text-sm')}
            >
              Design Your Tote
            </Link>
            <Link
              href="/originals"
              className={cn(buttonVariants({ variant: 'outline' }), 'h-12 px-7 text-sm')}
            >
              Explore Studio Originals
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-3 -z-10 rounded-[2rem] stitch-grid opacity-60" />
          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_30px_80px_-40px_rgba(70,55,40,0.5)]">
            <div className="relative aspect-[5/4]">
              <Image
                src="/hero-tote-flatlay.png"
                alt="A large handmade crochet tote bag surrounded by yarn, wooden handles, and brass hardware"
                fill
                priority
                sizes="(min-width: 1024px) 560px, 90vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
