import Link from 'next/link'
import { Logo } from '@/components/logo'
import { NewsletterForm } from '@/components/newsletter-form'

const footerNav = [
  {
    heading: 'Explore',
    links: [
      { href: '/design', label: 'Design Your Tote' },
      { href: '/originals', label: 'Studio Originals' },
      { href: '/how-it-works', label: 'How It Works' },
    ],
  },
  {
    heading: 'Studio',
    links: [
      { href: '/about', label: 'About' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.6fr]">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2" aria-label="Sproutie Crochet Studio home">
              <Logo className="h-7 w-auto text-primary" />
              <span className="font-heading text-xl font-semibold tracking-tight">
                Sproutie
              </span>
            </Link>
            <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
              A modern crochet design studio making original bag kits — and
              prototyping a guided way to design your own tote.
            </p>
          </div>

          {footerNav.map((group) => (
            <div key={group.heading} className="flex flex-col gap-3">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                {group.heading}
              </h2>
              <ul className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Follow the studio as it grows
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Join the list for new kits, prototype releases, and early access
              to the AI Tote Design Lab.
            </p>
            <NewsletterForm compact />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Sproutie Crochet Studio. An early-stage prototype.</p>
          <p>Designed in North America · Prices in USD</p>
        </div>
      </div>
    </footer>
  )
}
