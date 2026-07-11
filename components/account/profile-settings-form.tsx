'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileAction } from '@/app/account/actions'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { ProfileUpdatePayload } from '@/lib/member'

interface ProfileSettingsFormProps {
  email: string
  initialValues: ProfileUpdatePayload
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function ProfileSettingsForm({
  email,
  initialValues,
}: ProfileSettingsFormProps) {
  const uid = useId()
  const router = useRouter()
  const [values, setValues] = useState<ProfileUpdatePayload>(initialValues)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const inputBase =
    'mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60'

  function handleChange(field: keyof ProfileUpdatePayload) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        e.target.type === 'checkbox' ? e.target.checked : e.target.value || null
      setValues((prev) => ({ ...prev, [field]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaveState('saving')
    setErrorMsg(null)

    const { error } = await updateProfileAction(values)

    if (error) {
      setSaveState('error')
      setErrorMsg(error)
      return
    }

    setSaveState('saved')
    router.refresh()

    // Reset to idle after a moment
    setTimeout(() => setSaveState('idle'), 3000)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Email (read-only from Auth) */}
      <div>
        <label htmlFor={`${uid}-email`} className="text-sm font-medium">
          Email address
        </label>
        <input
          id={`${uid}-email`}
          type="email"
          value={email}
          disabled
          readOnly
          className={cn(inputBase, 'cursor-not-allowed')}
          aria-describedby={`${uid}-email-note`}
        />
        <p id={`${uid}-email-note`} className="mt-1 text-xs text-muted-foreground">
          Email is managed through your sign-in method and cannot be changed here.
        </p>
      </div>

      {/* Full name */}
      <div>
        <label htmlFor={`${uid}-name`} className="text-sm font-medium">
          Display name
        </label>
        <input
          id={`${uid}-name`}
          type="text"
          autoComplete="name"
          value={values.full_name ?? ''}
          onChange={handleChange('full_name')}
          className={inputBase}
          placeholder="Your name"
        />
      </div>

      {/* Avatar URL */}
      <div>
        <label htmlFor={`${uid}-avatar`} className="text-sm font-medium">
          Avatar URL
        </label>
        <input
          id={`${uid}-avatar`}
          type="url"
          autoComplete="photo"
          value={values.avatar_url ?? ''}
          onChange={handleChange('avatar_url')}
          className={inputBase}
          placeholder="https://example.com/photo.jpg"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          A publicly accessible URL for your profile photo.
        </p>
      </div>

      {/* Birthday */}
      <div>
        <label htmlFor={`${uid}-birthday`} className="text-sm font-medium">
          Birthday
        </label>
        <input
          id={`${uid}-birthday`}
          type="date"
          value={values.birthday ?? ''}
          onChange={handleChange('birthday')}
          className={inputBase}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Used for birthday offers. Not shared publicly.
        </p>
      </div>

      {/* Marketing opt-in */}
      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={values.marketing_opt_in ?? false}
            onChange={handleChange('marketing_opt_in')}
            className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
          />
          <span className="leading-relaxed text-muted-foreground">
            Subscribe to studio updates, new kit launches, and member-only offers.
          </span>
        </label>
      </div>

      {/* Feedback */}
      {saveState === 'saved' && (
        <p role="status" className="rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground">
          Profile saved successfully.
        </p>
      )}
      {saveState === 'error' && errorMsg && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {errorMsg}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saveState === 'saving'}
          className={cn(buttonVariants(), 'h-10 px-6 text-sm disabled:opacity-60')}
        >
          {saveState === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
