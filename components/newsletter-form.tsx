'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    toast.success("You're on the list", {
      description: "We'll be in touch as new kits and prototypes are ready.",
    })
    setEmail('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex w-full gap-2',
        compact ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row',
      )}
    >
      <label htmlFor={compact ? 'footer-email' : 'newsletter-email'} className="sr-only">
        Email address
      </label>
      <Input
        id={compact ? 'footer-email' : 'newsletter-email'}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={cn('h-11 flex-1 bg-background text-base sm:text-sm')}
      />
      <Button type="submit" className="h-11 px-5">
        Join the list
      </Button>
    </form>
  )
}
