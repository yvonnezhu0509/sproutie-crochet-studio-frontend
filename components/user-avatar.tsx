'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  getUserAvatarUrl,
  getUserDisplayName,
  getUserInitials,
} from '@/lib/user-profile'
import type { User } from '@supabase/supabase-js'

type UserAvatarProps = {
  user: User
  className?: string
  size?: 'sm' | 'md'
}

export function UserAvatar({ user, className, size = 'sm' }: UserAvatarProps) {
  const avatarUrl = getUserAvatarUrl(user)
  const [imgError, setImgError] = useState(false)
  const showImage = avatarUrl && !imgError
  const initials = getUserInitials(user)
  const displayName = getUserDisplayName(user)

  const sizeClasses = size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm'

  if (showImage) {
    return (
      <img
        src={avatarUrl}
        alt={`${displayName}'s profile picture`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={cn('shrink-0 rounded-full object-cover', sizeClasses, className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground',
        sizeClasses,
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}
