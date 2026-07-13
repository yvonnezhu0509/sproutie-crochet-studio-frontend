import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check, Clock, Layers, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getAllKits, getKitBySlug } from '@/lib/catalog'
import { AddToCartSection } from '@/components/cart/add-to-cart-section'

interface Props {
  params: Promise<{ slug: string }>
}

const STATUS_LABEL: Record<string, string> = {
  coming_soon: 'Waitlist',
  active: 'Early Access',
  sold_out: 'Sold Out',
}

export async function generateStaticParams() {
  const kits = await getAllKits()
  return kits.map((kit) => ({ slug: kit.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const kit = await getKitBySlug(slug)
  if (!kit) return {}
  return {
    title: kit.name,
    description: kit.shortDescription,
  }
}

export default async function KitDetailPage({ params }: Props) {
  const { slug } = await params
  const kit = await getKitBySlug(slug)
  if (!kit) notFound()

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12 lg:py-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/originals"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Studio Originals
        </Link>
      </nav>

      {/* Main grid */}
      <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-16">
        {/* Left — image gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            <Image
              src={kit.image}
              alt={`${kit.name} crochet bag`}
              fill
              priority
              sizes="(min-width: 1024px) 56vw, 90vw"
              className="object-cover"
            />
            <div className="absolute left-4 top-4 flex gap-2">
              <Badge variant="secondary">{STATUS_LABEL[kit.status] ?? kit.status}</Badge>
              <Badge variant="outline">{kit.difficulty}</Badge>
            </div>
          </div>

          {/* Thumbnail strip */}
          {kit.gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {kit.gallery.map((src, i) => (
                <div
                  key={i}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border"
                >
                  <Image
                    src={src}
                    alt={`${kit.name} view ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — product info + add to cart */}
        <div className="flex flex-col gap-6">
          {/* Title + price */}
          <div>
            <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {kit.name}
            </h1>
            <p className="mt-1 font-heading text-lg text-muted-foreground">{kit.tagline}</p>
            <p className="mt-4 font-heading text-3xl font-semibold">${kit.price.toFixed(0)}</p>
          </div>

          {/* Quick stats */}
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Layers className="size-4 text-primary" aria-hidden="true" />
              <dt className="sr-only">Skill level</dt>
              <dd>{kit.difficulty}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-primary" aria-hidden="true" />
              <dt className="sr-only">Making time</dt>
              <dd>{kit.makingTime}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="size-4 text-primary" aria-hidden="true" />
              <dt className="sr-only">Bag type</dt>
              <dd>{kit.bagType}</dd>
            </div>
          </dl>

          <p className="text-pretty leading-relaxed text-muted-foreground">
            {kit.shortDescription}
          </p>

          {/* Add to cart — client interactive section */}
          <AddToCartSection kit={kit} />

          {/* Kit contents */}
          {kit.kitContents.length > 0 && (
            <details className="group rounded-xl border border-border">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium">
                What&apos;s in the kit
                <span className="text-muted-foreground transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <ul className="flex flex-col gap-1.5 px-4 pb-4 pt-1">
                {kit.kitContents.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Techniques */}
          {kit.techniques.length > 0 && (
            <details className="group rounded-xl border border-border">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium">
                Techniques used
                <span className="text-muted-foreground transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <ul className="flex flex-wrap gap-2 px-4 pb-4 pt-1">
                {kit.techniques.map((t) => (
                  <li
                    key={t}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Dimensions */}
          {kit.dimensionsIn && (
            <p className="text-xs text-muted-foreground/70">
              Dimensions: {kit.dimensionsIn} &middot; {kit.dimensionsCm}
            </p>
          )}
        </div>
      </div>

      {/* Story section */}
      {kit.description && (
        <section aria-labelledby="story-heading" className="mt-16 max-w-2xl">
          <h2 id="story-heading" className="font-heading text-2xl font-semibold">
            Behind the design
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {kit.description}
          </p>
        </section>
      )}
    </div>
  )
}
