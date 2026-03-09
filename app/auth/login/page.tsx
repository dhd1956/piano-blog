'use client'

import { usePrivy, useWallets, useCreateWallet, useLoginWithEmail } from '@privy-io/react-auth'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, Suspense } from 'react'

function Spinner({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-blue-600 ${className}`}
      aria-hidden
    />
  )
}

function LoginContent() {
  const { authenticated, user, ready, logout } = usePrivy()
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()
  const { isAuthenticated, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/'
  const isLogoutRedirect = params.get('logout') === '1'

  // Gate: only allow auto-session-creation after user explicitly clicks a button.
  // When coming from logout, start as false so cached Privy sessions can't sneak through.
  const [userInitiatedLogin, setUserInitiatedLogin] = useState(!isLogoutRedirect)

  const hasCreatedSessionRef = useRef(false)
  const hasTriedCreateWalletRef = useRef(false)
  const [walletError, setWalletError] = useState(false)

  // Clearing state: true while we force-clear any lingering Privy session after logout
  const [clearing, setClearing] = useState(isLogoutRedirect)

  // Email OTP state
  const [emailInput, setEmailInput] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const { sendCode, loginWithCode } = useLoginWithEmail()

  // When coming from logout: always force-clear Privy session once SDK is ready,
  // even if authenticated appears false at this instant (session may load a moment later)
  useEffect(() => {
    if (!ready || !isLogoutRedirect) return
    logout().finally(() => setClearing(false))
  }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // Create embedded wallet if needed — only after user explicitly initiated login
  useEffect(() => {
    if (!userInitiatedLogin) return
    if (!ready || !authenticated || !user || hasTriedCreateWalletRef.current) return
    if (wallets[0]) return
    hasTriedCreateWalletRef.current = true
    createWallet().catch(() => setWalletError(true))
  }, [ready, authenticated, user, wallets, createWallet, userInitiatedLogin])

  // Create backend session after Privy login completes — only after user-initiated login
  useEffect(() => {
    if (!userInitiatedLogin) return
    if (!ready || !authenticated || !user || hasCreatedSessionRef.current) return
    const wallet = wallets[0]
    if (!wallet) return

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
  }, [ready, authenticated, user, wallets, redirect, refreshUser, router, userInitiatedLogin])

  // If already authenticated via backend session on mount, redirect — but NOT after logout
  useEffect(() => {
    if (isLogoutRedirect) return
    if (!isLoading && isAuthenticated) {
      router.replace(redirect)
    }
  }, [isLoading, isAuthenticated, redirect, router, isLogoutRedirect])

  if (isLoading || !ready || clearing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Privy session exists but wallet creation failed — let user retry
  if (userInitiatedLogin && authenticated && walletError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <p className="mb-4 text-sm text-red-500">
            Something went wrong setting up your wallet. Please try again.
          </p>
          <button
            onClick={async () => {
              await logout()
              setWalletError(false)
              hasTriedCreateWalletRef.current = false
            }}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Show "Signing you in..." only when user explicitly triggered login
  if (
    userInitiatedLogin &&
    (isAuthenticated || (authenticated && hasCreatedSessionRef.current) || authenticated)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="mx-auto h-10 w-10" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Signing you in...</p>
        </div>
      </div>
    )
  }

  const handleSendCode = async () => {
    setEmailError('')
    if (!emailInput.trim()) {
      setEmailError('Please enter your email address')
      return
    }
    setEmailLoading(true)
    try {
      await sendCode({ email: emailInput.trim() })
      setOtpSent(true)
    } catch {
      setEmailError('Failed to send code. Check the email address and try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleLoginWithCode = async () => {
    setEmailError('')
    if (!otpCode.trim()) {
      setEmailError('Please enter the code from your email')
      return
    }
    setEmailLoading(true)
    setUserInitiatedLogin(true)
    try {
      await loginWithCode({ code: otpCode.trim() })
    } catch {
      setEmailError('Invalid or expired code. Please try again.')
      setUserInitiatedLogin(false)
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Sign in</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">No password needed</p>

        {/* Email OTP */}
        {!otpSent ? (
          <div className="space-y-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={handleSendCode}
              disabled={emailLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {emailLoading ? 'Sending…' : 'Send sign-in code'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Code sent to <strong>{emailInput}</strong>.{' '}
              <button
                onClick={() => {
                  setOtpSent(false)
                  setOtpCode('')
                }}
                className="text-blue-600 hover:underline"
              >
                Change email
              </button>
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoginWithCode()}
              placeholder="Enter code"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={handleLoginWithCode}
              disabled={emailLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {emailLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        )}

        {emailError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{emailError}</p>}
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
