import Image from 'next/image'
import Link from 'next/link'
import { Clock, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { OriginalKit } from '@/lib/products'

const availabilityVariant: Record<
  OriginalKit['availability'],
  'secondary' | 'outline'
> = {
  Prototype: 'outline',
  Waitlist: 'outline',
  'Early Access': 'secondary',
}

export function KitCard({ kit }: { kit: OriginalKit }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-[0_12px_40px_-20px_rgba(70,55,40,0.45)]">
      <Link
        href={`/originals/${kit.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-muted"
        aria-label={`View the ${kit.name} kit`}
      >
        <Image
          src={kit.image || '/placeholder.svg'}
          alt={`${kit.name} crochet bag kit`}
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="border-transparent bg-background/90 text-foreground backdrop-blur">
            Original design
          </Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-lg font-semibold leading-snug">
            <Link href={`/originals/${kit.slug}`} className="hover:underline">
              {kit.name}
            </Link>
          </h3>
          <span className="shrink-0 font-heading text-lg font-semibold text-foreground">
            ${kit.price}
          </span>
        </div>

        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {kit.shortDescription}
        </p>

        <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
            <dt className="sr-only">Skill level</dt>
            <dd>{kit.skillLevel}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" />
            <dt className="sr-only">Estimated making time</dt>
            <dd>{kit.makingTime}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <Badge variant={availabilityVariant[kit.availability]}>
            {kit.availability}
          </Badge>
          <Link
            href={`/originals/${kit.slug}`}
            className={cn(buttonVariants({ variant: 'outline' }), 'h-9 px-4')}
          >
            View Kit
          </Link>
        </div>
      </div>
    </article>
  )
}
