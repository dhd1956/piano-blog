'use client'

import React, { useState } from 'react'
import { CeloPaymentQRCode } from '@/components/qr/QRCodeGenerator'
import { useHybridWallet } from '@/hooks/useHybridWallet'
import { CAVRewardsService } from '@/utils/rewards-contract'

export interface PaymentRequest {
  recipientAddress: string
  recipientName?: string
  amount?: string
  memo?: string
  tokenAddress?: string
  chainId?: number
}

export interface UnifiedCAVPaymentProps {
  paymentRequest: PaymentRequest
  onPaymentInitiated?: (method: 'web3' | 'qr', details: any) => void
  onPaymentCompleted?: (transactionHash: string) => void
  onPaymentFailed?: (error: string) => void
  className?: string
  compact?: boolean
}

// Default CAV token configuration
const DEFAULT_CAV_CONFIG = {
  tokenAddress: '0xe787A01BafC3276D0B3fEB93159F60dbB99b889F',
  chainId: 44787, // Celo Alfajores
  decimals: 18,
}

export default function UnifiedCAVPayment({
  paymentRequest,
  onPaymentInitiated,
  onPaymentCompleted,
  onPaymentFailed,
  className = '',
  compact = false,
}: UnifiedCAVPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<'web3' | 'qr'>('web3')
  const [paymentAmount, setPaymentAmount] = useState(paymentRequest.amount || '')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>(
    'idle'
  )
  const [errorMessage, setErrorMessage] = useState('')

  const { walletAddress, isConnected, connectWallet } = useHybridWallet()

  // Payment method configurations
  const paymentMethods = [
    {
      id: 'web3' as const,
      title: '🌐 Web3 Wallet',
      description: 'Pay directly with your connected wallet',
      available: true,
      requiresConnection: true,
    },
    {
      id: 'qr' as const,
      title: '📱 QR Code',
      description: 'Generate QR code for wallet scanning',
      available: true,
      requiresConnection: false,
    },
  ]

  // Execute Web3 payment using CAV token transfer
  const executeWeb3Payment = async () => {
    if (!isConnected || !walletAddress) {
      setErrorMessage('Wallet not connected')
      setPaymentStatus('error')
      return
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setErrorMessage('Please enter a valid amount')
      setPaymentStatus('error')
      return
    }

    setIsProcessing(true)
    setPaymentStatus('pending')

    try {
      const cavService = new CAVRewardsService()

      onPaymentInitiated?.('web3', {
        from: walletAddress,
        to: paymentRequest.recipientAddress,
        amount: paymentAmount,
        memo: paymentRequest.memo || 'CAV Payment',
      })

      // Execute direct CAV token transfer
      const transferResult = await cavService.transferCAV(
        paymentRequest.recipientAddress,
        paymentAmount,
        walletAddress
      )

      // Track payment on contract for transparency
      await cavService.trackPayment(
        paymentRequest.recipientAddress,
        paymentAmount,
        paymentRequest.memo || 'CAV Payment',
        walletAddress
      )

      setPaymentStatus('success')
      onPaymentCompleted?.(transferResult.transactionHash)
    } catch (error: any) {
      setPaymentStatus('error')
      setErrorMessage(error.message || 'Payment failed')
      onPaymentFailed?.(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate QR code payment
  const generateQRPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setErrorMessage('Please enter a valid amount')
      return
    }

    setShowQRCode(true)
    onPaymentInitiated?.('qr', {
      address: paymentRequest.recipientAddress,
      amount: paymentAmount,
      memo: paymentRequest.memo,
      tokenAddress: paymentRequest.tokenAddress || DEFAULT_CAV_CONFIG.tokenAddress,
    })
  }

  // Handle payment method selection
  const selectPaymentMethod = async (method: 'web3' | 'qr') => {
    setSelectedMethod(method)
    setPaymentStatus('idle')
    setErrorMessage('')

    if (method === 'web3' && !isConnected) {
      try {
        await connectWallet()
      } catch (error: any) {
        setErrorMessage('Failed to connect wallet')
        setPaymentStatus('error')
      }
    }
  }

  // Execute selected payment method
  const executePayment = () => {
    if (selectedMethod === 'web3') {
      executeWeb3Payment()
    } else if (selectedMethod === 'qr') {
      generateQRPayment()
    }
  }

  if (compact) {
    return (
      <div
        className={`rounded-lg bg-gradient-to-r from-green-50 to-blue-50 p-2 sm:p-3 ${className}`}
      >
        <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <span className="text-sm font-medium text-gray-900">💰 Quick Pay</span>
          <div className="flex gap-1">
            <button
              onClick={() => selectPaymentMethod('web3')}
              className={`min-w-[32px] touch-manipulation rounded px-2 py-1 text-xs ${
                selectedMethod === 'web3'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
              }`}
            >
              🌐
            </button>
            <button
              onClick={() => selectPaymentMethod('qr')}
              className={`min-w-[32px] touch-manipulation rounded px-2 py-1 text-xs ${
                selectedMethod === 'qr'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
              }`}
            >
              📱
            </button>
          </div>
        </div>

        <div className="xs:flex-row flex flex-col gap-2">
          <input
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Amount..."
          />
          <button
            onClick={executePayment}
            disabled={!selectedMethod || !paymentAmount || isProcessing}
            className="min-h-[40px] touch-manipulation rounded bg-blue-600 px-3 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
          >
            {isProcessing ? '...' : 'Pay'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg bg-white p-4 shadow-md sm:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">💰 Pay with CAV</h3>
        {paymentRequest.recipientName && (
          <p className="text-sm text-gray-600 sm:text-base">
            To: <span className="font-medium break-words">{paymentRequest.recipientName}</span>
          </p>
        )}
      </div>

      {/* Payment Amount */}
      <div className="mb-4 sm:mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">Amount (CAV)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:ring-blue-500 sm:py-2 sm:text-sm"
          placeholder="Enter amount..."
        />
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-gray-700">
          Choose Payment Method
        </label>
        <div className="space-y-2">
          <button
            onClick={() => selectPaymentMethod('web3')}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              selectedMethod === 'web3'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">🌐 Web3 Wallet</div>
                <div className="text-sm text-gray-600">Pay directly with your connected wallet</div>
              </div>
              {selectedMethod === 'web3' && <div className="text-blue-600">✓</div>}
            </div>
          </button>

          <button
            onClick={() => selectPaymentMethod('qr')}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              selectedMethod === 'qr'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">📱 QR Code</div>
                <div className="text-sm text-gray-600">Generate QR code for wallet scanning</div>
              </div>
              {selectedMethod === 'qr' && <div className="text-blue-600">✓</div>}
            </div>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {paymentStatus === 'error' && errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="text-sm text-red-800">❌ {errorMessage}</div>
        </div>
      )}

      {/* Success Display */}
      {paymentStatus === 'success' && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="text-sm text-green-800">✅ Payment initiated successfully!</div>
        </div>
      )}

      {/* QR Code Display */}
      {selectedMethod === 'qr' && showQRCode && paymentAmount && (
        <div className="mb-6 space-y-4">
          <div className="text-center">
            <h4 className="mb-3 font-medium text-gray-900">Payment QR Code</h4>
            <CeloPaymentQRCode
              address={paymentRequest.recipientAddress}
              amount={paymentAmount}
              tokenAddress={paymentRequest.tokenAddress || DEFAULT_CAV_CONFIG.tokenAddress}
              memo={paymentRequest.memo || `Payment of ${paymentAmount} CAV`}
              size={200}
              showCopyButton={true}
              allowDownload={true}
              downloadFilename={`cav-payment-${paymentAmount}`}
            />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <h5 className="mb-2 font-medium text-blue-900">📱 How to pay:</h5>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Open your Celo-compatible wallet app</li>
              <li>• Scan this QR code with your wallet's camera</li>
              <li>• Review the payment details and confirm</li>
              <li>• Wait for transaction confirmation</li>
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {selectedMethod === 'web3' && (
          <button
            onClick={executePayment}
            disabled={!paymentAmount || isProcessing || !isConnected}
            className="min-h-[44px] flex-1 touch-manipulation rounded-md bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 active:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2"
          >
            {isProcessing ? 'Processing...' : `Pay ${paymentAmount || '0'} CAV`}
          </button>
        )}

        {selectedMethod === 'qr' && !showQRCode && (
          <button
            onClick={generateQRPayment}
            disabled={!paymentAmount}
            className="min-h-[44px] flex-1 touch-manipulation rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 sm:py-2"
          >
            Generate QR Code
          </button>
        )}

        {!isConnected && selectedMethod === 'web3' && (
          <button
            onClick={connectWallet}
            className="min-h-[44px] touch-manipulation rounded-md bg-purple-600 px-4 py-3 font-medium text-white hover:bg-purple-700 active:bg-purple-800 sm:py-2"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Simplified payment button for quick actions
 */
export function QuickCAVPayment({
  recipientAddress,
  recipientName,
  amount = '10',
  memo,
  onPayment,
  className = '',
}: {
  recipientAddress: string
  recipientName?: string
  amount?: string
  memo?: string
  onPayment?: (details: any) => void
  className?: string
}) {
  return (
    <UnifiedCAVPayment
      paymentRequest={{
        recipientAddress,
        recipientName,
        amount,
        memo,
      }}
      onPaymentInitiated={onPayment}
      compact={true}
      className={className}
    />
  )
}
