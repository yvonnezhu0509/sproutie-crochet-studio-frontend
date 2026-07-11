import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getProfile,
  getMemberAccount,
  getMemberOffers,
  getPointsLedger,
} from '@/lib/member'
import { UserAvatar } from '@/components/user-avatar'
import { TierProgressBar } from '@/components/account/tier-progress-bar'
import { PointsActivity } from '@/components/account/points-activity'
import { OfferCard } from '@/components/account/offer-card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account Overview',
}

export default async function AccountOverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in?next=/account')

  const [profile, account, offers, ledger] = await Promise.all([
    getProfile(user.id),
    getMemberAccount(user.id),
    getMemberOffers(user.id),
    getPointsLedger(user.id, 5),
  ])

  const displayName =
    profile?.full_name ??
    user.user_metadata?.full_name ??
    user.email?.split('@')[0] ??
    'Member'

  const tier = account?.tier ?? 'Seedling'
  const points = account?.points_balance ?? 0
  const joinedAt = account?.joined_at ?? profile?.created_at ?? null
  const activeOffers = offers.filter((o) => !o.redeemed)

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome banner */}
      <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
        <UserAvatar user={user} size="md" className="size-14 text-base" />
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
            Welcome back, {displayName}
          </h1>
          {joinedAt && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Member since{' '}
              {new Date(joinedAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </section>

      {/* Stats row */}
      <section aria-label="Membership stats" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Membership tier" value={tier} />
        <StatCard label="Points balance" value={points.toLocaleString()} />
        <StatCard
          label="Available offers"
          value={String(activeOffers.length)}
          className="col-span-2 sm:col-span-1"
        />
      </section>

      {/* Tier progress */}
      {account ? (
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold">Tier progress</h2>
          <TierProgressBar account={account} />
        </section>
      ) : (
        <EmptyCard title="No membership account yet">
          Your membership account will appear here once it has been set up.
        </EmptyCard>
      )}

      {/* Active offers */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Your offers</h2>
          {activeOffers.length > 0 && (
            <Link
              href="/account/rewards"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        {activeOffers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeOffers.slice(0, 2).map((offer) => (
              <OfferCard key={offer.id} offer={offer} compact />
            ))}
          </div>
        ) : (
          <EmptyCard title="No active offers">
            Offers assigned to your account will appear here.
          </EmptyCard>
        )}
      </section>

      {/* Recent points activity */}
      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">Recent activity</h2>
        {ledger.length > 0 ? (
          <PointsActivity entries={ledger} />
        ) : (
          <EmptyCard title="No activity yet">
            Points earned and spent will show up here.
          </EmptyCard>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className ?? ''}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

function EmptyCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  )
}
