import { NewsletterForm } from '@/components/newsletter-form'

export function Signup() {
  return (
    <section className="bg-foreground">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:items-end">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-background/50">
              Follow along
            </p>
            <h2 className="text-balance font-heading text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-background">
              Follow the studio as it grows.
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            <p className="text-pretty leading-relaxed text-background/70">
              Join the list for new kits, prototype releases, and early access
              to the AI Bag Design Studio.
            </p>
            <NewsletterForm dark />
            <p className="text-xs text-background/40">
              No spam — just occasional studio updates. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
