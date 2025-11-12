'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from './Link'

export default function UserMenu() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if user is logged in
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setIsLoggedIn(true)
            setUsername(data.user.username || data.user.displayName || 'User')
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
      }
    }

    checkSession()
  }, [])

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
    setIsLoggingOut(true)
    setIsOpen(false)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        setIsLoggedIn(false)
        setUsername(null)
        router.push('/')
        router.refresh()
      } else {
        console.error('Logout failed')
        alert('Logout failed. Please try again.')
      }
    } catch (error) {
      console.error('Logout error:', error)
      alert('Logout failed. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Don't show if not logged in
  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
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
        <div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {username}
            </p>
          </div>

          <Link
            href="/profile"
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20 block px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
            onClick={() => setIsOpen(false)}
          >
            My Profile
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20 block w-full px-4 py-2 text-left text-sm text-gray-700 disabled:opacity-50 dark:text-gray-300"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  )
}
