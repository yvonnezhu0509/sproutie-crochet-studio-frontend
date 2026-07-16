import { AlertTriangle, CheckCircle2, CircleX } from 'lucide-react'
import type {
  ProductPublicationReadiness,
  PublicationStatus,
} from '@/lib/product-publication-readiness'

interface Props {
  targetStatus: PublicationStatus
  readiness: ProductPublicationReadiness
}

const STATUS_LABELS: Record<PublicationStatus, string> = {
  coming_soon: 'Coming Soon',
  active: 'Active',
  sold_out: 'Sold Out',
}

export function ProductPublicationReadiness({
  targetStatus,
  readiness,
}: Props) {
  const passedCount = readiness.checks.filter((check) => check.passed).length

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Publication readiness</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Requirements for changing this product to {STATUS_LABELS[targetStatus]}.
          </p>
        </div>

        <div
          className={
            readiness.ready
              ? 'rounded-full bg-sprout/15 px-3 py-1 text-xs font-medium text-sprout'
              : 'rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive'
          }
        >
          {readiness.ready
            ? 'Ready to publish'
            : `${readiness.blockers.length} blocker${
                readiness.blockers.length === 1 ? '' : 's'
              }`}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {passedCount} of {readiness.checks.length} checks passed
        {readiness.warnings.length > 0
          ? ` · ${readiness.warnings.length} warning${
              readiness.warnings.length === 1 ? '' : 's'
            }`
          : ''}
      </p>

      <div className="mt-4 divide-y divide-border rounded-lg border border-border">
        {readiness.checks.map((check) => {
          const Icon = check.passed
           ? CheckCircle2
            : check.severity === 'warning'
              ? AlertTriangle
              : CircleX

          return (
            <div
              key={check.id}
              className="flex items-start gap-3 px-3 py-3"
            >
              <Icon
                aria-hidden="true"
                className={
                  check.passed
                    ? 'mt-0.5 size-4 shrink-0 text-sprout'
                    : check.severity === 'warning'
                      ? 'mt-0.5 size-4 shrink-0 text-amber-600'
                      : 'mt-0.5 size-4 shrink-0 text-destructive'
                }
              />

              <div className="min-w-0">
                <p className="text-sm font-medium">{check.label}</p>
                {!check.passed && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {check.description}
                  </p>
                )}
              </div>

              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {check.passed
                  ? 'Passed'
                  : check.severity === 'warning'
                    ? 'Warning'
                    : 'Required'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
