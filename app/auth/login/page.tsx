'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, Suspense } from 'react'

function Spinner({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-blue-600 ${className}`}
      aria-hidden
    />
  )
}

function LoginContent() {
  const { login, authenticated, user, ready } = usePrivy()
  const { wallets } = useWallets()
  const { isAuthenticated, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/'
  const hasCreatedSessionRef = useRef(false)

  // When Privy login completes and wallet is ready, create backend session then redirect
  useEffect(() => {
    if (!ready || !authenticated || !user || hasCreatedSessionRef.current) return
    const wallet = wallets[0]
    if (!wallet) return // Wait for embedded wallet to be created

    hasCreatedSessionRef.current = true

    const email = user.email?.address || (user.google as any)?.email
    const authProvider = user.google ? 'google' : 'email'

    fetch('/api/auth/embedded-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: wallet.address, email, authProvider }),
    })
      .then(() => refreshUser())
      .then(() =>
        fetch(
          `/api/profile/${wallet.address}?email=${encodeURIComponent(email || '')}&emailVerified=true&authProvider=${authProvider}`
        )
      )
      .then((res) => (res.ok ? res.json() : null))
      .then((profileData) => {
        if (profileData?.profile && !profileData.profile.username && redirect === '/') {
          router.replace('/profile/setup')
        } else {
          router.replace(redirect)
        }
      })
      .catch(console.error)
  }, [ready, authenticated, user, wallets, redirect, refreshUser, router])

  // If already authenticated via backend session on mount, redirect immediately
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirect)
    }
  }, [isLoading, isAuthenticated, redirect, router])

  if (isLoading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isAuthenticated || (authenticated && hasCreatedSessionRef.current)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="mx-auto h-10 w-10" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Sign in</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">No password needed</p>
        <button
          onClick={() => login()}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Continue with email or Google
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
