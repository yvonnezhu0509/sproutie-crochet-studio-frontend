import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/account'

  if (!code) {
    return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
  }

  // Redirect to `next` param (defaults to /account) — use relative path only
  const redirectPath = next.startsWith('/') ? next : '/account'
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
