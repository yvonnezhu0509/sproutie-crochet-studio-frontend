import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { SignInForm } from '@/components/auth/sign-in-form'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Sproutie Crochet Studio account.',
}

export default function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 py-12 sm:py-20">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-2">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-2 self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          aria-label="Back to Sproutie home"
        >
          <Logo className="h-5 w-auto text-sprout" />
          <span className="font-heading font-semibold tracking-tight">Sproutie</span>
        </Link>
        <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          Welcome back
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Sign in to manage your kit requests, saved designs, and community projects.
        </p>
      </div>

      <SignInForm />
    </div>
  )
}
