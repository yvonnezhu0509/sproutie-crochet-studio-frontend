import { redirect } from 'next/navigation'
import { Hero } from '@/components/home/hero'
import { TwoPaths } from '@/components/home/two-paths'
import { Process } from '@/components/home/process'
import { FeaturedKits } from '@/components/home/featured-kits'
import { WhySproutie } from '@/components/home/why-sproutie'
import { Signup } from '@/components/home/signup'

export const dynamic = 'force-dynamic'

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const authCode = typeof params?.code === 'string' ? params.code : undefined
  const nextPath = typeof params?.next === 'string' ? params.next : undefined

  if (authCode) {
    const target = nextPath
      ? `/auth/callback?code=${encodeURIComponent(authCode)}&next=${encodeURIComponent(nextPath)}`
      : `/auth/callback?code=${encodeURIComponent(authCode)}`

    redirect(target)
  }

  return (
    <>
      <Hero />
      <TwoPaths />
      <Process />
      <FeaturedKits />
      <WhySproutie />
      <Signup />
    </>
  )
}
