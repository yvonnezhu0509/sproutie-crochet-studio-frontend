import type { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'
import { CommunityHero } from '@/components/community/community-hero'
import { FeaturedProjects } from '@/components/community/featured-projects'
import { CommunityGallery } from '@/components/community/community-gallery'
import { ShareForm } from '@/components/community/share-form'
import { communityGuidelines } from '@/lib/community'

export const metadata: Metadata = {
  title: 'Community',
  description:
    'Share a design, show what you made, and exchange ideas with other crochet bag makers in the Sproutie community.',
}

export default function CommunityPage() {
  return (
    <div>
      <CommunityHero />

      <Separator />

      <FeaturedProjects />

      <Separator />

      <CommunityGallery />

      <Separator />

      {/* Share a design */}
      <section id="share" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          {/* Left — heading + guidelines */}
          <div className="flex flex-col gap-8">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Share Your Work
              </p>
              <h2 className="text-balance font-heading text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.05] tracking-tight">
                Add your project to the community.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                Share a design concept, a work in progress, or a finished bag.
                The community is here to discuss, give feedback, and get inspired
                — not to judge.
              </p>
            </div>

            {/* Community guidelines */}
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Community guidelines
              </p>
              <ul className="flex flex-col gap-2">
                {communityGuidelines.map((g) => (
                  <li key={g} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — form */}
          <div>
            <ShareForm />
          </div>
        </div>
      </section>
    </div>
  )
}
