'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { navLinks } from '@/lib/content'
import { Logo } from '@/components/logo'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          aria-label="Sproutie Crochet Studio home"
        >
          <Logo className="h-7 w-auto text-primary" />
          <span className="font-heading text-xl font-semibold tracking-tight text-foreground">
            Sproutie
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                  active && 'text-foreground',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/originals"
            className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-4')}
          >
            Shop Studio Originals
          </Link>
          <Link
            href="/design"
            className={cn(buttonVariants({ variant: 'default' }), 'h-10 px-4')}
          >
            Design Your Tote
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-md text-foreground lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-border/70 bg-background lg:hidden"
        >
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6"
            aria-label="Mobile"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/originals"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-11 px-4 text-sm',
                )}
              >
                Shop Studio Originals
              </Link>
              <Link
                href="/design"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'h-11 px-4 text-sm',
                )}
              >
                Design Your Tote
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
