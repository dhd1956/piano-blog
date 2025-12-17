'use client'

/**
 * Forgot Password Page
 * Allows users to request a password reset link via email
 */

import React, { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to send password reset email')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch (err: any) {
      console.error('Forgot password error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        <div className="flex min-h-screen items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                Check Your Email
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                If an account exists with that email or username, we've sent a password reset link.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <p>Please check your email inbox for a message from Piano Blog.</p>
                <p>The password reset link will expire in 1 hour.</p>
                <p className="text-xs">
                  Didn't receive the email? Check your spam folder or try again in a few minutes.
                </p>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  ← Back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
      <div className="flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Reset Your Password
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your email or username to receive a password reset link
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email or Username */}
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email or Username
                </label>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="your@email.com or username"
                  disabled={loading}
                  autoComplete="username"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter the email address or username associated with your account
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="focus:ring-primary-500 w-full rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:bg-gray-400 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to login
              </Link>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Need help?{' '}
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
