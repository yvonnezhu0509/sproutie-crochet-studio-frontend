import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your Sproutie House order.',
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      {/* Icon */}
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
        <Lock className="size-7 text-secondary-foreground" />
      </div>

      {/* Copy */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Coming Soon
        </p>
        <h1 className="font-heading text-3xl font-semibold leading-snug sm:text-4xl">
          Checkout is on its way
        </h1>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          Sproutie House is in early access. Secure payment processing will be
          available when the shop opens. Your bag is saved — nothing is lost.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <Link href="/cart" className={cn(buttonVariants({ variant: 'outline' }), 'h-11 w-full gap-2')}>
          <ArrowLeft className="size-4" />
          Back to Bag
        </Link>
        <Link
          href="/originals"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Continue browsing kits
        </Link>
      </div>

      {/* Early access note */}
      <p className="text-xs text-muted-foreground/60 max-w-sm text-pretty">
        Interested in early access or wholesale inquiries? Reach out via the community page.
      </p>
    </div>
  )
}
