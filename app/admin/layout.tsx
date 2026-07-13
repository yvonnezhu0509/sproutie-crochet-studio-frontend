import type { Metadata } from 'next'
import Link from 'next/link'
import { LayoutGrid, Package, LogOut } from 'lucide-react'

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s — Admin',
  },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Admin topbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 sm:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-heading text-sm font-semibold tracking-tight text-foreground"
            >
              Sproutie Admin
            </Link>
            <nav className="flex items-center gap-1" aria-label="Admin navigation">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LayoutGrid className="size-4" aria-hidden="true" />
                Dashboard
              </Link>
              <Link
                href="/admin/products"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Package className="size-4" aria-hidden="true" />
                Products
              </Link>
            </nav>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Back to site
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 bg-muted/30">
        {children}
      </main>
    </div>
  )
}
