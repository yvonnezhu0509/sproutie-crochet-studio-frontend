'use client'

import { cn } from '@/lib/utils'
import { yarnOptions } from '@/lib/design-lab'
import type { DesignState } from '../design-lab'

export function StepYarn({
  state,
  update,
}: {
  state: DesignState
  update: (patch: Partial<DesignState>) => void
}) {
  const selected = yarnOptions.find((y) => y.id === state.yarnId)

  function selectYarn(id: string) {
    update({ yarnId: id, mainColor: '', secondaryColor: '', accentColor: '' })
  }

  function setColor(field: 'mainColor' | 'secondaryColor' | 'accentColor', hex: string) {
    update({ [field]: hex })
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Choose your yarn &amp; colors
        </h2>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          Pick a yarn base, then choose a main color. Secondary and accent
          colors are optional but help define the design concept.
        </p>
      </header>

      {/* Yarn selector */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Yarn base</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {yarnOptions.map((yarn) => {
            const active = state.yarnId === yarn.id
            return (
              <button
                key={yarn.id}
                type="button"
                onClick={() => selectYarn(yarn.id)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col gap-1.5 rounded-2xl border p-4 text-left transition-colors',
                  active
                    ? 'border-primary bg-secondary ring-1 ring-primary'
                    : 'border-border bg-background hover:border-primary/60',
                )}
              >
                <span className="font-heading text-sm font-semibold">{yarn.name}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {yarn.material}
                </span>
                <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-xs font-medium">
                  {yarn.structure}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Color swatches — shown once a yarn is selected */}
      {selected && (
        <div className="flex flex-col gap-6">
          <ColorPicker
            label="Main color"
            required
            colors={selected.colors}
            selected={state.mainColor}
            onSelect={(hex) => setColor('mainColor', hex)}
          />
          <ColorPicker
            label="Secondary color"
            colors={selected.colors}
            selected={state.secondaryColor}
            onSelect={(hex) =>
              setColor('secondaryColor', state.secondaryColor === hex ? '' : hex)
            }
          />
          <ColorPicker
            label="Accent color"
            colors={selected.colors}
            selected={state.accentColor}
            onSelect={(hex) =>
              setColor('accentColor', state.accentColor === hex ? '' : hex)
            }
          />
        </div>
      )}

      {selected && (
        <p className="text-xs text-muted-foreground/70">
          {selected.estimatedQuantity}
        </p>
      )}
    </div>
  )
}

function ColorPicker({
  label,
  required = false,
  colors,
  selected,
  onSelect,
}: {
  label: string
  required?: boolean
  colors: { name: string; hex: string }[]
  selected: string
  onSelect: (hex: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">
        {label}{' '}
        {!required && (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((c) => {
          const active = selected === c.hex
          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => onSelect(c.hex)}
              aria-label={`${label}: ${c.name}`}
              aria-pressed={active}
              title={c.name}
              className={cn(
                'flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors',
                active
                  ? 'border-foreground bg-background text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-muted-foreground',
              )}
            >
              <span
                className="size-4 shrink-0 rounded-full border border-border/60"
                style={{ backgroundColor: c.hex }}
                aria-hidden="true"
              />
              {c.name}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
