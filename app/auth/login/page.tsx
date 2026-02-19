'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppKit } from '@reown/appkit/react'
import { useAuth } from '@/context/AuthContext'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { open } = useAppKit()
  const { isAuthenticated, isLoading } = useAuth()

  const redirectTo = searchParams.get('redirect') || '/'

  // Auto-open Reown modal on mount
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      open()
    }
  }, [isLoading, isAuthenticated, open])

  // Redirect after authentication
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, router, redirectTo])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
      <div className="flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Sign in to continue
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            Sign in with Google or email to access your account
          </p>

          <button
            onClick={() => open()}
            className="rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
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
