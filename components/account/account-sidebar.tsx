'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Palette,
  ShoppingBag,
  Gift,
  Bookmark,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

const navItems: NavItem[] = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/account/my-designs', label: 'My Designs', icon: Palette },
  { href: '/account/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/account/rewards', label: 'Rewards & Offers', icon: Gift },
  { href: '/account/saved-kits', label: 'Saved Kits', icon: Bookmark },
  { href: '/account/settings', label: 'Settings', icon: Settings },
]

export function AccountSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav aria-label="Account navigation" className="flex flex-col gap-0.5">
      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        )
      })}

      {/* Divider */}
      <div className="my-2 h-px bg-border" />

      <button
        type="button"
        onClick={handleSignOut}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        Sign Out
      </button>
    </nav>
  )
}
