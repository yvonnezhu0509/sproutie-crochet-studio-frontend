'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthCodeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) {
      router.replace('/auth/error')
      return
    }

    const supabase = createClient()

    async function exchangeCode(authCode: string) {
      const { error } = await supabase.auth.exchangeCodeForSession(authCode)

      if (error) {
        console.error('Failed to exchange auth code:', error.message)
        router.replace('/auth/error')
        return
      }

      router.replace('/account')
      router.refresh()
    }

    exchangeCode(code)
  }, [router, searchParams])

  return null
}
