import { Hero } from '@/components/home/hero'
import { TwoPaths } from '@/components/home/two-paths'
import { Process } from '@/components/home/process'
import { FeaturedKits } from '@/components/home/featured-kits'
import { WhySproutie } from '@/components/home/why-sproutie'
import { Signup } from '@/components/home/signup'

export default function HomePage() {
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
