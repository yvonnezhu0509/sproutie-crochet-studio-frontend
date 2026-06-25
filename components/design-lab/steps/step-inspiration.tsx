'use client'

import { ImagePlus, Check } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { inspirationChips } from '@/lib/design-lab'
import type { DesignState } from '../design-lab'

const EXAMPLE =
  'I want a roomy tote inspired by a quiet forest after rain, with muted green yarn, warm brown details, and comfortable handles.'

export function StepInspiration({
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
          Share your inspiration
        </h2>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          Describe a mood, a place, or a color story. We use this to understand
          mood, color, composition, and functional needs — not to copy an
          existing product.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <label htmlFor="inspiration" className="text-sm font-medium">
          Your inspiration
        </label>
        <Textarea
          id="inspiration"
          value={state.inspiration}
          onChange={(e) => update({ inspiration: e.target.value })}
          placeholder={EXAMPLE}
          rows={5}
          className="resize-none bg-background text-base leading-relaxed sm:text-sm"
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium">Need a starting point?</span>
        <div className="flex flex-wrap gap-2">
          {inspirationChips.map((chip) => {
            const active = state.inspiration.includes(chip)
            return (
              <button
                key={chip}
                type="button"
                onClick={() =>
                  update({
                    inspiration: state.inspiration
                      ? `${state.inspiration.replace(/\s*$/, '')} ${chip}.`
                      : `${chip}: `,
                  })
                }
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-secondary text-secondary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {chip}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Inspiration image (optional)</span>
        <button
          type="button"
          onClick={() => update({ imageAdded: !state.imageAdded })}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors',
            state.imageAdded
              ? 'border-primary bg-secondary/50'
              : 'border-border bg-background hover:border-primary/50',
          )}
        >
          {state.imageAdded ? (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-5" />
              </span>
              <span className="text-sm font-medium text-foreground">
                Sample image added
              </span>
              <span className="text-xs text-muted-foreground">
                (Mock upload — tap again to remove)
              </span>
            </>
          ) : (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <ImagePlus className="size-5" />
              </span>
              <span className="text-sm font-medium text-foreground">
                Add a reference image
              </span>
              <span className="text-xs text-muted-foreground">
                We read it for mood and color, not to reproduce it.
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
