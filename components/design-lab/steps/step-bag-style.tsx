'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { DesignState } from '../design-lab'

const bagStyles = [
  {
    id: 'tote-large',
    name: 'Large Tote',
    description:
      'A roomy, structured tote sized for daily carry — laptop, groceries, or a yarn project.',
    available: true,
  },
  {
    id: 'shoulder-bag',
    name: 'Shoulder Bag',
    description: 'A mid-sized rounded bag worn on the shoulder with a longer strap.',
    available: false,
  },
  {
    id: 'crossbody',
    name: 'Crossbody Bag',
    description: 'A compact bag on an adjustable strap worn across the body.',
    available: false,
  },
  {
    id: 'crescent',
    name: 'Crescent Bag',
    description: 'A slim, half-moon shaped bag worn at the waist or over one shoulder.',
    available: false,
  },
  {
    id: 'bucket',
    name: 'Bucket Bag',
    description:
      'A cylindrical drawstring bag with a relaxed, gathered opening.',
    available: false,
  },
  {
    id: 'structured-handbag',
    name: 'Structured Handbag',
    description: 'A firm, box-shaped handbag with a flat base and short handles.',
    available: false,
  },
]

export function StepBagStyle({
  state,
  update,
}: {
  state: DesignState
  update: (patch: Partial<DesignState>) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Choose a bag style
        </h2>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          The Design Studio currently supports the Large Tote as its first
          prototype category. More bag styles are in development.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bagStyles.map((style) => {
          const active = state.bagStyle === style.id
          return (
            <button
              key={style.id}
              type="button"
              disabled={!style.available}
              onClick={() => style.available && update({ bagStyle: style.id })}
              aria-pressed={active}
              className={cn(
                'relative flex flex-col gap-2 rounded-2xl border p-5 text-left transition-colors',
                style.available
                  ? active
                    ? 'border-primary bg-secondary ring-1 ring-primary'
                    : 'border-border bg-background hover:border-primary/60'
                  : 'cursor-not-allowed border-border bg-muted/40 opacity-60',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'font-heading text-base font-semibold leading-snug',
                    !style.available && 'text-muted-foreground',
                  )}
                >
                  {style.name}
                </span>
                {!style.available && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    Coming Soon
                  </Badge>
                )}
                {style.available && active && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary">
                    <svg viewBox="0 0 12 12" className="size-3 text-primary-foreground" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {style.description}
              </p>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground/70">
        All other bag styles are planned for future releases. Only the Large
        Tote is available in this prototype.
      </p>
    </div>
  )
}
