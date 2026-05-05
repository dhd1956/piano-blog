/**
 * Route Protection Hook
 * Redirects unauthenticated users to login and shows modal
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface UseRequireAuthOptions {
  redirectTo?: string
  onUnauthenticated?: () => void
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { redirectTo, onUnauthenticated } = options

  useEffect(() => {
    // Don't redirect while still checking auth status
    if (isLoading) {
      return
    }

    // User is not authenticated
    if (!isAuthenticated) {
      // Save the intended destination for post-login redirect
      if (typeof window !== 'undefined' && pathname) {
        sessionStorage.setItem('redirectAfterLogin', pathname)
      }

      // Call custom handler if provided
      if (onUnauthenticated) {
        onUnauthenticated()
        return
      }

      // Default: redirect straight to login, preserving the intended destination
      const redirectPath =
        redirectTo || `/auth/login?redirect=${encodeURIComponent(pathname || '/')}`
      router.push(redirectPath)
    }
  }, [isAuthenticated, isLoading, pathname, router, redirectTo, onUnauthenticated])

  return {
    isAuthenticated,
    isLoading,
    isProtected: !isLoading && !isAuthenticated,
  }
}
