import { updateSession } from '@/lib/supabase/proxy'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl

  // Forward bare ?code= on homepage to the callback route
  const code = url.searchParams.get('code')
  if (url.pathname === '/' && code) {
    const callbackUrl = url.clone()
    callbackUrl.pathname = '/auth/callback'
    callbackUrl.searchParams.set('code', code)
    const next = url.searchParams.get('next')
    if (next) callbackUrl.searchParams.set('next', next)
    return NextResponse.redirect(callbackUrl)
  }

  // Refresh the session cookie (required by @supabase/ssr)
  const response = await updateSession(request)

  // Protect /account and /admin — check session using the refreshed cookies
  const isProtected = url.pathname.startsWith('/account') || url.pathname.startsWith('/admin')
  if (isProtected) {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Cookies are already handled by updateSession above
          },
        },
      },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const loginUrl = url.clone()
      loginUrl.pathname = '/sign-in'
      loginUrl.searchParams.set('next', url.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Extra check for /admin: require admin in server-controlled app_metadata
    if (url.pathname.startsWith('/admin')) {
      const appMetadata = user.app_metadata
      const isAdmin =
        appMetadata?.role === 'admin' ||
        (Array.isArray(appMetadata?.roles) && appMetadata.roles.includes('admin')) ||
        appMetadata?.is_admin === true
      if (!isAdmin) {
        const unauthorizedUrl = url.clone()
        unauthorizedUrl.pathname = '/unauthorized'
        unauthorizedUrl.search = ''
        return NextResponse.redirect(unauthorizedUrl)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!auth/callback|auth/error|_next/static|_next/image|_next/webpack-hmr|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
