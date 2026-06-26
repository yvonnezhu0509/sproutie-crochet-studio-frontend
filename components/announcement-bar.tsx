'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Centralised config ──────────────────────────────────────────────────────
// Change any of these values to update the bar site-wide.
export const ANNOUNCEMENT = {
  /** Set to false to hide the bar everywhere without deleting the component. */
  enabled: true,
  /** Unique key used to remember the dismissed state across page navigations. */
  sessionKey: 'sproutie-announcement-dismissed-v1',
  text: 'Join the Sproutie early-access list and receive 10% off your first Studio Original kit.',
  promoCode: 'SPROUTIE10',
  linkLabel: 'Join Early Access',
  /** Scroll to the newsletter section on the home page, or swap for a route. */
  linkHref: '/#signup',
  /** Tailwind bg / text / border classes — swap to retheme the bar. */
  bgClass: 'bg-secondary',
  textClass: 'text-secondary-foreground',
  borderClass: 'border-border/60',
} as const

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false)

  // Read sessionStorage only on the client to avoid hydration mismatch.
  useEffect(() => {
    if (!ANNOUNCEMENT.enabled) return
    const dismissed = sessionStorage.getItem(ANNOUNCEMENT.sessionKey)
    if (!dismissed) setVisible(true)
  }, [])

  function dismiss() {
    sessionStorage.setItem(ANNOUNCEMENT.sessionKey, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="banner"
      aria-label="Promotional announcement"
      className={cn(
        'border-b px-4 py-2',
        ANNOUNCEMENT.bgClass,
        ANNOUNCEMENT.textClass,
        ANNOUNCEMENT.borderClass,
      )}
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-3 sm:px-8 lg:px-12">
        {/* Main message */}
        <p className="text-center text-xs leading-relaxed sm:text-sm">
          {ANNOUNCEMENT.text}{' '}
          {ANNOUNCEMENT.promoCode && (
            <span className="mx-1 inline-block rounded bg-background/40 px-1.5 py-0.5 font-mono text-[11px] tracking-wide">
              {ANNOUNCEMENT.promoCode}
            </span>
          )}{' '}
          <a
            href={ANNOUNCEMENT.linkHref}
            className="whitespace-nowrap font-medium underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {ANNOUNCEMENT.linkLabel}
          </a>
        </p>

        {/* Dismiss button — absolutely positioned so it doesn't shift text */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-0 flex size-6 shrink-0 items-center justify-center rounded-sm opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
