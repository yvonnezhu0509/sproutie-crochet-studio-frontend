import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export function CommunityHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 stitch-grid opacity-20" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 sm:px-8 lg:px-12 lg:pb-28 lg:pt-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          {/* Headline block */}
          <div className="flex flex-col gap-6">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Sproutie Community
            </p>
            <h1 className="text-balance font-heading text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[1.0] tracking-tight">
              Made by the<br className="hidden sm:block" /> community.
            </h1>
            <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              Share a design, show what you made, and exchange ideas with other
              crochet bag makers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#share"
                className={cn(buttonVariants({ variant: 'default' }), 'h-12 px-7 text-sm')}
              >
                Share a Design
              </Link>
              <Link
                href="#gallery"
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'h-12 px-6 text-sm text-foreground underline-offset-4 hover:underline',
                )}
              >
                Explore Community Projects
              </Link>
            </div>
          </div>

          {/* Community stat strip */}
          <div className="flex gap-10 lg:flex-col lg:items-end lg:gap-6 lg:pb-2">
            {[
              { value: '247', label: 'projects shared' },
              { value: '1.4k', label: 'community members' },
              { value: '89', label: 'bags finished this month' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5 lg:items-end">
                <span className="font-heading text-2xl font-semibold leading-none tracking-tight lg:text-3xl">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
