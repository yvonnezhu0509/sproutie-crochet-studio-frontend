'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressSteps, LAB_STEPS } from './progress-steps'
import { StepBagStyle } from './steps/step-bag-style'
import { StepInspiration } from './steps/step-inspiration'
import { StepSize } from './steps/step-size'
import { StepYarn } from './steps/step-yarn'
import { StepHandles } from './steps/step-handles'
import { StepSummary } from './steps/step-summary'
import { yarnOptions } from '@/lib/design-lab'

export interface DesignState {
  bagStyle: string
  inspiration: string
  imageAdded: boolean
  sizeId: string
  carry: string[]
  yarnId: string
  mainColor: string
  secondaryColor: string
  accentColor: string
  handleId: string
  details: string[]
}

const initialState: DesignState = {
  bagStyle: '',
  inspiration: '',
  imageAdded: false,
  sizeId: '',
  carry: [],
  yarnId: '',
  mainColor: '',
  secondaryColor: '',
  accentColor: '',
  handleId: '',
  details: [],
}

export function DesignLab() {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<DesignState>(initialState)

  const update = (patch: Partial<DesignState>) =>
    setState((s) => ({ ...s, ...patch }))

  const selectedYarn = useMemo(
    () => yarnOptions.find((y) => y.id === state.yarnId),
    [state.yarnId],
  )

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0: return state.bagStyle !== ''
      case 1: return state.inspiration.trim().length > 0 || state.imageAdded
      case 2: return state.sizeId !== ''
      case 3: return state.yarnId !== '' && state.mainColor !== ''
      case 4: return state.handleId !== ''
      default: return true
    }
  }, [step, state])

  const isLast = step === LAB_STEPS.length - 1
  const goTo = (i: number) =>
    setStep(Math.max(0, Math.min(i, LAB_STEPS.length - 1)))

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10">
        <ProgressSteps current={step} />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 lg:p-10">
        {step === 0 && <StepBagStyle state={state} update={update} />}
        {step === 1 && <StepInspiration state={state} update={update} />}
        {step === 2 && <StepSize state={state} update={update} />}
        {step === 3 && <StepYarn state={state} update={update} />}
        {step === 4 && (
          <StepHandles state={state} update={update} yarn={selectedYarn} />
        )}
        {step === 5 && <StepSummary state={state} onEdit={() => goTo(0)} />}
      </div>

      {!isLast && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            className="h-11 px-4"
            disabled={step === 0}
            onClick={() => goTo(step - 1)}
          >
            <ArrowLeft className="size-4" data-icon="inline-start" />
            Back
          </Button>
          <Button
            className="h-11 px-6"
            disabled={!canAdvance}
            onClick={() => goTo(step + 1)}
          >
            {step === 4 ? 'See Design Summary' : 'Continue'}
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Button>
        </div>
      )}
    </div>
  )
}
