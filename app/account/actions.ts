'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProfileUpdatePayload } from '@/lib/member'

/**
 * Server Action: update allowed profile fields for the currently authenticated user.
 * Only full_name, avatar_url, birthday, and marketing_opt_in may be changed.
 */
export async function updateProfileAction(
  payload: Partial<ProfileUpdatePayload>,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  // Whitelist only the permitted fields
  const safePayload: Partial<ProfileUpdatePayload> = {}
  if ('full_name' in payload) safePayload.full_name = payload.full_name ?? null
  if ('avatar_url' in payload) safePayload.avatar_url = payload.avatar_url ?? null
  if ('birthday' in payload) safePayload.birthday = payload.birthday ?? null
  if ('marketing_opt_in' in payload) safePayload.marketing_opt_in = payload.marketing_opt_in ?? false

  const { error } = await supabase
    .from('profiles')
    .update(safePayload)
    .eq('id', user.id)

  if (error) {
    console.error('[updateProfileAction] error:', error.message)
    return { error: error.message }
  }

  return { error: null }
}
