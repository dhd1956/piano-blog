'use client'

/**
 * My Profile Page
 * Redirects authenticated users to their own profile page.
 * Unauthenticated users are sent to sign in.
 */

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function MyProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.push('/auth/login?redirect=/profile')
      return
    }

    // Redirect to the user's profile using username or wallet address
    const identifier = user.username || user.walletAddress
    if (identifier) {
      router.push(`/profile/${identifier}`)
    }
  }, [isLoading, isAuthenticated, user, router])

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="text-gray-700 dark:text-gray-300">
            {isLoading ? 'Loading your profile...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    </div>
  )
}
