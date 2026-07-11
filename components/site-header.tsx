'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navLinks } from '@/lib/content'
import { Logo } from '@/components/logo'
import { AnnouncementBar } from '@/components/announcement-bar'
import { createClient } from '@/lib/supabase/client'
import { getUserDisplayName } from '@/lib/user-profile'
import { UserAvatar } from '@/components/user-avatar'
import type { User } from '@supabase/supabase-js'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // onAuthStateChange fires immediately with the current session on mount,
    // so we use it as the single source of truth — no separate getUser() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-6 sm:px-8 lg:px-12">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          aria-label="Sproutie Crochet Studio home"
        >
          <Logo className="h-6 w-auto text-sprout" />
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Sproutie
          </span>
        </Link>

        {/* Desktop nav — minimal, no CTA buttons */}
        <nav className="hidden items-center gap-0 lg:flex" aria-label="Primary">
          {navLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
                  active && 'text-foreground',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop right — quiet links */}
        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/design"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Design Studio
          </Link>

          {authLoading ? (
            <span className="h-4 w-16 animate-pulse rounded bg-muted" aria-hidden="true" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="My account"
              >
                <UserAvatar user={user} />
              </Link>
              <Link
                href="/account"
                className={cn(
                  'max-w-[120px] truncate text-sm text-muted-foreground transition-colors hover:text-foreground',
                  pathname.startsWith('/account') && 'text-foreground',
                )}
                title={user.email ?? undefined}
              >
                {getUserDisplayName(user)}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className={cn(
                  'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                  pathname === '/sign-in' && 'text-foreground',
                )}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  'rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted',
                  pathname === '/sign-up' && 'bg-muted',
                )}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-9 items-center justify-center rounded-md text-foreground lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Announcement bar — below nav chrome, above mobile panel */}
      <AnnouncementBar />

      {/* Mobile nav — always in DOM, toggled with hidden to avoid SSR/client mismatch */}
      <div
        id="mobile-nav"
        className={cn(
          'border-t border-border/50 bg-background lg:hidden',
          !open && 'hidden',
        )}
      >
        <nav
          className="mx-auto flex max-w-7xl flex-col px-6 py-4 sm:px-8"
          aria-label="Mobile"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'py-3 text-base text-muted-foreground transition-colors hover:text-foreground',
                (pathname === link.href || pathname.startsWith(link.href + '/')) &&
                  'text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-border" />
          {authLoading ? (
            <span className="my-3 h-4 w-24 animate-pulse rounded bg-muted" aria-hidden="true" />
          ) : user ? (
            <>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 py-3"
              >
                <UserAvatar user={user} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </Link>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className={cn(
                  'py-3 text-base text-muted-foreground transition-colors hover:text-foreground',
                  pathname.startsWith('/account') && 'text-foreground',
                )}
              >
                Account
              </Link>
              <button
                type="button"
                onClick={() => { setOpen(false); handleSignOut() }}
                className="py-3 text-left text-base text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className={cn(
                  'py-3 text-base text-muted-foreground transition-colors hover:text-foreground',
                  pathname === '/sign-in' && 'text-foreground',
                )}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className={cn(
                  'py-3 text-base text-muted-foreground transition-colors hover:text-foreground',
                  pathname === '/sign-up' && 'text-foreground',
                )}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
