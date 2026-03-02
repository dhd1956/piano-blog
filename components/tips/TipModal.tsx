'use client'

import React, { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { PXP_TOKEN_ADDRESS, ERC20_ABI } from '@/utils/rewards-contract'

interface TipModalProps {
  recipientAddress: string
  recipientName?: string
  walletAddress?: string
  onClose: () => void
  onTipSent: (transactionHash: string, amount: number) => void
}

const PRESET_AMOUNTS = [5, 10, 25]

type ModalState = 'idle' | 'processing' | 'confirming' | 'success' | 'error'

export default function TipModal({
  recipientAddress,
  recipientName,
  walletAddress,
  onClose,
  onTipSent,
}: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [modalState, setModalState] = useState<ModalState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Read sender's on-chain PXP balance
  const { data: pxpBalance, refetch: refetchBalance } = useReadContract({
    address: PXP_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [walletAddress as `0x${string}`],
    query: {
      enabled: !!walletAddress,
      staleTime: 0, // Always fetch fresh — user may have just claimed PXP
    },
  })

  // Welcome reward claim (inline, so user never has to leave the modal)
  const [welcomeEligible, setWelcomeEligible] = useState<boolean | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [claimSuccess, setClaimSuccess] = useState(false)

  // Use wagmi's writeContract hook - this integrates with Privy embedded wallet
  const {
    data: txHash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Handle transaction states
  useEffect(() => {
    if (isWritePending) {
      setModalState('processing')
    }
  }, [isWritePending])

  useEffect(() => {
    if (isConfirming) {
      setModalState('confirming')
    }
  }, [isConfirming])

  useEffect(() => {
    if (isConfirmed && txHash) {
      setModalState('success')

      // Record the tip to the database
      const amount = getAmount()
      fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress: walletAddress,
          toAddress: recipientAddress,
          amount,
          transactionHash: txHash,
          message: message || undefined,
        }),
      }).catch((err) => console.warn('Failed to record tip to database:', err))

      // Notify parent after a short delay
      setTimeout(() => {
        onTipSent(txHash, amount)
      }, 2000)
    }
  }, [isConfirmed, txHash]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const error = writeError || confirmError
    if (error) {
      console.error('[TipModal] Transaction error:', error)
      // Show a human-readable message instead of the raw viem/contract error
      const msg = error.message || ''
      if (msg.includes('InsufficientBalance') || msg.includes('insufficient')) {
        setErrorMessage("You don't have enough PXP to send that amount.")
      } else if (msg.includes('rejected') || msg.includes('denied')) {
        setErrorMessage('Transaction was cancelled.')
      } else {
        setErrorMessage('Transaction failed. Please try again.')
      }
      setModalState('error')
    }
  }, [writeError, confirmError])

  // Check welcome reward eligibility when the balance is below the minimum preset
  const balanceIsLow =
    pxpBalance !== undefined && parseFloat(formatEther(pxpBalance as bigint)) < PRESET_AMOUNTS[0]

  useEffect(() => {
    if (!balanceIsLow || !walletAddress) return
    fetch(`/api/rewards/check-welcome?address=${walletAddress}`)
      .then((r) => r.json())
      .then((d) => setWelcomeEligible(!!d.eligible))
      .catch(() => setWelcomeEligible(false))
  }, [balanceIsLow, walletAddress])

  const handleClaimWelcomeReward = async () => {
    setIsClaiming(true)
    setClaimError('')
    try {
      const res = await fetch('/api/rewards/claim-welcome', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to claim')
      setWelcomeEligible(false)
      setClaimSuccess(true)
      // Retry refetch up to 4 times (2s apart) — RPC nodes can lag behind
      // even after the server has confirmed the transaction on-chain.
      for (let i = 0; i < 4; i++) {
        const result = await refetchBalance()
        const balance = result.data ? parseFloat(formatEther(result.data as bigint)) : 0
        if (balance >= PRESET_AMOUNTS[0]) break
        await new Promise((r) => setTimeout(r, 2000))
      }
    } catch (err: any) {
      setClaimError(err.message || 'Claim failed — please try again')
    } finally {
      setIsClaiming(false)
    }
  }

  const getAmount = (): number => {
    if (customAmount) {
      return parseFloat(customAmount)
    }
    return selectedAmount || 0
  }

  const balanceInPXP =
    pxpBalance !== undefined ? parseFloat(formatEther(pxpBalance as bigint)) : null

  const isValidAmount = (): boolean => {
    const amount = getAmount()
    if (amount <= 0 || isNaN(amount)) return false
    if (balanceInPXP !== null && amount > balanceInPXP) return false
    return true
  }

  const getAmountError = (): string | null => {
    const amount = getAmount()
    if (amount <= 0 || isNaN(amount)) return null
    if (balanceInPXP !== null && amount > balanceInPXP) {
      return `You only have ${balanceInPXP.toFixed(2)} PXP`
    }
    return null
  }

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const handleSendTip = () => {
    // Guard against multiple submissions
    if (modalState === 'processing' || modalState === 'confirming') {
      return
    }

    if (getAmount() <= 0 || isNaN(getAmount())) {
      setErrorMessage('Please select or enter a valid amount')
      setModalState('error')
      return
    }

    if (balanceInPXP !== null && getAmount() > balanceInPXP) {
      setErrorMessage(`You only have ${balanceInPXP.toFixed(2)} PXP`)
      setModalState('error')
      return
    }

    const amount = getAmount()
    setErrorMessage('')
    resetWrite()

    // Use wagmi to write contract - this will use gas sponsorship if configured
    writeContract({
      address: PXP_TOKEN_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipientAddress as `0x${string}`, parseEther(amount.toString())],
    })
  }

  const handleRetry = () => {
    setModalState('idle')
    setErrorMessage('')
    resetWrite()
  }

  const displayName =
    recipientName || `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send Tip</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {modalState === 'success' ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Tip Sent!
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You sent {getAmount()} PXP to {displayName}
              </p>
              {txHash && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </p>
              )}
            </div>
          ) : modalState === 'confirming' ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                <svg className="h-10 w-10 animate-spin text-amber-500" viewBox="0 0 24 24">
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
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Confirming Transaction...
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Waiting for blockchain confirmation
              </p>
            </div>
          ) : (
            <>
              {/* Recipient */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sending to:{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{displayName}</span>
                </p>
              </div>

              {/* Amount selection */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount (PXP)
                  </label>
                  {balanceInPXP !== null && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Balance: {balanceInPXP.toFixed(2)} PXP
                    </span>
                  )}
                </div>
                {/* No balance warning + inline welcome reward claim */}
                {claimSuccess && (
                  <div className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    <p>
                      🎉 25 PXP claimed!{' '}
                      {balanceInPXP !== null && balanceInPXP >= PRESET_AMOUNTS[0]
                        ? 'You can now send a tip.'
                        : 'Balance is updating…'}
                    </p>
                  </div>
                )}
                {!claimSuccess && balanceInPXP !== null && balanceInPXP < PRESET_AMOUNTS[0] && (
                  <div className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    <p>You have {balanceInPXP.toFixed(2)} PXP — not enough to send a tip.</p>
                    {welcomeEligible === true && (
                      <button
                        onClick={handleClaimWelcomeReward}
                        disabled={isClaiming}
                        className="mt-2 rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        {isClaiming ? 'Claiming… (~5s)' : '🎁 Claim 25 PXP welcome reward'}
                      </button>
                    )}
                    {claimError && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{claimError}</p>
                    )}
                  </div>
                )}
                <div className="mb-3 flex gap-2">
                  {PRESET_AMOUNTS.map((amount) => {
                    const canAfford = balanceInPXP === null || amount <= balanceInPXP
                    return (
                      <button
                        key={amount}
                        onClick={() => canAfford && handlePresetClick(amount)}
                        disabled={!canAfford}
                        className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                          !canAfford
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600'
                            : selectedAmount === amount && !customAmount
                              ? 'border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        {amount} PXP
                      </button>
                    )
                  })}
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Or enter custom amount..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                {getAmountError() && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getAmountError()}</p>
                )}
              </div>

              {/* Optional message */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message (optional)
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Thanks for the great content!"
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              {/* Error message */}
              {modalState === 'error' && errorMessage && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
                  <button
                    onClick={handleRetry}
                    className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800 dark:text-red-300"
                  >
                    Try again
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {modalState !== 'success' && modalState !== 'confirming' && (
          <div className="flex gap-3 border-t border-gray-200 p-4 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSendTip}
              disabled={modalState === 'processing' || !isValidAmount()}
              className="flex-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {modalState === 'processing' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
                  Confirm in Wallet...
                </span>
              ) : (
                `Send ${isValidAmount() ? getAmount() : ''} PXP`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
