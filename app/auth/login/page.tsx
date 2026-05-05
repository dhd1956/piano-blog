'use client'

import {
  usePrivy,
  useWallets,
  useCreateWallet,
  useLoginWithEmail,
  useLoginWithOAuth,
} from '@privy-io/react-auth'
import { useAuth } from '@/context/AuthContext'

// sessionStorage throws SecurityError in iOS Private Browsing and some in-app browsers
function safeSessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // ignore
  }
}
function safeSessionRemove(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}
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
  const { login, authenticated, user, ready, logout } = usePrivy()
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()
  const { sendCode, loginWithCode } = useLoginWithEmail()
  const { initOAuth } = useLoginWithOAuth()
  const { isAuthenticated, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/'
  const isPostLogout = params.get('logout') === '1'

  // Target URL to navigate to once isAuthenticated is confirmed in React state.
  // Using state (not direct router.replace) avoids a race where router.replace
  // fires before React commits isAuthenticated=true, causing useRequireAuth on
  // community pages to see stale false and redirect back to login.
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null)
  const [isSettingUp, setIsSettingUp] = useState(false)

  const hasCreatedSessionRef = useRef(false)
  const hasTriedCreateWalletRef = useRef(false)
  const isNewUserRef = useRef(false)
  // Persisted across Google OAuth redirects via sessionStorage
  const userClickedLoginRef = useRef(safeSessionGet('login_initiated') === '1')

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [formError, setFormError] = useState('')
  const [walletError, setWalletError] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [privyTimedOut, setPrivyTimedOut] = useState(false)
  const [isRestrictedBrowser, setIsRestrictedBrowser] = useState(false)

  // Detect in-app browsers and WebViews that block Privy's cross-origin iframe.
  // These environments (QR scanner shells, Instagram, Facebook, etc.) cause Privy
  // to hang for minutes before giving up. Detect immediately so the user gets a
  // usable "open in browser" link right away.
  useEffect(() => {
    const ua = window.navigator.userAgent
    const inApp =
      /Instagram|FBAN|FBAV|Twitter|Line|WeChat|Snapchat/i.test(ua) ||
      (/Android/.test(ua) && /wv/.test(ua)) || // Android WebView flag
      (/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua)) // iOS WebView (no Safari token)
    setIsRestrictedBrowser(inApp)
  }, [])

  // If Privy restored a session after logout (via its cross-origin iframe), kill it so
  // the user can choose a different account.
  // Guard on !userClickedLoginRef.current so we don't interrupt a login in progress.
  useEffect(() => {
    if (isPostLogout && ready && authenticated && !userClickedLoginRef.current) {
      logout()
    }
  }, [isPostLogout, ready, authenticated, logout])

  // If authenticated but no wallet, force-create one — only after explicit login
  useEffect(() => {
    if (!ready || !authenticated || !user || hasTriedCreateWalletRef.current) return
    if (!userClickedLoginRef.current) return
    if (wallets[0]) return
    hasTriedCreateWalletRef.current = true
    createWallet().catch((e: any) => {
      // Ignore "already exists" — the wallet will load momentarily on its own
      const msg = e?.message?.toLowerCase() ?? ''
      if (!msg.includes('already') && !msg.includes('exist')) setWalletError(true)
    })
  }, [ready, authenticated, user, wallets, createWallet])

  // When Privy login completes and wallet is ready, create backend session then redirect.
  // Only runs after explicit user action — prevents auto-login from a restored iframe session.
  useEffect(() => {
    if (!ready || !authenticated || !user || hasCreatedSessionRef.current) return
    if (!userClickedLoginRef.current) return
    const wallet = wallets[0]
    if (!wallet) return

    hasCreatedSessionRef.current = true
    safeSessionRemove('login_initiated')

    const userEmail = user.email?.address || (user.google as any)?.email
    const authProvider = user.google ? 'google' : 'email'

    fetch('/api/auth/embedded-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: wallet.address, email: userEmail, authProvider }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Session creation failed (${res.status})`)
        const data = await res.json()
        isNewUserRef.current = !!data.isNewUser
        return refreshUser()
      })
      .then(async () => {
        // For new users: auto-claim welcome PXP + CELO gas stipend before redirecting.
        // This ensures they can tip immediately without manual setup steps.
        if (isNewUserRef.current) {
          setIsSettingUp(true)
          try {
            await fetch('/api/rewards/claim-welcome', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            })
          } catch {
            // Non-fatal — continue even if auto-claim fails
          }
          setIsSettingUp(false)
        }
        return fetch(
          `/api/profile/${wallet.address}?email=${encodeURIComponent(userEmail || '')}&emailVerified=true&authProvider=${authProvider}`
        )
      })
      .then((res) => (res.ok ? res.json() : null))
      .then((profileData) => {
        const target =
          profileData?.profile && !profileData.profile.username && redirect === '/'
            ? '/profile/setup'
            : redirect
        setPendingRedirect(target)
      })
      .catch((err) => {
        console.error('[login] session creation failed:', err)
        setSessionError(true)
      })
  }, [ready, authenticated, user, wallets, redirect, refreshUser])

  // If already authenticated via backend session on mount, redirect immediately.
  // Skip when the user just clicked login — the pendingRedirect effect handles that.
  // Use window.location.href (hard nav) to bypass the Next.js router cache, which
  // can serve a stale middleware redirect and cause an infinite loop.
  useEffect(() => {
    if (!isLoading && isAuthenticated && !userClickedLoginRef.current) {
      window.location.href = redirect
    }
  }, [isLoading, isAuthenticated, redirect])

  // Navigate only after isAuthenticated is committed in React state.
  // Uses window.location.href (hard nav) to bypass the Next.js router cache.
  useEffect(() => {
    if (isAuthenticated && pendingRedirect !== null) {
      window.location.href = pendingRedirect
    }
  }, [isAuthenticated, pendingRedirect])

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // After 12 s still waiting for Privy, suggest opening in the system browser
  useEffect(() => {
    if (ready) return
    const t = setTimeout(() => setPrivyTimedOut(true), 12000)
    return () => clearTimeout(t)
  }, [ready])

  // Only show wallet error if login didn't succeed anyway (wallet may already exist)
  if (authenticated && walletError && !isAuthenticated) {
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

  if (sessionError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <p className="mb-4 text-sm text-red-500">Sign-in failed. Please try again.</p>
          <button
            onClick={async () => {
              await logout()
              setSessionError(false)
              hasCreatedSessionRef.current = false
              userClickedLoginRef.current = false
              setCodeSent(false)
              setCode('')
            }}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Privy session exists and user explicitly initiated login — useEffect is handling it
  if (isAuthenticated || (authenticated && userClickedLoginRef.current)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="mx-auto h-10 w-10" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {isSettingUp ? 'Setting up your account…' : 'Signing you in...'}
          </p>
          {isSettingUp && (
            <p className="mt-1 text-xs text-gray-400">Getting your PXP ready — just a moment</p>
          )}
        </div>
      </div>
    )
  }

  const handleSendCode = async () => {
    if (!email) return
    setSending(true)
    setFormError('')
    try {
      // If Privy silently restored a session (e.g. Gmail via iframe), log out first.
      // Otherwise loginWithCode would try to link Yahoo to the Gmail account and fail.
      if (authenticated) await logout()
      await sendCode({ email })
      setCodeSent(true)
      setResendCooldown(30)
    } catch (e: any) {
      setFormError(e.message || 'Failed to send code. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setSending(true)
    setFormError('')
    setCode('')
    try {
      if (authenticated) await logout()
      await sendCode({ email })
      setResendCooldown(30)
    } catch (e: any) {
      setFormError(e.message || 'Failed to resend code.')
    } finally {
      setSending(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code) return
    setVerifying(true)
    setFormError('')
    try {
      userClickedLoginRef.current = true
      await loginWithCode({ code })
    } catch (e: any) {
      userClickedLoginRef.current = false
      setFormError(e.message || 'Invalid code. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleGoogleLogin = () => {
    safeSessionSet('login_initiated', '1')
    userClickedLoginRef.current = true
    initOAuth({ provider: 'google' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Sign in</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">No password needed</p>

        {isRestrictedBrowser && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-300">
              Sign-in doesn&apos;t work inside QR scanner or app browsers.
            </p>
            <a
              href={typeof window !== 'undefined' ? window.location.href : '/auth/login'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Open in your browser →
            </a>
          </div>
        )}

        {!ready && !isRestrictedBrowser && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
            {privyTimedOut ? (
              <div>
                <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">
                  Sign-in is taking too long. Try opening this page in Chrome or Safari.
                </p>
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '/auth/login'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  Open in browser →
                </a>
              </div>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Connecting to sign-in service…
              </p>
            )}
          </div>
        )}

        {!codeSent ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and we'll send you a 6-digit code — no password needed.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <button
              onClick={handleSendCode}
              disabled={!email || sending || !ready}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending…' : !ready ? 'Connecting…' : 'Continue with email'}
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
              <span className="mx-3 shrink-0 text-xs text-gray-400">or</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={!ready}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {!ready ? 'Connecting…' : 'Continue with Google'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="mb-1 text-sm font-medium text-blue-800 dark:text-blue-300">
                Check your inbox
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                We sent a 6-digit code to <strong>{email}</strong>. Open that email and paste the
                code below. It expires in 10 minutes.
              </p>
              <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-500">
                Can't find it? Check your spam or junk folder.
              </p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <button
              onClick={handleVerifyCode}
              disabled={!code || verifying}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {verifying ? 'Verifying…' : 'Sign in'}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || sending}
                className="text-blue-600 hover:underline disabled:cursor-default disabled:text-gray-400 dark:text-blue-400"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
              <button
                onClick={() => {
                  setCodeSent(false)
                  setCode('')
                  setFormError('')
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← Different email
              </button>
            </div>
          </div>
        )}

        {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
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
