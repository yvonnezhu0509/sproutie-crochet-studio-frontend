import { Check } from 'lucide-react'
import { whySproutie } from '@/lib/content'

export function WhySproutie() {
  return (
    <section className="bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Why Sproutie
            </p>
            <h2 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Thoughtful design, honest about where we are.
            </h2>
            <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
              We are an early-stage studio. That means real, tested ideas — and
              plain language about what is a prototype, a draft, or a request.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {whySproutie.map((item) => (
              <li
                key={item.title}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Check className="size-4" />
                </span>
                <h3 className="font-heading text-base font-semibold">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
