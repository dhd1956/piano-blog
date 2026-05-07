'use client'

// NO imports from @privy-io/* here. Privy hooks live in LoginContent.tsx,
// which is loaded lazily so its module never evaluates before Privy is ready.
// Top-level Privy imports caused a webpack circular-dependency TDZ error
// ("Cannot access 'X' before initialization") on every page load.

import { lazy, Suspense, Component, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { PrivyChunkReadyContext } from '@/context/PrivyProvider'

const LoginContent = lazy(() => import('./LoginContent'))

// sessionStorage throws SecurityError in iOS Private Browsing and some in-app browsers
function safeSessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // ignore SecurityError in Private Browsing / WebView
  }
}

class PrivyNotReadyBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { caught: boolean }
> {
  state = { caught: false }
  static getDerivedStateFromError() {
    return { caught: true }
  }
  componentDidCatch(error: Error) {
    console.warn('[LoginPage] Privy not yet ready:', error.message)
  }
  render() {
    return this.state.caught ? this.props.fallback : this.props.children
  }
}

function Spinner({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-blue-600 ${className}`}
      aria-hidden
    />
  )
}

// Shown while the Privy chunk is downloading. No Privy dependencies —
// renders immediately. Saves the email to sessionStorage so LoginContent
// can auto-send the OTP once Privy finishes loading.
function StaticEmailForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showEscape, setShowEscape] = useState(false)
  const [isRestrictedBrowser, setIsRestrictedBrowser] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    setIsRestrictedBrowser(
      /Instagram|FBAN|FBAV|Twitter|Line|WeChat|Snapchat/i.test(ua) ||
        (/Android/.test(ua) && /wv/.test(ua)) ||
        (/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua))
    )
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowEscape(true), 8000)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = () => {
    if (!email) return
    safeSessionSet('privy_preload_email', email)
    setSubmitted(true)
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '/auth/login'

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
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Open in your browser →
            </a>
          </div>
        )}

        {submitted ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-800 dark:bg-blue-900/20">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Finishing connection…
            </p>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              Your code will be sent to {email} shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and we&apos;ll send you a 6-digit code — no password needed.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!email}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              Continue with email
            </button>
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
              <span className="mx-3 shrink-0 text-xs text-gray-400">or</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            </div>
            <button
              disabled
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600"
            >
              Connecting…
            </button>
          </div>
        )}

        {!isRestrictedBrowser && showEscape && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">
              Taking too long? Try opening this page in Chrome or Safari.
            </p>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Open in browser →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const privyChunkReady = useContext(PrivyChunkReadyContext)
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const params = new URLSearchParams(window.location.search)
      window.location.href = params.get('redirect') || '/'
    }
  }, [authLoading, isAuthenticated])

  if (authLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Don't render LoginContent until the Privy chunk has loaded.
  // StaticEmailForm is shown immediately — no Privy deps, no TDZ risk.
  if (!privyChunkReady) {
    return <StaticEmailForm />
  }

  return (
    <Suspense fallback={<StaticEmailForm />}>
      <PrivyNotReadyBoundary fallback={<StaticEmailForm />}>
        <LoginContent />
      </PrivyNotReadyBoundary>
    </Suspense>
  )
}
