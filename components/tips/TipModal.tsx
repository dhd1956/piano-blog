'use client'

import React, { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { PXP_TOKEN_ADDRESS, ERC20_ABI } from '@/utils/rewards-contract'

interface TipModalProps {
  recipientAddress: string
  recipientName?: string
  walletAddress?: string
  isWalletConnected: boolean
  openWalletModal: () => void
  onClose: () => void
  onTipSent: (transactionHash: string, amount: number) => void
}

const PRESET_AMOUNTS = [5, 10, 25]

type ModalState = 'idle' | 'processing' | 'confirming' | 'success' | 'error'

export default function TipModal({
  recipientAddress,
  recipientName,
  walletAddress,
  isWalletConnected,
  openWalletModal,
  onClose,
  onTipSent,
}: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [modalState, setModalState] = useState<ModalState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Use wagmi's writeContract hook - this integrates with Reown/AppKit and gas sponsorship
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
  }, [isConfirmed, txHash])

  useEffect(() => {
    const error = writeError || confirmError
    if (error) {
      console.error('[TipModal] Transaction error:', error)
      setErrorMessage(error.message || 'Transaction failed')
      setModalState('error')
    }
  }, [writeError, confirmError])

  const isConnected = isWalletConnected && !!walletAddress

  const connectWallet = () => {
    openWalletModal()
  }

  const getAmount = (): number => {
    if (customAmount) {
      return parseFloat(customAmount)
    }
    return selectedAmount || 0
  }

  const isValidAmount = (): boolean => {
    const amount = getAmount()
    return amount > 0 && !isNaN(amount)
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

    if (!isConnected) {
      connectWallet()
      return
    }

    if (!isValidAmount()) {
      setErrorMessage('Please select or enter a valid amount')
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

              {/* Wallet connection prompt */}
              {!isConnected && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Connect your wallet to send a tip
                  </p>
                  <button
                    onClick={connectWallet}
                    className="mt-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}

              {/* Amount selection */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount (PXP)
                </label>
                <div className="mb-3 flex gap-2">
                  {PRESET_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handlePresetClick(amount)}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                        selectedAmount === amount && !customAmount
                          ? 'border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      {amount} PXP
                    </button>
                  ))}
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
              disabled={modalState === 'processing' || (!isConnected && !isValidAmount())}
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
              ) : isConnected ? (
                `Send ${isValidAmount() ? getAmount() : ''} PXP`
              ) : (
                'Connect & Send'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
