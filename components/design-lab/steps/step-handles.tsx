'use client'

import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { handleOptions, detailOptions } from '@/lib/design-lab'
import type { DesignState } from '../design-lab'
import type { YarnOption } from '@/lib/design-lab'

export function StepHandles({
  state,
  update,
  yarn,
}: {
  state: DesignState
  update: (patch: Partial<DesignState>) => void
  yarn: YarnOption | undefined
}) {
  const isStructured = yarn?.structure !== 'Soft & drapey'

  function toggleDetail(id: string) {
    update({
      details: state.details.includes(id)
        ? state.details.filter((d) => d !== id)
        : [...state.details, id],
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Handles &amp; finishing details
        </h2>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          Choose how your bag will be carried, then add any finishing details
          you want in the draft. Incompatible combinations are marked.
        </p>
      </header>

      {/* Handle selector */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Handle style</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {handleOptions.map((handle) => {
            const active = state.handleId === handle.id
            const incompatible =
              handle.incompatibleSizes?.includes(state.sizeId) ?? false

            return (
              <button
                key={handle.id}
                type="button"
                onClick={() => !incompatible && update({ handleId: handle.id })}
                aria-pressed={active}
                disabled={incompatible}
                className={cn(
                  'flex flex-col gap-1.5 rounded-2xl border p-4 text-left transition-colors',
                  incompatible
                    ? 'cursor-not-allowed border-border bg-muted/40 opacity-50'
                    : active
                      ? 'border-primary bg-secondary ring-1 ring-primary'
                      : 'border-border bg-background hover:border-primary/60',
                )}
              >
                <span className="font-heading text-sm font-semibold">
                  {handle.name}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {incompatible ? handle.reason : handle.description}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Detail options */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">
          Finishing details{' '}
          <span className="font-normal text-muted-foreground">(optional, select any)</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {detailOptions.map((opt) => {
            const checked = state.details.includes(opt.id)
            const disabled = opt.requiresStructured && !isStructured

            return (
              <label
                key={opt.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
                  disabled
                    ? 'cursor-not-allowed border-border bg-muted/40 opacity-50'
                    : checked
                      ? 'border-primary bg-secondary/40'
                      : 'border-border bg-background hover:border-primary/50',
                )}
              >
                <Checkbox
                  checked={checked && !disabled}
                  disabled={disabled}
                  onCheckedChange={() => !disabled && toggleDetail(opt.id)}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{opt.name}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {disabled ? opt.reason : opt.description}
                  </span>
                </div>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
