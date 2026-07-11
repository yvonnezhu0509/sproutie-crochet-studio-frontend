import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountSidebar } from '@/components/account/account-sidebar'

export const metadata = {
  title: 'My Account',
  description: 'Manage your Sproutie membership, designs, and rewards.',
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in?next=/account')
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Sidebar */}
        <aside className="shrink-0 lg:w-56">
          <AccountSidebar />
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
