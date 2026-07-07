import { updateSession } from '@/lib/supabase/proxy'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get('code')

  if (url.pathname === '/' && code) {
    const callbackUrl = url.clone()
    callbackUrl.pathname = '/auth/callback'
    callbackUrl.searchParams.set('code', code)

    const next = url.searchParams.get('next')
    if (next) {
      callbackUrl.searchParams.set('next', next)
    }

    return NextResponse.redirect(callbackUrl)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!auth/callback|auth/error|_next/static|_next/image|_next/webpack-hmr|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
