'use client'

/**
 * AuthContext - Session-based Authentication Context
 * Provides session auth state to the entire application without requiring wallets
 * Wraps existing backend auth infrastructure (JWT tokens, HttpOnly cookies)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { UserRole } from '@prisma/client'

// User interface matching the backend AuthUser type
export interface User {
  id: number
  username: string | null
  email: string | null
  walletAddress: string | null // Optional - only needed for PXP rewards
  role: UserRole
  displayName: string | null
  emailVerified?: boolean
  walletType?: 'embedded' | 'external' | 'linked' | null
  authProvider?: string | null
}

// Auth state interface
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  hasWallet: boolean
  isEmbeddedWallet: boolean
  error: string | null
}

// Auth actions interface
export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<LoginResult>
  loginWithWallet: (walletAddress: string) => Promise<LoginResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

// Login credentials type (supports both username and identifier for flexibility)
export type LoginCredentials = {
  username?: string
  identifier?: string // Email or username - new flexible field
  password: string
}

// Login result type
export type LoginResult = {
  success: boolean
  message?: string
  error?: string
  requiresVerification?: boolean
}

// Combined context type
export type AuthContextType = AuthState & AuthActions

// Create context with undefined default (will throw if used outside provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// AuthProvider props
export interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * AuthProvider Component
 * Wraps the app and provides session-based authentication state
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Derived state
  const isAuthenticated = user !== null
  const hasWallet = user?.walletAddress !== null && user?.walletAddress !== undefined
  const isEmbeddedWallet = user?.walletType === 'embedded'

  /**
   * Fetch current user from /api/auth/me
   * Called on mount and after login/logout
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Login with username and password
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    try {
      setError(null)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        return {
          success: true,
          message: data.message,
        }
      } else {
        setError(data.message || data.error || 'Login failed')
        return {
          success: false,
          error: data.message || data.error || 'Login failed',
          requiresVerification: data.requiresVerification,
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error during login'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }, [])

  /**
   * Login with wallet address (for existing wallet users)
   */
  const loginWithWallet = useCallback(async (walletAddress: string): Promise<LoginResult> => {
    try {
      setError(null)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ walletAddress }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        return {
          success: true,
          message: data.message,
        }
      } else {
        setError(data.message || data.error || 'Wallet login failed')
        return {
          success: false,
          error: data.message || data.error || 'Wallet login failed',
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error during wallet login'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }, [])

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Always clear client-side state
      setUser(null)
      setError(null)
    }
  }, [])

  /**
   * Refresh user data (e.g., after profile update)
   */
  const refreshUser = useCallback(async () => {
    await fetchCurrentUser()
  }, [fetchCurrentUser])

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Fetch current user on mount
  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  // Context value
  const value: AuthContextType = {
    // State
    user,
    isAuthenticated,
    isLoading,
    hasWallet,
    isEmbeddedWallet,
    error,
    // Actions
    login,
    loginWithWallet,
    logout,
    refreshUser,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth Hook
 * Access auth context from any component
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
