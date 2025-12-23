'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import LandingPage from '@/components/LandingPage'
import LoginModal from '@/components/auth/LoginModal'

export default function Home({ posts }) {
  const searchParams = useSearchParams()
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    // Show login modal if redirected from protected route
    if (searchParams?.get('login') === 'true') {
      setShowLoginModal(true)
    }
  }, [searchParams])

  return (
    <>
      <LandingPage posts={posts} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  )
}
