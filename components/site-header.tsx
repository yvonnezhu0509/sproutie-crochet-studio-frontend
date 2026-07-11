'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

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
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setSigningOut(false)
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
          aria-label="Sproutie House home"
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
                  active && 'text-primary font-medium',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop right — auth control only */}
        <div className="hidden items-center gap-5 lg:flex">
          {authLoading ? (
            <span className="h-4 w-16 animate-pulse rounded bg-muted" aria-hidden="true" />
          ) : user ? (
            <div className="relative flex items-center gap-1" ref={menuRef}>
              {/* Avatar — direct link to /account */}
              <Link
                href="/account"
                aria-label="Go to account overview"
                className="rounded-full cursor-pointer ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <UserAvatar user={user} />
              </Link>

              {/* Chevron — toggles dropdown only */}
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Open account menu"
                aria-expanded={menuOpen}
                aria-haspopup="true"
                className="flex items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
              >
                <ChevronDown
                  className={cn('size-3.5 transition-transform duration-150', menuOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border border-border bg-background py-1 shadow-lg"
                >
                  <Link
                    href="/account"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted cursor-pointer"
                  >
                    Overview
                  </Link>
                  <Link
                    href="/account/rewards"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted cursor-pointer"
                  >
                    Rewards &amp; Offers
                  </Link>
                  <Link
                    href="/account/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted cursor-pointer"
                  >
                    Settings
                  </Link>
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    role="menuitem"
                    disabled={signingOut}
                    onClick={() => { setMenuOpen(false); handleSignOut() }}
                    className="block w-full px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted cursor-pointer disabled:cursor-wait"
                  >
                    {signingOut ? 'Signing out…' : 'Sign Out'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/sign-in"
              className={cn(
                'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                (pathname === '/sign-in' || pathname === '/sign-up') && 'text-foreground',
              )}
            >
              Sign In
            </Link>
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
              <div className="flex items-center gap-3 py-3">
                <UserAvatar user={user} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className={cn(
                  'py-3 text-base text-muted-foreground transition-colors hover:text-foreground',
                  pathname === '/account' && 'text-foreground',
                )}
              >
                My Account
              </Link>
              <Link
                href="/account/rewards"
                onClick={() => setOpen(false)}
                className={cn(
                  'py-3 text-base text-muted-foreground transition-colors hover:text-foreground',
                  pathname === '/account/rewards' && 'text-foreground',
                )}
              >
                Rewards &amp; Offers
              </Link>
              <Link
                href="/account/settings"
                onClick={() => setOpen(false)}
                className={cn(
                  'py-3 text-base text-muted-foreground transition-colors hover:text-foreground',
                  pathname === '/account/settings' && 'text-foreground',
                )}
              >
                Settings
              </Link>
              <button
                type="button"
                disabled={signingOut}
                onClick={() => { setOpen(false); handleSignOut() }}
                className="py-3 text-left text-base text-foreground transition-colors hover:text-foreground cursor-pointer disabled:cursor-wait"
              >
                {signingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className={cn(
                'py-3 text-base text-muted-foreground transition-colors hover:text-foreground',
                (pathname === '/sign-in' || pathname === '/sign-up') && 'text-foreground',
              )}
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
