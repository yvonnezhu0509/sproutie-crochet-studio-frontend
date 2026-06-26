import { whySproutie } from '@/lib/content'

export function WhySproutie() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:items-start">
        <div className="lg:pt-1">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            The studio
          </p>
          <h2 className="text-balance font-heading text-[clamp(1.8rem,3.5vw,3rem)] font-semibold leading-[1.08] tracking-tight">
            Thoughtful design, honest about where we are.
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-muted-foreground max-w-xs">
            We are an early-stage studio. That means real, tested ideas — and
            plain language about what is a prototype, a draft, or a request.
          </p>
        </div>

        <ul className="flex flex-col gap-0 divide-y divide-border">
          {whySproutie.map((item) => (
            <li key={item.title} className="flex flex-col gap-1.5 py-6 first:pt-0 last:pb-0">
              <h3 className="font-heading text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
