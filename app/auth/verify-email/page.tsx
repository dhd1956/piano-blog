'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    verifyEmail(token)
  }, [token])

  async function verifyEmail(verificationToken: string) {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')

        // Redirect to profile setup or dashboard after 3 seconds
        setTimeout(() => {
          router.push('/profile')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('An error occurred during verification')
    }
  }

  async function handleResendEmail() {
    // This would need the user's email - for now just show message
    setResending(true)
    try {
      // Note: In a real implementation, you'd need to identify the user
      // either from the expired token or ask them to enter their email
      setMessage('Please log in again to resend verification email')
    } catch (error) {
      console.error('Resend error:', error)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">🎵 Piano Blog</h1>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Email Verification
          </h2>
        </div>

        <div className="mt-8 rounded-lg bg-white p-8 shadow-sm dark:bg-gray-800">
          {status === 'loading' && (
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Verifying your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg
                  className="h-10 w-10 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Email Verified!
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                Redirecting you to your profile...
              </p>
              <div className="mt-6">
                <Link
                  href="/profile"
                  className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
                >
                  Go to Profile
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <svg
                  className="h-10 w-10 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Verification Failed
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>

              {message.includes('expired') && (
                <div className="mt-6">
                  <button
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:focus:ring-offset-gray-800"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              )}

              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  ← Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Need help? Contact support@pianoblog.com
        </p>
      </div>
    </div>
  )
}
