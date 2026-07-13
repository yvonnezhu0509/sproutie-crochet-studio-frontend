import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Learn about Sproutie House Studio Originals crochet kits and the AI-assisted Design Studio — two ways to make a bag that feels like yours.',
}

const kitIncludes = [
  'Yarn and all required materials',
  'Hardware and accessories',
  'Step-by-step printed instructions',
  'Difficulty level and major techniques listed up front',
  'Estimated making time',
]

const studioSteps = [
  {
    number: '01',
    title: 'Choose a bag shape',
    description:
      'Start by selecting the silhouette that fits your vision — tote, crescent, shoulder bag, or another shape from the available options.',
  },
  {
    number: '02',
    title: 'Describe your inspiration',
    description:
      'Share a mood, a color story, a place, or a visual reference. The Design Studio reads for feeling and direction, not to reproduce an existing product.',
  },
  {
    number: '03',
    title: 'Select size, colors, yarn, and handles',
    description:
      'Choose from compatible yarn weights and colorways, hardware options, and handle styles. Combinations that would not hold up structurally are flagged.',
  },
  {
    number: '04',
    title: 'Receive an AI-assisted concept draft',
    description:
      'The studio assembles a concept summary, a draft construction plan, and an estimated materials list based on your selections.',
  },
  {
    number: '05',
    title: 'Human feasibility review',
    description:
      'A real person reviews the design for construction accuracy, stitch counts, material selection, structural feasibility, cost, and difficulty before any kit is offered.',
  },
  {
    number: '06',
    title: 'Receive a custom kit proposal',
    description:
      'If the design passes review, you receive a custom kit proposal with finalized materials and pricing.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
      {/* Page header */}
      <PageHeader
        eyebrow="How It Works"
        title="Two ways to make a bag."
        description="Sproutie House offers original kits designed and tested in the studio, and an experimental Design Studio that helps you build a concept from your own inspiration."
        className="mb-20"
      />

      {/* ── Section 1: Studio Originals ── */}
      <section aria-labelledby="originals-heading" className="mb-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.8fr] lg:gap-20 lg:items-start">
          {/* Left label */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Path one
            </p>
            <h2
              id="originals-heading"
              className="text-balance font-heading text-[clamp(1.8rem,3.5vw,2.75rem)] font-semibold leading-[1.1] tracking-tight"
            >
              Studio Originals
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              Each kit starts as an original design from the studio — developed,
              tested, and assembled with the materials needed to make it. You
              choose a kit, follow the pattern, and end up with something that
              works and feels distinctive.
            </p>
          </div>

          {/* Right — what each kit includes */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Each kit is designed to include
            </p>
            <ul className="flex flex-col gap-4">
              {kitIncludes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Basic tools such as a crochet hook and yarn needle are listed in
              each kit but are not included. Exact contents are shown on each
              product page.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mb-24 h-px bg-border" />

      {/* ── Section 2: Design Studio ── */}
      <section aria-labelledby="studio-heading" className="mb-24">
        <div className="mb-14 grid gap-6 lg:grid-cols-[1fr_1.5fr] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Path two
            </p>
            <h2
              id="studio-heading"
              className="text-balance font-heading text-[clamp(1.8rem,3.5vw,2.75rem)] font-semibold leading-[1.1] tracking-tight"
            >
              Design Studio
            </h2>
          </div>
          <div>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              The Design Studio is an experimental tool that turns your
              inspiration, preferences, and bag requirements into an
              AI-assisted design concept. It is an early-access prototype — the
              process below describes how it works today.
            </p>
          </div>
        </div>

        {/* Steps */}
        <ol className="flex flex-col gap-0 divide-y divide-border">
          {studioSteps.map((step) => (
            <li key={step.number} className="grid gap-4 py-8 sm:grid-cols-[3rem_1fr] sm:gap-8 lg:grid-cols-[5rem_1fr]">
              <span
                className="font-heading text-sm font-semibold tabular-nums text-muted-foreground/60"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <div>
                <h3 className="mb-1.5 font-heading text-lg font-semibold leading-snug">
                  {step.title}
                </h3>
                <p className="text-pretty leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Important notes */}
        <div className="mt-10 rounded-2xl border border-border bg-muted/50 p-8">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Important to know
          </p>
          <ul className="flex flex-col gap-3">
            {[
              'AI-generated results are concept drafts. They are not guaranteed to be immediately crochet-ready.',
              'Construction, stitch counts, material selection, structural feasibility, cost, and difficulty must all be verified by a human before a kit can be offered.',
              'The Design Studio is an early-access prototype. Not all features are complete.',
            ].map((note) => (
              <li key={note} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
                  aria-hidden="true"
                />
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTAs ── */}
      <div className="flex flex-col items-start gap-4 border-t border-border pt-16 sm:flex-row sm:items-center">
        <Link
          href="/originals"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Explore Original Kits
        </Link>
        <Link
          href="/design"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Open Design Studio
        </Link>
      </div>
    </div>
  )
}
