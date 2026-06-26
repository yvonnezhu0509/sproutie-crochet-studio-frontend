import { processSteps } from '@/lib/content'

export function Process() {
  return (
    <section className="bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mb-14 grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              How the Design Studio works
            </p>
            <h2 className="text-balance font-heading text-[clamp(1.8rem,3.5vw,3rem)] font-semibold leading-[1.08] tracking-tight">
              From a feeling<br className="hidden lg:block" /> to a draft you can hold.
            </h2>
          </div>
          <p className="self-end text-pretty leading-relaxed text-muted-foreground lg:max-w-sm">
            The Design Studio is an early prototype. Drafts it produces are starting
            points, not finished patterns — every concept is reviewed by a real person
            before a custom materials kit is offered.
          </p>
        </div>

        <ol className="grid gap-0 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {processSteps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-4 py-8 lg:px-8 lg:py-0">
              <span className="font-heading text-5xl font-semibold leading-none text-border">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-heading text-lg font-semibold leading-snug">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
