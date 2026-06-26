'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, MessageCircle, Bookmark, SlidersHorizontal, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  communityProjects,
  FILTER_LABELS,
  STATUS_LABELS,
  type ProjectCategory,
  type CommunityProject,
} from '@/lib/community'
import { ProjectDetailModal } from './project-detail-modal'

const MAIN_FILTERS: ProjectCategory[] = [
  'all',
  'concepts',
  'wip',
  'finished',
  'studio-originals',
  'ai-assisted',
]

const BAG_TYPES = ['All types', 'Tote Bag', 'Shoulder Bag', 'Crossbody Bag', 'Crescent Bag', 'Bucket Bag', 'Mini Bag']
const SKILL_LEVELS = ['All levels', 'beginner', 'intermediate', 'advanced']

function ProjectCard({
  project,
  onSelect,
}: {
  project: CommunityProject
  onSelect: (p: CommunityProject) => void
}) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(project.likes)
  const [saved, setSaved] = useState(false)

  return (
    <article className="group flex flex-col gap-3">
      <button
        type="button"
        onClick={() => onSelect(project)}
        className="relative block w-full overflow-hidden bg-muted text-left"
        aria-label={`View ${project.title} by ${project.creator}`}
      >
        <div className="relative aspect-[4/3]">
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge
            variant={
              project.status === 'finished'
                ? 'default'
                : project.status === 'wip'
                  ? 'secondary'
                  : 'outline'
            }
            className="text-xs"
          >
            {STATUS_LABELS[project.status]}
          </Badge>
          {project.aiAssisted && (
            <Badge variant="outline" className="border-primary/30 bg-background/80 text-xs text-primary backdrop-blur">
              AI
            </Badge>
          )}
        </div>
      </button>

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onSelect(project)}
            className="text-left"
          >
            <h3 className="font-heading text-base font-semibold leading-snug hover:text-primary transition-colors">
              {project.title}
            </h3>
          </button>
          <p className="text-xs text-muted-foreground">
            {project.creator} &middot; {project.bagType}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {project.shortCaption}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => {
              setLiked((v) => !v)
              setLikeCount((c) => (liked ? c - 1 : c + 1))
            }}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs transition-colors',
              liked ? 'text-warm' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart className={cn('size-3.5', liked && 'fill-current')} />
            {likeCount}
          </button>
          {project.comments.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageCircle className="size-3.5" />
              {project.comments.length}
            </span>
          )}
          <button
            type="button"
            onClick={() => setSaved((v) => !v)}
            className={cn(
              'inline-flex text-xs transition-colors',
              saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            <Bookmark className={cn('size-3.5', saved && 'fill-current')} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function CommunityGallery() {
  const [activeFilter, setActiveFilter] = useState<ProjectCategory>('all')
  const [bagTypeFilter, setBagTypeFilter] = useState('All types')
  const [skillFilter, setSkillFilter] = useState('All levels')
  const [showSecondary, setShowSecondary] = useState(false)
  const [selected, setSelected] = useState<CommunityProject | null>(null)

  const filtered = communityProjects.filter((p) => {
    const matchCategory =
      activeFilter === 'all' || p.category.includes(activeFilter)
    const matchBagType =
      bagTypeFilter === 'All types' || p.bagType === bagTypeFilter
    const matchSkill =
      skillFilter === 'All levels' || p.skillLevel === skillFilter
    return matchCategory && matchBagType && matchSkill
  })

  return (
    <section id="gallery" className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12 lg:pb-32">
      {/* Heading */}
      <div className="mb-10">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Community Gallery
        </p>
        <h2 className="text-balance font-heading text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.05] tracking-tight">
          All projects.
        </h2>
      </div>

      {/* Filter bar */}
      <div className="mb-8 flex flex-col gap-4">
        {/* Main category filters */}
        <div className="flex flex-wrap items-center gap-2">
          {MAIN_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
                activeFilter === f
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
              )}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowSecondary((v) => !v)}
            className={cn(
              'ml-auto inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              showSecondary
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
            )}
          >
            <SlidersHorizontal className="size-3" />
            More filters
          </button>
        </div>

        {/* Secondary filters */}
        {showSecondary && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Bag type:</span>
              {BAG_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBagTypeFilter(t)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    bagTypeFilter === t
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Skill:</span>
              {SKILL_LEVELS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSkillFilter(s)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs capitalize transition-colors',
                    skillFilter === s
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {(bagTypeFilter !== 'All types' || skillFilter !== 'All levels') && (
              <button
                type="button"
                onClick={() => {
                  setBagTypeFilter('All types')
                  setSkillFilter('All levels')
                }}
                className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
                Clear
              </button>
            )}
          </div>
        )}

        {/* Result count */}
        <p className="text-xs text-muted-foreground">
          {filtered.length === communityProjects.length
            ? `${communityProjects.length} projects`
            : `${filtered.length} of ${communityProjects.length} projects`}
        </p>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} onSelect={setSelected} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 py-16">
          <p className="font-heading text-xl font-semibold">No projects match these filters.</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting the category or clearing the secondary filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveFilter('all')
              setBagTypeFilter('All types')
              setSkillFilter('All levels')
            }}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {selected && (
        <ProjectDetailModal project={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  )
}
