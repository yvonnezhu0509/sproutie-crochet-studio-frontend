'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NewsletterForm({
  compact = false,
  dark = false,
}: {
  compact?: boolean
  dark?: boolean
}) {
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    toast.success("You're on the list", {
      description: "We'll be in touch as new kits and prototypes are ready.",
    })
    setEmail('')
  }

  const inputId = compact ? 'footer-email' : dark ? 'signup-email' : 'newsletter-email'

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <Input
        id={inputId}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={cn(
          'h-11 flex-1 text-base sm:text-sm',
          dark
            ? 'border-background/20 bg-background/10 text-background placeholder:text-background/40 focus-visible:ring-background/50'
            : 'bg-background',
        )}
      />
      <Button
        type="submit"
        variant={dark ? 'outline' : 'default'}
        className={cn(
          'h-11 px-5',
          dark && 'border-background/30 bg-transparent text-background hover:bg-background/10',
        )}
      >
        Join the list
      </Button>
    </form>
  )
}
