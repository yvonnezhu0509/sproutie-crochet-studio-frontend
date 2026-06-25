import { NewsletterForm } from '@/components/newsletter-form'

export function Signup() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-primary px-6 py-14 text-primary-foreground sm:px-12 lg:py-20">
        <div className="absolute inset-0 -z-0 stitch-grid opacity-[0.12]" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Follow the studio as it grows.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-primary-foreground/80">
            Join the list for new kits, prototype releases, and early access to
            the AI Tote Design Lab.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <NewsletterForm />
          </div>
          <p className="mt-4 text-xs text-primary-foreground/70">
            No spam — just occasional studio updates. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
