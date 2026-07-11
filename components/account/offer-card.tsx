'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { MemberOffer } from '@/lib/member'
import { cn } from '@/lib/utils'

interface OfferCardProps {
  offer: MemberOffer
  compact?: boolean
}

export function OfferCard({ offer, compact = false }: OfferCardProps) {
  const [copied, setCopied] = useState(false)
  const promo = offer.promotion

  if (!promo) return null

  const isExpired =
    promo.ends_at ? new Date(promo.ends_at) < new Date() : false
  const isActive = !offer.redeemed && !isExpired && promo.is_active !== false

  async function handleCopy() {
    if (!promo?.promo_code) return
    await navigator.clipboard.writeText(promo.promo_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article
      className={cn(
        'rounded-xl border bg-card p-5',
        isActive ? 'border-border' : 'border-border/50 opacity-70',
      )}
    >
      {/* Status badge */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            offer.redeemed
              ? 'bg-muted text-muted-foreground'
              : isExpired
              ? 'bg-destructive/10 text-destructive'
              : 'bg-secondary text-secondary-foreground',
          )}
        >
          {offer.redeemed ? 'Redeemed' : isExpired ? 'Expired' : 'Active'}
        </span>
        {promo.ends_at && !offer.redeemed && (
          <p className="text-xs text-muted-foreground">
            Expires{' '}
            {new Date(promo.ends_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      <h3 className="font-heading text-base font-semibold leading-snug">
        {promo.title ?? 'Member Offer'}
      </h3>

      {!compact && promo.description && (
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {promo.description}
        </p>
      )}

      {promo.benefit && (
        <p className="mt-2 text-sm font-medium text-primary">{promo.benefit}</p>
      )}

      {/* Promo code */}
      {promo.promo_code && isActive && (
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-mono tracking-wider text-foreground">
            {promo.promo_code}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy promo code'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3.5 text-sprout-foreground" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      )}

      {promo.promo_code && isActive && (
        <p className="mt-2 text-xs text-muted-foreground">
          Copy this code and apply it at checkout.
        </p>
      )}
    </article>
  )
}
