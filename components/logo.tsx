import { cn } from '@/lib/utils'

// A small sprout mark formed from rounded "stitch" leaves.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <path
        d="M16 29V14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M16 16C16 11 12.5 7.5 7 7.5C7 12.5 10.5 16 16 16Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M16 13C16 8.5 19.2 5 24.5 5C24.5 9.5 21.3 13 16 13Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
