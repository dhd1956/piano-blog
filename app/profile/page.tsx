'use client'

/**
 * WPB-140: My Profile Page
 * Base profile page that redirects to user's own profile
 * Replaces the Projects page in navigation
 *
 * Supports both Web3 (wallet) and traditional (username/password) authentication
 */

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHybridWallet } from '@/hooks/useHybridWallet'

export default function MyProfilePage() {
  const router = useRouter()
  const { walletAddress, isConnected, isLoading, connectWallet } = useHybridWallet()
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in via username/password
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          if (data.user && data.user.username) {
            setUsername(data.user.username)
            // Redirect to profile using username
            router.push(`/profile/${data.user.username}`)
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
      }
    }

    checkSession()
  }, [router])

  useEffect(() => {
    // If wallet is connected, redirect to profile page using wallet address
    if (isConnected && walletAddress) {
      router.push(`/profile/${walletAddress}`)
    }
  }, [isConnected, walletAddress, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="text-gray-700 dark:text-gray-300">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  // Not connected - show authentication options
  if ((!isConnected || !walletAddress) && !username) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        <div className="flex min-h-screen items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">
              My Profile
            </h1>

            <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
              Sign in to view and edit your musician profile, showcase your skills, and connect with
              the community.
            </p>

            {/* Web3 Wallet Option */}
            <button
              onClick={connectWallet}
              className="bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 mb-3 inline-flex w-full items-center justify-center rounded-md px-6 py-3 text-base font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Connect Wallet (Web3)
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  or
                </span>
              </div>
            </div>

            {/* Traditional Login/Signup */}
            <a
              href="/auth/login"
              className="focus:ring-primary-500 inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Sign in with Username
            </a>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <a
                href="/auth/signup"
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Create one here
              </a>
            </p>

            <div className="mt-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                What you can do with your profile:
              </h3>
              <ul className="space-y-1 text-left text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-start">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  List the instruments you play
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Share your musical styles and experience
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Showcase your performance videos and recordings
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Indicate availability for gigs and collaborations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Connected - redirecting (this should happen via useEffect)
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="text-gray-700 dark:text-gray-300">Redirecting to your profile...</p>
        </div>
      </div>
    </div>
  )
}
