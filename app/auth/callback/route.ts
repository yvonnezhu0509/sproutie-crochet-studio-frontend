import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { error: 'Missing OAuth code in callback URL.' },
      { status: 400 },
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: 400 },
    )
  }

  return NextResponse.redirect(
    new URL('/', requestUrl.origin),
  )
}
