'use client'

/**
 * LoginModal Component
 *
 * Session-first authentication modal with three tabs:
 * 1. Email/Username - Primary auth method (no wallet needed)
 * 2. Google - OAuth login (no wallet needed)
 * 3. Wallet - For existing wallet-only users
 */

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface LoginModalProps {
  onClose: () => void
  onSuccess?: () => void
  defaultTab?: 'email' | 'google' | 'wallet'
}

type TabType = 'email' | 'google' | 'wallet'

export default function LoginModal({ onClose, onSuccess, defaultTab = 'email' }: LoginModalProps) {
  const { login, loginWithWallet } = useAuth()

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Email/Username tab state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Wallet tab state
  const [walletAddress, setWalletAddress] = useState('')

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)

  /**
   * Handle email/username login
   */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login({ username, password })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle wallet login
   */
  const handleWalletLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        throw new Error('Invalid wallet address format')
      }

      const result = await loginWithWallet(walletAddress)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'Wallet login failed')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during wallet login')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle Google OAuth login (placeholder - will implement in Phase 7)
   */
  const handleGoogleLogin = () => {
    setError('Google login coming soon! For now, please use email/username or create an account.')
  }

  /**
   * Handle forgot password request
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotPasswordEmail }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setForgotPasswordSent(true)
      } else {
        setError(data.message || 'Failed to send reset email')
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Tab button component
   */
  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <button
      type="button"
      onClick={() => {
        setActiveTab(tab)
        setError('')
      }}
      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
        activeTab === tab
          ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Welcome to Piano Blog
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none dark:hover:bg-gray-700"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex border-b border-gray-200 dark:border-gray-700">
          <TabButton tab="email" label="Email" />
          <TabButton tab="google" label="Google" />
          <TabButton tab="wallet" label="Wallet" />
        </div>

        {/* Content */}
        {!success ? (
          <div className="mt-6">
            {/* Error message (shown across all tabs) */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && !showForgotPassword && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-4 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        // TODO: Open signup modal
                        setError(
                          'Signup coming soon! For now, please contact the blog owner to create an account.'
                        )
                      }}
                      className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Forgot Password Form */}
            {activeTab === 'email' && showForgotPassword && (
              <div className="space-y-4">
                {!forgotPasswordSent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Reset Your Password
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Enter your email or username and we'll send you a password reset link.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="forgotPasswordEmail"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Email or Username
                      </label>
                      <input
                        type="text"
                        id="forgotPasswordEmail"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        placeholder="email@example.com or username"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false)
                          setForgotPasswordEmail('')
                          setError('')
                        }}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        disabled={loading}
                      >
                        Back to Login
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                      <div className="flex items-center gap-3">
                        <svg
                          className="h-6 w-6 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <h4 className="font-semibold text-green-900 dark:text-green-100">
                            Email Sent!
                          </h4>
                          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                            If an account exists with that email or username, you'll receive a
                            password reset link shortly.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setForgotPasswordSent(false)
                        setForgotPasswordEmail('')
                      }}
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Back to Login
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Google Tab */}
            {activeTab === 'google' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sign in with your Google account to get started quickly. No wallet needed!
                </p>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  disabled={loading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="border-t border-gray-200 pt-4 text-center dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <form onSubmit={handleWalletLogin} className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    For existing users with wallet addresses.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="walletAddress"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    id="walletAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter your Ethereum wallet address (0x...)
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Tip:</strong> Add an email to your account for easier login next time.
                    You won't need to enter your wallet address anymore!
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="mt-6 text-center">
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
              Login Successful!
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  )
}
