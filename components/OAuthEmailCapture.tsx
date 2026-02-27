'use client'

import { useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * OAuthEmailCapture Component
 *
 * Automatically captures email from OAuth providers (Google, etc.) when a user
 * first connects and sends it to the profile API for user creation.
 *
 * For OAuth users:
 * - Email is auto-verified (since OAuth provider verified it)
 * - Redirects new users to profile setup wizard
 * - Existing users skip profile setup
 */
export default function OAuthEmailCapture() {
  const { address, isConnected, embeddedWalletInfo } = useAppKitAccount()
  const { refreshUser, isAuthenticated } = useAuth()
  const { disconnect } = useDisconnect()
  const hasProcessedRef = useRef<Set<string>>(new Set())
  const wasAuthenticatedRef = useRef(false)
  const router = useRouter()

  // Clear processed addresses on logout so re-login works
  useEffect(() => {
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      hasProcessedRef.current.clear()
    }
    wasAuthenticatedRef.current = isAuthenticated
  }, [isAuthenticated])

  useEffect(() => {
    const captureEmail = async () => {
      // Only process if connected with an address and not already processed
      if (!isConnected || !address || hasProcessedRef.current.has(address)) {
        return
      }

      // Don't re-authenticate if user just logged out
      if (typeof window !== 'undefined' && sessionStorage.getItem('user_logged_out') === 'true') {
        return
      }

      // Skip if already authenticated (prevent duplicate processing)
      if (isAuthenticated) {
        hasProcessedRef.current.add(address)
        return
      }

      // --- Wallet Linking Mode ---
      // If user is already authenticated AND has a wallet_linking_intent flag,
      // link this new embedded wallet to their existing account instead of creating a new session.
      const isLinkingMode =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('wallet_linking_intent') === 'true' &&
        isAuthenticated

      if (isLinkingMode) {
        // Mark as processed immediately to prevent duplicate calls
        hasProcessedRef.current.add(address)

        const email = embeddedWalletInfo?.user?.email
        const authProvider = embeddedWalletInfo?.authProvider

        console.log(
          `[OAuthEmailCapture] Wallet linking mode: linking ${address} to existing account`
        )

        try {
          const response = await fetch('/api/auth/link-embedded-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              walletAddress: address,
              ...(email && { email }),
              ...(authProvider && { authProvider }),
            }),
          })

          const data = await response.json()

          if (response.ok && data.success) {
            console.log('[OAuthEmailCapture] Embedded wallet linked successfully')
            await refreshUser()
            console.log('[OAuthEmailCapture] AuthContext refreshed after wallet linking')
          } else {
            console.error('[OAuthEmailCapture] Wallet linking failed:', data.message)
          }
        } catch (error) {
          console.error('[OAuthEmailCapture] Error linking wallet:', error)
        } finally {
          // Clean up: clear intent flag and disconnect the Reown wallet session
          sessionStorage.removeItem('wallet_linking_intent')
          disconnect()
        }

        return
      }

      // --- Normal Flow (unauthenticated users) ---
      // Requires embedded wallet info with email
      if (!embeddedWalletInfo?.user?.email) {
        return
      }

      const email = embeddedWalletInfo.user.email
      const authProvider = embeddedWalletInfo.authProvider

      console.log(`[OAuthEmailCapture] Detected ${authProvider} login with email: ${email}`)

      try {
        // Call profile API with email and emailVerified query parameters
        // This will auto-create user with email if they don't exist
        const response = await fetch(
          `/api/profile/${address}?email=${encodeURIComponent(email)}&emailVerified=true&authProvider=${authProvider}`
        )

        if (response.ok) {
          const data = await response.json()
          console.log(`[OAuthEmailCapture] Successfully captured email for user ${address}`)

          // Mark this address as processed to avoid duplicate calls
          hasProcessedRef.current.add(address)

          // Create session via embedded-login endpoint
          try {
            const loginResponse = await fetch('/api/auth/embedded-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                walletAddress: address,
                email: email,
                authProvider: authProvider,
              }),
            })

            if (loginResponse.ok) {
              const loginData = await loginResponse.json()
              console.log(
                `[OAuthEmailCapture] Session created for embedded wallet user (isNew: ${loginData.isNewUser})`
              )

              // Sync AuthContext with the new session
              await refreshUser()
              console.log('[OAuthEmailCapture] AuthContext refreshed')

              // Disconnect the Reown embedded wallet — our session is now managed
              // via cookie, so we don't need the wallet connection to persist.
              // This prevents the SIWE/SIWX "connect to wallet" popup from appearing.
              disconnect()

              if (loginData.showWelcomeReward) {
                console.log(
                  `[OAuthEmailCapture] User earned ${loginData.welcomePXP} PXP welcome reward`
                )
              }
            } else {
              console.warn(
                '[OAuthEmailCapture] Failed to create session:',
                loginResponse.statusText
              )
            }
          } catch (loginError) {
            console.error('[OAuthEmailCapture] Error creating session:', loginError)
          }

          // Smart completion logic: Check if user has essential fields
          const profile = data.profile
          const hasEssentialFields = !!(profile?.username && profile?.displayName && profile?.email)

          // Auto-complete profile if user has essential fields but profileCompleted is false
          if (profile && hasEssentialFields && !profile.profileCompleted) {
            console.log('[OAuthEmailCapture] User has essential fields - auto-completing profile')
            try {
              await fetch(`/api/profile/${address}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  requesterAddress: address,
                  profileCompleted: true,
                  profileCompletedAt: new Date().toISOString(),
                }),
              })
              console.log('[OAuthEmailCapture] Profile auto-completed')
            } catch (err) {
              console.error('[OAuthEmailCapture] Failed to auto-complete profile:', err)
            }
          }
          // Only redirect to setup if user is truly new (no username)
          else if (profile && !profile.username) {
            console.log(
              '[OAuthEmailCapture] New user without username - redirecting to profile setup'
            )
            router.push('/profile/setup')
          } else {
            console.log('[OAuthEmailCapture] Returning user - no setup needed')
          }
        } else {
          console.warn(`[OAuthEmailCapture] Failed to capture email: ${response.statusText}`)
        }
      } catch (error) {
        console.error('[OAuthEmailCapture] Error capturing email:', error)
      }
    }

    captureEmail()
  }, [isConnected, address, embeddedWalletInfo, router, refreshUser, isAuthenticated, disconnect])

  // This component doesn't render anything
  return null
}
