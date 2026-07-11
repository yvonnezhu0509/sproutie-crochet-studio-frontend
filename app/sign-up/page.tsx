import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { SignUpForm } from '@/components/auth/sign-up-form'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a free Sproutie House account.',
}

export default function SignUpPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-2">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          aria-label="Back to Sproutie home"
        >
          <Logo className="h-5 w-auto text-sprout" />
          <span className="font-heading font-semibold tracking-tight">Sproutie</span>
        </Link>
        <h1 className="font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
          Create your Sproutie House account
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          An account will let you save designs from the Design Studio, share
          projects in the community, and manage kit requests when they open.
        </p>

      </div>

      <SignUpForm />
    </div>
  )
}
