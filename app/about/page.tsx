import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Sproutie House is a creative crochet studio focused on original, approachable, and design-led crochet kits.',
}

const sections = [
  {
    id: 'why-sproutie',
    eyebrow: 'Why Sproutie House',
    heading: 'A studio built around making.',
    body: [
      'Sproutie House started from a simple frustration: most crochet bag patterns feel either too basic or unnecessarily complicated, and the materials you need are rarely curated to work together well.',
      'The studio is focused on original, design-led crochet kits — patterns that have been thought through carefully, materials that are chosen to fit the project, and a process that makes the making part feel good.',
    ],
  },
  {
    id: 'designed-to-be-made',
    eyebrow: 'Designed to Be Made',
    heading: 'Distinctive without being difficult.',
    body: [
      'Every kit here is made to be made — not just to look good in a photo. Projects are designed to feel visually interesting without relying on unnecessarily complicated construction or excessive sewing and assembly.',
      'Sproutie House does not primarily sell finished products. The point is to help people participate in the making process, and to make that process worth the time it takes.',
    ],
  },
  {
    id: 'ai-assisted',
    eyebrow: 'AI-Assisted, Human-Reviewed',
    heading: 'AI as a creative tool, not a shortcut.',
    body: [
      'The Design Studio uses AI to help turn inspiration into a design concept — bag shape, color direction, yarn selection, construction approach. It is genuinely useful as a starting point.',
      'But AI-generated output is always a draft. Stitch counts, construction methods, material compatibility, and structural feasibility all require a real person to verify before any kit is offered. The design judgment stays human.',
    ],
  },
  {
    id: 'future',
    eyebrow: 'A House for Future Craft',
    heading: 'Starting with bags. Not ending there.',
    body: [
      'Crochet bags are the starting point — they are compact enough to test well and specific enough to design thoughtfully. But the intent is broader.',
      'In the future, Sproutie House may expand into knitting, home objects, and physical creative spaces. For now, the focus is on making the kit experience as good as it can be.',
    ],
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
      {/* Page header */}
      <PageHeader
        eyebrow="About"
        title="A crochet studio for playful making."
        description="Sproutie House is small, early, and focused on doing one thing well — creating crochet kits that are genuinely worth making."
        className="mb-20"
      />

      {/* Sections */}
      <div className="flex flex-col gap-0 divide-y divide-border">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="grid gap-8 py-16 lg:grid-cols-[1fr_1.8fr] lg:gap-20 lg:py-20"
          >
            {/* Left */}
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                {section.eyebrow}
              </p>
              <h2
                id={`${section.id}-heading`}
                className="text-balance font-heading text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-[1.1] tracking-tight"
              >
                {section.heading}
              </h2>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-4">
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-pretty leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-start gap-4 border-t border-border pt-16 sm:flex-row sm:items-center">
        <Link
          href="/originals"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Explore the Collection
        </Link>
        <Link
          href="/design"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Visit the Design Studio
        </Link>
      </div>
    </div>
  )
}
