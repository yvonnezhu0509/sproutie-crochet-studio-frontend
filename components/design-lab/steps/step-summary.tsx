'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { RotateCcw, ArrowUpRight } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  yarnOptions,
  handleOptions,
  detailOptions,
  toteSizes,
  sizeEstimates,
  designNameParts,
} from '@/lib/design-lab'
import type { DesignState } from '../design-lab'

function generateDesignName(state: DesignState): string {
  // Deterministic "random" pick seeded from the user's choices.
  const seed = (state.bagStyle + state.yarnId + state.mainColor).length
  const first = designNameParts.first[seed % designNameParts.first.length]
  const second =
    designNameParts.second[(seed + state.sizeId.length) % designNameParts.second.length]
  return `The ${first} ${second}`
}

export function StepSummary({
  state,
  onEdit,
}: {
  state: DesignState
  onEdit: () => void
}) {
  const yarn = useMemo(
    () => yarnOptions.find((y) => y.id === state.yarnId),
    [state.yarnId],
  )
  const handle = useMemo(
    () => handleOptions.find((h) => h.id === state.handleId),
    [state.handleId],
  )
  const size = useMemo(
    () => toteSizes.find((s) => s.id === state.sizeId),
    [state.sizeId],
  )
  const estimate = sizeEstimates[state.sizeId]

  const mainColorData = yarn?.colors.find((c) => c.hex === state.mainColor)
  const secondaryColorData = yarn?.colors.find((c) => c.hex === state.secondaryColor)
  const accentColorData = yarn?.colors.find((c) => c.hex === state.accentColor)

  const chosenDetails = detailOptions.filter((d) => state.details.includes(d.id))

  const designName = generateDesignName(state)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Design concept draft
        </p>
        <h2 className="font-heading text-3xl font-semibold tracking-tight">
          {designName}
        </h2>
        {state.inspiration && (
          <p className="max-w-prose text-pretty leading-relaxed text-muted-foreground">
            &ldquo;{state.inspiration}&rdquo;
          </p>
        )}
        <Badge variant="outline" className="w-fit text-xs">
          Prototype draft — not a finished pattern
        </Badge>
      </header>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <SummaryRow label="Bag style" value="Large Tote" />
          {size && (
            <SummaryRow
              label="Size"
              value={size.name}
              sub={size.dimensions}
            />
          )}
          {yarn && (
            <SummaryRow label="Yarn base" value={yarn.name} sub={yarn.material} />
          )}
          {handle && <SummaryRow label="Handle style" value={handle.name} />}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Color palette display */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Color palette
            </span>
            <div className="flex flex-wrap gap-2">
              {mainColorData && (
                <ColorSwatch name={mainColorData.name} hex={mainColorData.hex} label="Main" />
              )}
              {secondaryColorData && (
                <ColorSwatch
                  name={secondaryColorData.name}
                  hex={secondaryColorData.hex}
                  label="Secondary"
                />
              )}
              {accentColorData && (
                <ColorSwatch
                  name={accentColorData.name}
                  hex={accentColorData.hex}
                  label="Accent"
                />
              )}
            </div>
          </div>

          {chosenDetails.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Finishing details
              </span>
              <ul className="flex flex-wrap gap-2">
                {chosenDetails.map((d) => (
                  <li key={d.id}>
                    <Badge variant="secondary" className="text-xs">
                      {d.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Construction estimate */}
      {estimate && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Draft construction plan
          </p>
          <p className="text-sm leading-relaxed text-foreground">{estimate.construction}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Estimated skill level: <strong className="text-foreground">{estimate.difficulty}</strong></span>
            <span>Estimated making time: <strong className="text-foreground">{estimate.makingTime}</strong></span>
          </div>
          {yarn && (
            <p className="text-sm text-muted-foreground">{yarn.estimatedQuantity}</p>
          )}
        </div>
      )}

      <Separator />

      {/* Honest note + next step prompt */}
      <div className="flex flex-col gap-4 rounded-2xl bg-muted/60 p-5">
        <p className="text-sm leading-relaxed text-foreground">
          <strong>This is a draft concept, not a finished pattern.</strong> A real
          person will review every design for construction feasibility before a
          custom materials kit is offered. We will reach out if yours is selected.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="h-10 gap-2 px-4 text-sm" onClick={onEdit}>
            <RotateCcw className="size-4" />
            Start over
          </Button>
          <Link
            href="/originals"
            className={cn(buttonVariants({ variant: 'default' }), 'h-10 gap-2 px-5 text-sm')}
          >
            See Studio Originals
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <span className="font-heading text-base font-semibold text-foreground">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

function ColorSwatch({
  name,
  hex,
  label,
}: {
  name: string
  hex: string
  label: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5">
      <span
        className="size-4 shrink-0 rounded-full border border-border/60"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <span className="text-xs font-medium text-foreground">{name}</span>
      <span className="text-xs text-muted-foreground">({label})</span>
    </div>
  )
}
