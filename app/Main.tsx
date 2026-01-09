'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import LandingPage from '@/components/LandingPage'
import LoginModal from '@/components/auth/LoginModal'

export default function Home({ posts }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    // Show login modal if redirected from protected route
    if (searchParams?.get('login') === 'true') {
      setShowLoginModal(true)
    }
  }, [searchParams])

  const handleLoginSuccess = () => {
    // Check if there's a saved redirect path from before login
    const redirectPath = sessionStorage.getItem('redirectAfterLogin')

    if (redirectPath) {
      // Clear the saved path
      sessionStorage.removeItem('redirectAfterLogin')
      // Redirect back to the original page
      router.push(redirectPath)
    } else {
      // No saved path, just close modal and stay on home
      setShowLoginModal(false)
    }
  }

  return (
    <>
      <LandingPage posts={posts} />
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />
      )}
    </>
  )
}
