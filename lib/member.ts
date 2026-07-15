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
  marketing_opt_in: boolean
  created_at: string
  updated_at: string
}

export interface MemberAccount {
  id: string
  user_id: string
  tier: string
  points_balance: number
  lifetime_points: number
  annual_spend_cents: number
  annual_spend: number
  joined_at: string
  tier_expires_at: string | null
  next_tier: string | null
  next_tier_spend_threshold: number | null
}

export interface Promotion {
  id: string
  title: string | null
  description: string | null
  promo_code: string | null
  benefit_type: string
  benefit_value: number | null
  minimum_spend_cents: number
  required_tier: string | null
  benefit: string | null
  starts_at: string
  ends_at: string | null
  is_active: boolean
}

export interface MemberOffer {
  id: string
  user_id: string
  promotion_id: string
  status: string
  redeemed: boolean
  redeemed_at: string | null
  assigned_at: string
  expires_at: string | null
  promotion: Promotion | null
}

export interface PointsLedgerEntry {
  id: number
  user_id: string
  points: number
  reason: string
  reference_type: string | null
  reference_id: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/** Fetch the authenticated user's profile row. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, birthday, marketing_opt_in, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
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
    .select('id:user_id, user_id, tier, points_balance, lifetime_points, annual_spend_cents, joined_at, tier_expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[member] getMemberAccount error:', error.message)
    return null
  }
  if (!data) return null

  return {
    ...data,
    annual_spend: data.annual_spend_cents / 100,
    next_tier: null,
    next_tier_spend_threshold: null,
  } as MemberAccount
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
      status,
      redeemed_at,
      assigned_at,
      expires_at,
      promotion:promotions (
        id,
        title,
        description,
        promo_code:code,
        benefit_type,
        benefit_value,
        minimum_spend_cents,
        required_tier,
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
  return (data ?? []).map((offer) => {
    const promotion = Array.isArray(offer.promotion)
      ? offer.promotion[0] ?? null
      : offer.promotion

    return {
      ...offer,
      redeemed: offer.status === 'redeemed',
      promotion: promotion
        ? {
            ...promotion,
            benefit: formatPromotionBenefit(
              promotion.benefit_type,
              promotion.benefit_value,
              promotion.minimum_spend_cents,
            ),
          }
        : null,
    }
  }) as MemberOffer[]
}

/** Fetch the authenticated user's recent points ledger entries (newest first). */
export async function getPointsLedger(userId: string, limit = 10): Promise<PointsLedgerEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('points_ledger')
    .select('id, user_id, points:points_delta, reason, reference_type, reference_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[member] getPointsLedger error:', error.message)
    return []
  }
  return (data ?? []) as PointsLedgerEntry[]
}

function formatPromotionBenefit(
  benefitType: string | null,
  benefitValue: number | null,
  minimumSpendCents: number | null,
): string | null {
  if (!benefitType || benefitValue === null) return null

  const minimumSpend =
    minimumSpendCents && minimumSpendCents > 0
      ? ` on orders over $${(minimumSpendCents / 100).toLocaleString()}`
      : ''

  if (benefitType === 'percentage') return `${benefitValue}% off${minimumSpend}`
  if (benefitType === 'fixed_amount') return `$${benefitValue.toLocaleString()} off${minimumSpend}`
  if (benefitType === 'points') return `${benefitValue.toLocaleString()} bonus points${minimumSpend}`

  return null
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
