'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import LandingPage from '@/components/LandingPage'

export default function Home({ posts }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page if redirected from protected route
    if (searchParams?.get('login') === 'true') {
      router.push('/auth/login')
    }
  }, [searchParams, router])

  return <LandingPage posts={posts} />
}
