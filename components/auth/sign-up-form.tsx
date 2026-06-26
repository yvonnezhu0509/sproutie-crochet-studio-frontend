'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

type FormState = 'idle' | 'submitting' | 'success'

interface FieldErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  terms?: string
}

export function SignUpForm() {
  const uid = useId()
  const [state, setState] = useState<FormState>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })

  function set(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({
        ...v,
        [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      }))
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!values.firstName.trim()) e.firstName = 'First name is required.'
    if (!values.lastName.trim()) e.lastName = 'Last name is required.'
    if (!values.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      e.email = 'Enter a valid email address.'
    if (!values.password) e.password = 'Password is required.'
    else if (values.password.length < 8)
      e.password = 'Password must be at least 8 characters.'
    if (!values.confirmPassword) e.confirmPassword = 'Please confirm your password.'
    else if (values.password !== values.confirmPassword)
      e.confirmPassword = 'Passwords do not match.'
    if (!values.terms) e.terms = 'You must agree to continue.'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setState('submitting')
    // Mock async sign-up — no data is stored or transmitted.
    setTimeout(() => setState('success'), 1000)
  }

  const inputBase =
    'mt-1.5 block w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30'

  const errClass = (field: keyof FieldErrors) =>
    errors[field] ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''

  if (state === 'success') {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
          <svg viewBox="0 0 24 24" className="size-6 text-primary" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-heading text-xl font-semibold">Account created</p>
        <p className="text-sm text-muted-foreground">
          Welcome, {values.firstName}. This is a prototype — no real account has been stored.
        </p>
        <Link href="/" className={cn(buttonVariants(), 'mt-2')}>
          Return to home
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Name row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-firstName`} className="text-sm font-medium">
            First name
          </label>
          <input
            id={`${uid}-firstName`}
            type="text"
            autoComplete="given-name"
            value={values.firstName}
            onChange={set('firstName')}
            className={cn(inputBase, errClass('firstName'))}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? `${uid}-fn-err` : undefined}
          />
          {errors.firstName && (
            <p id={`${uid}-fn-err`} className="mt-1 text-xs text-destructive">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-lastName`} className="text-sm font-medium">
            Last name
          </label>
          <input
            id={`${uid}-lastName`}
            type="text"
            autoComplete="family-name"
            value={values.lastName}
            onChange={set('lastName')}
            className={cn(inputBase, errClass('lastName'))}
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? `${uid}-ln-err` : undefined}
          />
          {errors.lastName && (
            <p id={`${uid}-ln-err`} className="mt-1 text-xs text-destructive">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor={`${uid}-email`} className="text-sm font-medium">
          Email
        </label>
        <input
          id={`${uid}-email`}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={set('email')}
          className={cn(inputBase, errClass('email'))}
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${uid}-em-err` : undefined}
        />
        {errors.email && (
          <p id={`${uid}-em-err`} className="mt-1 text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor={`${uid}-password`} className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id={`${uid}-password`}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={values.password}
            onChange={set('password')}
            className={cn(inputBase, 'pr-10', errClass('password'))}
            aria-invalid={!!errors.password}
            aria-describedby={`${uid}-pw-hint${errors.password ? ` ${uid}-pw-err` : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p id={`${uid}-pw-hint`} className="mt-1 text-xs text-muted-foreground">
          Minimum 8 characters.
        </p>
        {errors.password && (
          <p id={`${uid}-pw-err`} className="mt-0.5 text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor={`${uid}-confirm`} className="text-sm font-medium">
          Confirm password
        </label>
        <div className="relative">
          <input
            id={`${uid}-confirm`}
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={set('confirmPassword')}
            className={cn(inputBase, 'pr-10', errClass('confirmPassword'))}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? `${uid}-cp-err` : undefined}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id={`${uid}-cp-err`} className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Terms */}
      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={values.terms}
            onChange={set('terms')}
            className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
            aria-invalid={!!errors.terms}
            aria-describedby={errors.terms ? `${uid}-terms-err` : undefined}
          />
          <span className="leading-relaxed text-muted-foreground">
            I agree to the{' '}
            <Link href="/terms" className="text-foreground underline-offset-4 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-foreground underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.terms && (
          <p id={`${uid}-terms-err`} className="mt-1 text-xs text-destructive">{errors.terms}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={state === 'submitting'}
        className={cn(buttonVariants(), 'h-10 w-full text-sm disabled:opacity-60')}
      >
        {state === 'submitting' ? 'Creating account…' : 'Create Account'}
      </button>

      {/* Switch link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
