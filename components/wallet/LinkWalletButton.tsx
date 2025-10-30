'use client'

/**
 * LinkWalletButton Component
 * Allows username-based users to link a Web3 wallet to their account
 * Includes signature verification and automatic PXP minting
 */

import React, { useState } from 'react'
import { ethers } from 'ethers'

interface LinkWalletButtonProps {
  username: string
  pendingPXP?: number
  onSuccess?: (walletAddress: string) => void
  onError?: (error: string) => void
}

export default function LinkWalletButton({
  username,
  pendingPXP = 0,
  onSuccess,
  onError,
}: LinkWalletButtonProps) {
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleLinkWallet = async () => {
    try {
      setIsLinking(true)
      setError(null)

      // 1. Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.')
      }

      // 2. Request wallet connection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet accounts found')
      }

      const walletAddress = accounts[0]

      // 3. Create message for signature
      const message = `I want to link wallet ${walletAddress} to my Piano Style account "${username}".\n\nThis proves I own this wallet.\n\nTimestamp: ${Date.now()}`

      // 4. Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      })

      // 5. Send to backend for verification and linking
      const response = await fetch('/api/auth/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          walletAddress,
          signature,
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link wallet')
      }

      // Success!
      setSuccess(true)

      // Show success message with PXP info
      if (data.pxpMinting && data.pxpMinting.success && data.pxpMinting.amount > 0) {
        alert(
          `Wallet linked successfully!\n\n` +
            `${data.pxpMinting.amount} PXP tokens have been minted to your wallet.\n\n` +
            `Wallet: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`
        )
      } else {
        alert(
          `Wallet linked successfully!\n\n` +
            `Wallet: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`
        )
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(walletAddress)
      }

      // Reload page to show updated profile
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      console.error('Error linking wallet:', err)
      const errorMessage = err.message || 'Failed to link wallet'
      setError(errorMessage)

      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsLinking(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        <p className="font-medium">✓ Wallet linked successfully!</p>
        <p className="text-sm">Refreshing page...</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
      <div className="mb-4">
        <h3 className="mb-2 text-lg font-semibold text-blue-900">Connect Your Web3 Wallet</h3>
        <p className="text-sm text-blue-800">
          Link a wallet to your account to access Web3 features and receive PXP tokens on-chain.
        </p>
        {pendingPXP > 0 && (
          <p className="mt-2 text-sm font-medium text-blue-900">
            💎 You have {pendingPXP} PXP tokens waiting to be minted to your wallet!
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        onClick={handleLinkWallet}
        disabled={isLinking}
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLinking ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting Wallet...
          </span>
        ) : (
          '🔗 Connect Wallet'
        )}
      </button>

      <p className="mt-3 text-xs text-gray-600">
        By linking your wallet, you'll be able to receive PXP rewards directly and participate in
        the Web3 community features.
      </p>
    </div>
  )
}
