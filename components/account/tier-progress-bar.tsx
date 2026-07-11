import type { MemberAccount } from '@/lib/member'

interface TierProgressBarProps {
  account: MemberAccount
}

export function TierProgressBar({ account }: TierProgressBarProps) {
  const { tier, annual_spend, next_tier, next_tier_spend_threshold } = account

  const hasProgress =
    typeof annual_spend === 'number' &&
    typeof next_tier_spend_threshold === 'number' &&
    next_tier_spend_threshold > 0

  const percent = hasProgress
    ? Math.min(100, Math.round(((annual_spend ?? 0) / (next_tier_spend_threshold ?? 1)) * 100))
    : null

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{tier ?? 'Seedling'}</p>
          <p className="text-xs text-muted-foreground">Current tier</p>
        </div>
        {next_tier && (
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{next_tier}</p>
            <p className="text-xs text-muted-foreground">Next tier</p>
          </div>
        )}
      </div>

      {hasProgress && percent !== null ? (
        <>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Tier progress: ${percent}%`}
            className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            ${(annual_spend ?? 0).toLocaleString()} spent of $
            {(next_tier_spend_threshold ?? 0).toLocaleString()} needed for {next_tier}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Spend data is not available yet.
        </p>
      )}
    </div>
  )
}
