import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const LAB_STEPS = [
  'Inspiration',
  'Size & Use',
  'Yarn & Color',
  'Handles & Details',
  'Design Summary',
] as const

export function ProgressSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Design progress">
      <ol className="flex w-full items-center">
        {LAB_STEPS.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <li
              key={label}
              className={cn(
                'flex items-center',
                i < LAB_STEPS.length - 1 && 'flex-1',
              )}
            >
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                    done && 'border-primary bg-primary text-primary-foreground',
                    active && 'border-primary bg-background text-primary',
                    !done && !active && 'border-border bg-background text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'hidden text-sm font-medium lg:inline',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
              {i < LAB_STEPS.length - 1 && (
                <span
                  className={cn(
                    'mx-2 h-px flex-1 sm:mx-4',
                    done ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-center text-sm font-medium text-foreground lg:hidden">
        Step {current + 1} of {LAB_STEPS.length}: {LAB_STEPS[current]}
      </p>
    </nav>
  )
}
