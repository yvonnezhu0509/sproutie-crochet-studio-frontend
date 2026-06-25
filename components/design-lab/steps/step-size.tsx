'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { toteSizes, carryOptions } from '@/lib/design-lab'
import type { DesignState } from '../design-lab'

export function StepSize({
  state,
  update,
}: {
  state: DesignState
  update: (patch: Partial<DesignState>) => void
}) {
  function toggleCarry(id: string) {
    update({
      carry: state.carry.includes(id)
        ? state.carry.filter((c) => c !== id)
        : [...state.carry, id],
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Choose size &amp; use
        </h2>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          Pick one of our three constrained tote sizes. Measurements are shown
          in inches first, with centimeters in parentheses.
        </p>
      </header>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Tote size</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {toteSizes.map((size) => {
            const active = state.sizeId === size.id
            return (
              <button
                key={size.id}
                type="button"
                onClick={() => update({ sizeId: size.id })}
                aria-pressed={active}
                className={cn(
                  'flex flex-col gap-2 rounded-2xl border p-5 text-left transition-colors',
                  active
                    ? 'border-primary bg-secondary/50 ring-1 ring-primary'
                    : 'border-border bg-background hover:border-primary/50',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-lg font-semibold">
                    {size.name}
                  </span>
                  {active && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-primary">
                  {size.dimensions}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {size.description}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {size.capacity}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">
          What will this tote carry?{' '}
          <span className="font-normal text-muted-foreground">
            (Select all that apply)
          </span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {carryOptions.map((opt) => {
            const checked = state.carry.includes(opt.id)
            return (
              <label
                key={opt.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                  checked
                    ? 'border-primary bg-secondary/40'
                    : 'border-border bg-background hover:border-primary/50',
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleCarry(opt.id)}
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
