import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { processSteps } from '@/lib/content'

export function Process() {
  return (
    <section className="bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            How the AI-assisted process works
          </p>
          <h2 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            From a feeling to a draft you can hold.
          </h2>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-full border border-primary/30 bg-background font-heading text-base font-semibold text-primary">
                {i + 1}
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

        <Alert className="mt-8 border-border bg-card">
          <Info />
          <AlertTitle>Drafts come first, kits come after review.</AlertTitle>
          <AlertDescription>
            Generated patterns are drafts and will require a feasibility review
            before a custom materials kit is offered. Nothing is guaranteed to
            work straight out of the lab.
          </AlertDescription>
        </Alert>
      </div>
    </section>
  )
}
