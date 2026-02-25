'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppKit } from '@reown/appkit/react'
import { useAuth } from '@/context/AuthContext'
import { useAppKitReady } from '@/context/ReownProvider'

// Inner component that uses useAppKit() — only rendered after createAppKit is called
function LoginReady() {
  const searchParams = useSearchParams()
  const { open } = useAppKit()
  const { isAuthenticated, isLoading } = useAuth()
  const hasAutoOpened = useRef(false)

  const redirectTo = searchParams.get('redirect') || '/'

  // Redirect after authentication
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = redirectTo
    }
  }, [isLoading, isAuthenticated, redirectTo])

  // Auto-open the Reown modal on mount so users go straight to Google/Email sign-in
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasAutoOpened.current) {
      hasAutoOpened.current = true
      sessionStorage.removeItem('user_logged_out')
      open({ view: 'Connect' })
    }
  }, [isLoading, isAuthenticated, open])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Fallback UI if user closes the modal
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
      <div className="flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Sign In
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            Sign in with your Google account or email to get started
          </p>

          <button
            onClick={() => {
              sessionStorage.removeItem('user_logged_out')
              open({ view: 'Connect' })
            }}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Sign In
          </button>

          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            No password needed — sign in with Google or enter your email to receive a login code.
          </p>
        </div>
      </div>
    </div>
  )
}

// Outer component that waits for AppKit to be initialized before rendering
// the inner component. createAppKit is loaded asynchronously (dynamic import),
// so useAppKit() would throw if called before it's ready.
function LoginContent() {
  const appKitReady = useAppKitReady()

  if (!appKitReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <LoginReady />
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
