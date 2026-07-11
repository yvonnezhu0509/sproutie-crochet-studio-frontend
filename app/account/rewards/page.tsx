import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMemberAccount, getMemberOffers, getPointsLedger } from '@/lib/member'
import { OfferCard } from '@/components/account/offer-card'
import { PointsActivity } from '@/components/account/points-activity'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rewards & Offers',
}

export default async function RewardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in?next=/account/rewards')

  const [account, offers, ledger] = await Promise.all([
    getMemberAccount(user.id),
    getMemberOffers(user.id),
    getPointsLedger(user.id, 20),
  ])

  const activeOffers = offers.filter((o) => !o.redeemed)
  const redeemedOffers = offers.filter((o) => o.redeemed)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Rewards &amp; Offers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your member offers and points history.
        </p>
      </div>

      {/* Points balance */}
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">Points balance</p>
        <p className="mt-1 font-heading text-4xl font-semibold tracking-tight">
          {(account?.points_balance ?? 0).toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {account?.tier ?? 'Seedling'} member
        </p>
      </section>

      {/* Active offers */}
      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">Active offers</h2>
        {activeOffers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
            <p className="font-medium text-foreground">No active offers</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New offers will appear here when they are assigned to your account.
            </p>
          </div>
        )}
      </section>

      {/* Points history */}
      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">Points history</h2>
        {ledger.length > 0 ? (
          <PointsActivity entries={ledger} />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
            <p className="font-medium text-foreground">No points activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Points earned and redeemed will appear here.
            </p>
          </div>
        )}
      </section>

      {/* Redeemed offers */}
      {redeemedOffers.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-muted-foreground">
            Redeemed offers
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {redeemedOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
