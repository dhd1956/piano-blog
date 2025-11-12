'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in (has auth session)
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setIsLoggedIn(!!data.user)
        }
      } catch (error) {
        console.error('Session check failed:', error)
      }
    }

    checkSession()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        // Redirect to home page after logout
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

  // Don't show button if not logged in
  if (!isLoggedIn) {
    return null
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="hover:text-primary-500 dark:hover:text-primary-400 m-1 font-medium text-gray-900 disabled:opacity-50 dark:text-gray-100"
      title="Sign out of your account"
    >
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>
  )
}
