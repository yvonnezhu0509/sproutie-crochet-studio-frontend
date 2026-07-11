import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/member'
import { ProfileSettingsForm } from '@/components/account/profile-settings-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account Settings',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in?next=/account/settings')

  const profile = await getProfile(user.id)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and preferences.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-5 font-heading text-lg font-semibold">Profile</h2>
        <ProfileSettingsForm
          email={user.email ?? ''}
          initialValues={{
            full_name: profile?.full_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
            birthday: profile?.birthday ?? null,
            marketing_opt_in: profile?.marketing_opt_in ?? false,
          }}
        />
      </section>
    </div>
  )
}
