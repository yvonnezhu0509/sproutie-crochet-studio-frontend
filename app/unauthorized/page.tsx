import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldOff } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Access Restricted — Sproutie House',
  description: 'You do not have permission to view this page.',
}

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <ShieldOff className="size-6" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl text-foreground">Access Restricted</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This area requires admin privileges. If you believe this is a mistake,
          please sign in with the correct account.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          Go Home
        </Link>
        <Link href="/sign-in" className={cn(buttonVariants({ variant: 'outline' }))}>
          Sign In
        </Link>
      </div>
    </main>
  )
}
