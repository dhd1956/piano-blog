'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppKit } from '@reown/appkit/react'
import {
  ConnectorController,
  ConnectionController,
  ChainController,
} from '@reown/appkit-controllers'
import { useAuth } from '@/context/AuthContext'
import { useAppKitReady } from '@/context/ReownProvider'

// How long we wait for the embedded wallet to respond to APP_GET_USER.
// APP_GET_USER has no built-in timeout in Reown's code.  15 s is generous —
// typical response is < 2 s when the iframe is warmed up.
const CONNECT_TIMEOUT_MS = 15_000

type Step = 'email' | 'otp'

function Spinner({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-blue-600 ${className}`}
      aria-hidden
    />
  )
}

// Inner component — only rendered after createAppKit is initialized
function LoginForm() {
  const searchParams = useSearchParams()
  const { open } = useAppKit()
  const { isAuthenticated, isLoading, refreshUser } = useAuth()
  const redirectTo = searchParams.get('redirect') || '/'

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  // Track whether OTP has already been verified so retries skip connectOtp
  const otpVerifiedRef = useRef(false)

  // Redirect after authentication
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = redirectTo
    }
  }, [isLoading, isAuthenticated, redirectTo])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isSending) return

    setError('')
    setIsSending(true)
    try {
      const authConnector = ConnectorController.getAuthConnector()
      if (!authConnector)
        throw new Error('Auth service not available — please refresh and try again')

      const { action } = await (authConnector.provider as any).connectEmail({ email })

      if (action === 'VERIFY_OTP') {
        setStep('otp')
        // Focus first OTP box after render
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      } else if (action === 'CONNECT') {
        // Device already verified — connect directly
        const namespace = ChainController.state.activeChain
        if (namespace) {
          await ConnectionController.connectExternal(authConnector as any, namespace)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send login code')
    } finally {
      setIsSending(false)
    }
  }

  const submitOtp = async (otpValue: string) => {
    if (isVerifying) return

    setError('')
    setIsVerifying(true)
    try {
      const authConnector = ConnectorController.getAuthConnector()
      if (!authConnector) throw new Error('Auth service not available')

      // Step 1 — verify OTP (only on first attempt; skip on retry after timeout)
      if (!otpVerifiedRef.current) {
        await (authConnector.provider as any).connectOtp({ otp: otpValue })
        otpVerifiedRef.current = true
      }

      // Step 2 — get wallet address directly from provider.getUser().
      //
      // We bypass ConnectionController.connectExternal() entirely because:
      //   - connectExternal → AuthConnector.connect() caches a "connectSocialPromise"
      //   - if APP_GET_USER hangs, that promise never settles, and every retry
      //     awaits the same hung promise → permanent deadlock
      //
      // Calling provider.getUser() directly:
      //   - creates a fresh APP_GET_USER request each time (new id, no caching)
      //   - chainId=1 (Ethereum mainnet) is preloaded in Reown's iframe; Celo
      //     requires fetching chain data which can cause multi-second delays
      //   - the wallet address is the same regardless of chainId
      //
      // We also race against ChainController.activeCaipAddress in case AppKit's
      // own onConnect callback fires concurrently.
      const address = await new Promise<string>((resolve, reject) => {
        let settled = false
        const settle = (fn: () => void) => {
          if (settled) return
          settled = true
          unsubscribe()
          clearTimeout(timer)
          fn()
        }

        const unsubscribe = ChainController.subscribeKey(
          'activeCaipAddress',
          (caipAddress: string | undefined) => {
            if (caipAddress) {
              // CAIP address format: "eip155:1:0x1234..."
              const parts = caipAddress.split(':')
              settle(() => resolve(parts[parts.length - 1]))
            }
          }
        )

        const timer = setTimeout(
          () => settle(() => reject(new Error('timeout'))),
          CONNECT_TIMEOUT_MS
        )

        // Direct provider call — no connectSocialPromise, fresh request each retry
        ;(authConnector.provider as any)
          .getUser({ chainId: 1 })
          .then((user: any) => {
            const addr = user?.address
            if (addr) settle(() => resolve(addr))
            else settle(() => reject(new Error('Could not retrieve wallet address')))
          })
          .catch((e: unknown) => settle(() => reject(e)))
      })

      // Step 3 — create backend session
      await fetch('/api/auth/embedded-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, email, authProvider: 'email' }),
      })

      // Step 4 — ensure profile exists (creates user record if new)
      const profileRes = await fetch(
        `/api/profile/${address}?email=${encodeURIComponent(email)}&emailVerified=true&authProvider=email`
      )
      const profileData = profileRes.ok ? await profileRes.json() : null

      // Step 5 — sync auth context → triggers redirect via isAuthenticated useEffect
      await refreshUser()

      // Only redirect new users (no username) to profile setup when there is no
      // specific destination — if they came from /venues or similar, take them there.
      if (profileData?.profile && !profileData.profile.username && redirectTo === '/') {
        window.location.href = '/profile/setup'
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed'
      if (msg === 'timeout') {
        // OTP is already verified — preserve the digits so the user can retry
        // the getUser step without re-entering the code.
        setError('Connection is taking longer than expected — please try again.')
      } else if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('expired')) {
        otpVerifiedRef.current = false
        setError('Incorrect or expired code — please try again')
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      } else {
        otpVerifiedRef.current = false
        setError('Verification failed — please try again')
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    // Paste of full 6-digit code
    if (value.length >= 6 && /^\d{6}/.test(value)) {
      const digits = value.slice(0, 6).split('')
      setOtp(digits)
      otpRefs.current[5]?.focus()
      submitOtp(digits.join(''))
      return
    }

    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 boxes are filled
    if (newOtp.every((d) => d) && newOtp.join('').length === 6) {
      submitOtp(newOtp.join(''))
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = async () => {
    setError('')
    otpVerifiedRef.current = false
    setOtp(['', '', '', '', '', ''])
    try {
      const authConnector = ConnectorController.getAuthConnector()
      if (!authConnector) throw new Error('Auth service not available')

      await (authConnector.provider as any).connectEmail({ email })
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    }
  }

  const handleBack = () => {
    setStep('email')
    setOtp(['', '', '', '', '', ''])
    setError('')
    otpVerifiedRef.current = false
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isAuthenticated) {
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
        {step === 'email' ? (
          <>
            <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Sign in</h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">No password needed</p>

            {/* Google */}
            <button
              onClick={() => {
                sessionStorage.removeItem('user_logged_out')
                open({ view: 'Connect' })
              }}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative my-4 flex items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
              <span className="mx-3 text-xs text-gray-400">or</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailSubmit}>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
              {error && (
                <p className="mb-2 text-sm text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={!email || isSending}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? 'Sending code...' : 'Send login code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>

            <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
              Check your email
            </h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
            </p>

            {/* 6-box OTP input */}
            <div className="mb-4 flex gap-2" role="group" aria-label="One-time password">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={isVerifying}
                  aria-label={`Digit ${i + 1}`}
                  className="h-12 w-full rounded-lg border border-gray-300 text-center text-xl font-bold tracking-tight focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              ))}
            </div>

            <button
              onClick={() => submitOtp(otp.join(''))}
              disabled={otp.some((d) => !d) || isVerifying}
              className="mb-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Verifying...
                </span>
              ) : (
                'Verify code'
              )}
            </button>

            {error && (
              <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn&apos;t receive it?{' '}
              <button
                onClick={handleResend}
                className="font-medium text-blue-600 transition-colors hover:underline dark:text-blue-400"
              >
                Resend code
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// Waits for createAppKit to be initialized before rendering LoginForm
function LoginContent() {
  const appKitReady = useAppKitReady()

  if (!appKitReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return <LoginForm />
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
