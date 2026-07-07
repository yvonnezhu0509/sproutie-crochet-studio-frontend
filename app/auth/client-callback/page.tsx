'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ClientCallbackPage() {
  const [debug, setDebug] = useState('Starting client callback...')

  useEffect(() => {
    async function run() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        setDebug(`Callback page loaded. Has code: ${Boolean(code)}`)

        if (!code) {
          setDebug('ERROR: No code found in URL.')
          return
        }

        const supabase = createClient()

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          setDebug(`EXCHANGE ERROR: ${error.message}`)
          return
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          setDebug(`SESSION CREATED BUT GET USER ERROR: ${userError.message}`)
          return
        }

        setDebug(
          `SUCCESS. Session exchanged. User email: ${
            user?.email ?? data.session?.user?.email ?? 'No email found'
          }`
        )
      } catch (err) {
        setDebug(
          `CRASH: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }

    run()
  }, [])

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-semibold">Auth Debug</h1>
      <pre className="max-w-xl whitespace-pre-wrap rounded-lg border border-border bg-muted p-4 text-left text-sm">
        {debug}
      </pre>
      <a href="/" className="text-sm underline underline-offset-4">
        Back to home
      </a>
    </main>
  )
}
