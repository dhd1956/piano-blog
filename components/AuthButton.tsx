'use client'

/**
 * AuthButton Component
 *
 * Session-first authentication button for the header
 * Shows "Sign In" when not authenticated, user menu when authenticated
 * No wallet connection required unless user wants blockchain features
 */

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useAppKit } from '@reown/appkit/react'
import Link from './Link'
import LoginModal from './auth/LoginModal'
import SignupModal from './auth/SignupModal'

export default function AuthButton() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { open } = useAppKit()

  const [isOpen, setIsOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = user?.displayName || user?.username || 'User'
  const profileUrl = user?.username ? `/profile/${user.username}` : '/profile'

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
  }

  const handleOpenLogin = () => {
    setShowLoginModal(true)
  }

  const handleOpenSignup = () => {
    setShowSignupModal(true)
    setShowLoginModal(false)
  }

  const handleSwitchToLogin = () => {
    setShowSignupModal(false)
    setShowLoginModal(true)
  }

  const handleLinkWallet = () => {
    sessionStorage.setItem('wallet_linking_intent', 'true')
    open()
    setIsOpen(false)
  }

  // Show loading state
  if (isLoading) {
    return <div className="h-9 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
  }

  // Show "Sign In" button if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenLogin}
            className="hover:text-primary-500 dark:hover:text-primary-400 font-medium text-gray-900 dark:text-gray-100"
          >
            Sign In
          </button>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <button
            onClick={handleOpenSignup}
            className="hover:text-primary-500 dark:hover:text-primary-400 font-medium text-gray-900 dark:text-gray-100"
          >
            Sign Up
          </button>
        </div>

        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSuccess={() => setShowLoginModal(false)}
          />
        )}

        {showSignupModal && (
          <SignupModal
            onClose={() => setShowSignupModal(false)}
            onSuccess={() => setShowSignupModal(false)}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}
      </>
    )
  }

  // Show user menu if authenticated
  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:text-primary-500 dark:hover:text-primary-400 flex items-center gap-1 font-medium text-gray-900 dark:text-gray-100"
        aria-label="User menu"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="hidden sm:inline">{displayName}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-[100] mt-2 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {/* User info header */}
          <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {displayName}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            )}
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Role: {user?.role}</p>
          </div>

          {/* Profile link */}
          <Link
            href={profileUrl}
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20 block px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
            onClick={() => setIsOpen(false)}
          >
            My Profile
          </Link>

          {/* Account Settings link */}
          <Link
            href="/account/settings"
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20 block px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Account Settings
            </div>
          </Link>

          {/* Connect Wallet option (if no wallet linked) */}
          {!user?.walletAddress && (
            <button
              onClick={handleLinkWallet}
              className="hover:bg-primary-50 dark:hover:bg-primary-900/20 block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300"
            >
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Connect Wallet (for PXP)
              </div>
            </button>
          )}

          {/* Wallet info (if wallet linked) */}
          {user?.walletAddress && (
            <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Wallet</p>
              <p className="truncate font-mono text-xs text-gray-700 dark:text-gray-300">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </p>
              {user.walletType !== 'embedded' && (
                <button
                  onClick={handleLinkWallet}
                  className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 mt-1 text-xs"
                >
                  Switch to Embedded Wallet
                </button>
              )}
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20 block w-full border-t border-gray-200 px-4 py-2 text-left text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300"
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
