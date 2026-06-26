'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navLinks } from '@/lib/content'
import { Logo } from '@/components/logo'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

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

        {/* Desktop right — single quiet CTA */}
        <div className="hidden lg:flex">
          <Link
            href="/design"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Design Studio
          </Link>
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
        </nav>
      </div>
    </header>
  )
}
