/**
 * Typed query functions for the Sproutie membership database.
 * All queries run server-side using the authenticated Supabase client.
 * Each function scopes to the current user — never fetch cross-user data here.
 */

import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types — mirror the existing DB schema exactly; no invented columns.
// ---------------------------------------------------------------------------

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  birthday: string | null
  marketing_opt_in: boolean | null
  created_at: string | null
}

export interface MemberAccount {
  id: string
  user_id: string
  tier: string | null
  points_balance: number | null
  annual_spend: number | null
  joined_at: string | null
  next_tier: string | null
  next_tier_spend_threshold: number | null
}

export interface Promotion {
  id: string
  title: string | null
  description: string | null
  promo_code: string | null
  benefit: string | null
  starts_at: string | null
  ends_at: string | null
  is_active: boolean | null
}

export interface MemberOffer {
  id: string
  user_id: string
  promotion_id: string | null
  redeemed: boolean | null
  redeemed_at: string | null
  assigned_at: string | null
  promotion: Promotion | null
}

export interface PointsLedgerEntry {
  id: string
  user_id: string
  points: number | null
  reason: string | null
  created_at: string | null
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/** Fetch the authenticated user's profile row. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, birthday, marketing_opt_in, created_at')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // no row found
    console.error('[member] getProfile error:', error.message)
    return null
  }
  return data as Profile
}

/** Fetch the authenticated user's membership account. */
export async function getMemberAccount(userId: string): Promise<MemberAccount | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_accounts')
    .select('id, user_id, tier, points_balance, annual_spend, joined_at, next_tier, next_tier_spend_threshold')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[member] getMemberAccount error:', error.message)
    return null
  }
  return data as MemberAccount
}

/** Fetch the authenticated user's assigned offers, joined with promotion data. */
export async function getMemberOffers(userId: string): Promise<MemberOffer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_offers')
    .select(`
      id,
      user_id,
      promotion_id,
      redeemed,
      redeemed_at,
      assigned_at,
      promotion:promotions (
        id,
        title,
        description,
        promo_code,
        benefit,
        starts_at,
        ends_at,
        is_active
      )
    `)
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false })

  if (error) {
    console.error('[member] getMemberOffers error:', error.message)
    return []
  }
  return (data ?? []) as MemberOffer[]
}

/** Fetch the authenticated user's recent points ledger entries (newest first). */
export async function getPointsLedger(userId: string, limit = 10): Promise<PointsLedgerEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('points_ledger')
    .select('id, user_id, points, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[member] getPointsLedger error:', error.message)
    return []
  }
  return (data ?? []) as PointsLedgerEntry[]
}

/** Update allowed profile fields. Only full_name, avatar_url, birthday, marketing_opt_in. */
export type ProfileUpdatePayload = Pick<Profile, 'full_name' | 'avatar_url' | 'birthday' | 'marketing_opt_in'>

export async function updateProfile(
  userId: string,
  payload: Partial<ProfileUpdatePayload>,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)

  if (error) {
    console.error('[member] updateProfile error:', error.message)
    return { error: error.message }
  }
  return { error: null }
}
