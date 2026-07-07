'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClientCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Signing you in...')

  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (!code) {
        setMessage('Missing sign-in code.')
        router.replace('/auth/error')
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Client callback error:', error.message)
        setMessage(error.message)
        router.replace('/auth/error')
        return
      }

      router.replace('/')
      router.refresh()
    }

    run()
  }, [router])

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  )
}
