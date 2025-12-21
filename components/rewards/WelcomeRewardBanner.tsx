'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import PXPRewardsService, { REWARD_AMOUNTS } from '@/utils/rewards-contract'
import { useAuth } from '@/context/AuthContext'
import WalletLinkingModal from '@/components/auth/WalletLinkingModal'

interface WelcomeRewardBannerProps {
  userAddress?: string
}

export default function WelcomeRewardBanner({ userAddress }: WelcomeRewardBannerProps) {
  const { address } = useAccount()
  const { user, hasWallet, refreshUser } = useAuth()
  const walletAddress = userAddress || address || user?.walletAddress || undefined

  const [eligible, setEligible] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [message, setMessage] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const [showWalletLinking, setShowWalletLinking] = useState(false)

  useEffect(() => {
    if (!walletAddress) return

    // Check eligibility
    fetch(`/api/rewards/check-welcome?address=${walletAddress}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.eligible) {
          setEligible(true)
        }
      })
      .catch((error) => {
        console.error('Error checking reward eligibility:', error)
      })
  }, [walletAddress])

  const handleClaim = async () => {
    if (!walletAddress) return

    setClaiming(true)
    setMessage('')

    try {
      // Check if wallet is connected via browser provider
      if (!window.ethereum) {
        setMessage('❌ Please connect your wallet first')
        setClaiming(false)
        return
      }

      // Use browser's ethereum provider for transactions
      const Web3 = (await import('web3')).default
      const web3 = new Web3(window.ethereum as any)
      const service = new PXPRewardsService(web3)

      // Call blockchain to claim reward
      const tx = await service.claimNewUserReward(walletAddress)

      setMessage(
        `🎉 Success! You earned ${REWARD_AMOUNTS.NEW_USER} PXP! Transaction: ${tx.transactionHash}`
      )
      setEligible(false)

      // Update database
      await fetch('/api/rewards/mark-claimed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress }),
      })
    } catch (error: any) {
      console.error('Error claiming reward:', error)
      setMessage(
        `❌ Returned error: ${error.message || 'Failed to claim reward. Please try again.'}`
      )
    } finally {
      setClaiming(false)
    }
  }

  const handleWalletLinked = async () => {
    setShowWalletLinking(false)
    await refreshUser() // Refresh user data to get new wallet address
    // Re-check eligibility after wallet is linked
    if (user?.walletAddress) {
      const response = await fetch(`/api/rewards/check-welcome?address=${user.walletAddress}`)
      const data = await response.json()
      if (data.eligible) {
        setEligible(true)
      }
    }
  }

  if (!eligible || dismissed) return null

  return (
    <>
      <div className="mb-6 rounded-lg border-2 border-blue-500 bg-blue-50 p-6 dark:bg-blue-900/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              🎁 Welcome Reward Available!
            </h3>
            <p className="mt-2 text-blue-800 dark:text-blue-200">
              Claim your welcome reward of <strong>{REWARD_AMOUNTS.NEW_USER} PXP tokens</strong> for
              joining the Piano Blog community!
            </p>

            {!hasWallet && (
              <div className="mt-3 rounded bg-yellow-100 p-3 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                ⚠️ You need to link a wallet to claim PXP rewards. PXP tokens are blockchain-based
                and require a wallet address.
              </div>
            )}

            {message && (
              <div
                className={`mt-3 rounded p-3 ${
                  message.startsWith('🎉')
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                }`}
              >
                {message}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              {hasWallet ? (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {claiming ? 'Claiming...' : 'Claim Reward'}
                </button>
              ) : (
                <button
                  onClick={() => setShowWalletLinking(true)}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Link Wallet to Claim
                </button>
              )}
              <button
                onClick={() => setDismissed(true)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>

      {showWalletLinking && (
        <WalletLinkingModal
          onClose={() => setShowWalletLinking(false)}
          onSuccess={handleWalletLinked}
          reason="to claim your PXP welcome reward"
        />
      )}
    </>
  )
}
