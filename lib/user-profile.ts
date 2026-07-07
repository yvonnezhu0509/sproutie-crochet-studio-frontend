import type { User } from '@supabase/supabase-js'

export function getUserDisplayName(user: User): string {
  const meta = user.user_metadata ?? {}
  return meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'User'
}

export function getUserAvatarUrl(user: User): string | null {
  const meta = user.user_metadata ?? {}
  return meta.avatar_url ?? meta.picture ?? null
}

export function getUserInitials(user: User): string {
  const name = getUserDisplayName(user)
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
