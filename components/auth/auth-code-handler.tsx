'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthCodeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) return

    const supabase = createClient()

    async function exchangeCode() {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Failed to exchange auth code:', error.message)
        router.replace('/auth/error')
        return
      }

      router.replace('/')
      router.refresh()
    }

    exchangeCode()
  }, [router, searchParams])

  return null
}
