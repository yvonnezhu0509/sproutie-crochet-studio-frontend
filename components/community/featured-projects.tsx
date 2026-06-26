'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Heart, MessageCircle, Bookmark } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { featuredProjects, STATUS_LABELS, type CommunityProject } from '@/lib/community'
import { ProjectDetailModal } from './project-detail-modal'
import { cn } from '@/lib/utils'

function StatusBadge({ status }: { status: CommunityProject['status'] }) {
  return (
    <Badge
      variant={status === 'finished' ? 'default' : status === 'wip' ? 'secondary' : 'outline'}
      className="text-xs"
    >
      {STATUS_LABELS[status]}
    </Badge>
  )
}

function LikeButton({ initialCount }: { initialCount: number }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setLiked((prev) => {
          setCount((c) => (prev ? c - 1 : c + 1))
          return !prev
        })
      }}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs transition-colors',
        liked ? 'text-warm' : 'text-muted-foreground hover:text-foreground',
      )}
      aria-label={liked ? 'Unlike project' : 'Like project'}
    >
      <Heart className={cn('size-3.5', liked && 'fill-current')} aria-hidden="true" />
      {count}
    </button>
  )
}

function SaveButton() {
  const [saved, setSaved] = useState(false)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setSaved((v) => !v)
      }}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs transition-colors',
        saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
      aria-label={saved ? 'Unsave project' : 'Save project'}
    >
      <Bookmark className={cn('size-3.5', saved && 'fill-current')} aria-hidden="true" />
    </button>
  )
}

export function FeaturedProjects() {
  const [selected, setSelected] = useState<CommunityProject | null>(null)
  const projects = featuredProjects

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
      {/* Section heading */}
      <div className="mb-12 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Featured Work
          </p>
          <h2 className="text-balance font-heading text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.05] tracking-tight">
            From the community.
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground lg:text-right">
          Selected projects from makers in the Sproutie community — concepts,
          works in progress, and finished bags.
        </p>
      </div>

      {/* Editorial asymmetric grid */}
      <div className="grid gap-6 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
        {/* Hero feature — large, spans 7 columns */}
        {projects[0] && (
          <button
            type="button"
            onClick={() => setSelected(projects[0])}
            className="group flex flex-col gap-4 text-left lg:col-span-7"
            aria-label={`View ${projects[0].title} by ${projects[0].creator}`}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted lg:aspect-[16/11]">
              <Image
                src={projects[0].image}
                alt={projects[0].title}
                fill
                sizes="(min-width: 1024px) 58vw, 92vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                priority
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <StatusBadge status={projects[0].status} />
                {projects[0].aiAssisted && (
                  <Badge variant="outline" className="border-primary/30 bg-background/80 text-xs text-primary backdrop-blur">
                    AI-assisted
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
                  {projects[0].title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {projects[0].creator} &middot; {projects[0].bagType}
                </p>
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {projects[0].shortCaption}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                <LikeButton initialCount={projects[0].likes} />
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageCircle className="size-3.5" aria-hidden="true" />
                  {projects[0].comments.length}
                </div>
                <SaveButton />
              </div>
            </div>
          </button>
        )}

        {/* Right column — two stacked medium cards, spans 5 */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {projects.slice(1, 3).map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setSelected(p)}
              className="group flex flex-col gap-3 text-left"
              aria-label={`View ${p.title} by ${p.creator}`}
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(min-width: 1024px) 40vw, 92vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute left-3 top-3">
                  <StatusBadge status={p.status} />
                </div>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-base font-semibold leading-snug">
                    {p.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.creator} &middot; {p.bagType}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 pt-0.5">
                  <LikeButton initialCount={p.likes} />
                  <SaveButton />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom row — two remaining featured items, 6 + 6 */}
        {projects.slice(3, 5).map((p) => (
          <button
            type="button"
            key={p.id}
            onClick={() => setSelected(p)}
            className="group flex flex-col gap-3 text-left lg:col-span-6"
            aria-label={`View ${p.title} by ${p.creator}`}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
              <Image
                src={p.image}
                alt={p.title}
                fill
                sizes="(min-width: 1024px) 48vw, 92vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute left-3 top-3 flex gap-2">
                <StatusBadge status={p.status} />
                {p.aiAssisted && (
                  <Badge variant="outline" className="border-primary/30 bg-background/80 text-xs text-primary backdrop-blur">
                    AI-assisted
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-lg font-semibold leading-snug">
                  {p.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.creator} &middot; {p.bagType}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {p.shortCaption}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                <LikeButton initialCount={p.likes} />
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageCircle className="size-3.5" aria-hidden="true" />
                  {p.comments.length}
                </div>
                <SaveButton />
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <ProjectDetailModal
          project={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}
