import Link from 'next/link'
import { ArrowRight, Sparkles, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const paths = [
  {
    icon: Sparkles,
    title: 'Design Your Own Tote',
    body: 'Start with an idea, choose the size and function, and explore a tote design built from compatible yarns, handles, and hardware.',
    href: '/design',
    cta: 'Enter the Design Lab',
    variant: 'default' as const,
  },
  {
    icon: Package,
    title: 'Shop Studio Originals',
    body: 'Discover distinctive crochet bag kits designed, tested, and assembled by Sproutie Crochet Studio.',
    href: '/originals',
    cta: 'View Original Kits',
    variant: 'outline' as const,
  },
]

export function TwoPaths() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-2">
        {paths.map((path) => (
          <div
            key={path.title}
            className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-8 sm:p-10"
          >
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <path.icon className="size-6" />
            </span>
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {path.title}
            </h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              {path.body}
            </p>
            <Link
              href={path.href}
              className={cn(
                buttonVariants({ variant: path.variant }),
                'mt-auto h-11 w-fit px-6 text-sm',
              )}
            >
              {path.cta}
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
