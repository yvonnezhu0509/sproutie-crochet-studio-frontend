import type { PointsLedgerEntry } from '@/lib/member'

interface PointsActivityProps {
  entries: PointsLedgerEntry[]
}

export function PointsActivity({ entries }: PointsActivityProps) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {entries.map((entry) => {
        const isPositive = (entry.points ?? 0) >= 0
        return (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">
                {entry.reason ?? 'Points activity'}
              </p>
              {entry.created_at && (
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 text-sm font-semibold tabular-nums ${
                isPositive ? 'text-sprout-foreground' : 'text-destructive'
              }`}
            >
              {isPositive ? '+' : ''}
              {(entry.points ?? 0).toLocaleString()} pts
            </span>
          </li>
        )
      })}
    </ul>
  )
}
