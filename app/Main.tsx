'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import LandingPage from '@/components/LandingPage'
import { useAppKit } from '@reown/appkit/react'

export default function Home({ posts }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { open } = useAppKit()

  useEffect(() => {
    // Open Reown modal if redirected from protected route
    if (searchParams?.get('login') === 'true') {
      open()
    }
  }, [searchParams, open])

  return <LandingPage posts={posts} />
}
