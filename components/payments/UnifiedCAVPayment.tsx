'use client'

import React, { useState, useEffect } from 'react'
import { CeloPaymentQRCode } from '@/components/qr/QRCodeGenerator'
import { CAVQRScannerModal, PaymentQRData } from '@/components/payments/CAVQRScanner'
import { useHybridWallet } from '@/hooks/useHybridWallet'
import { useWallet } from '@/hooks/useWallet'

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
  showMethods?: Array<'web3' | 'qr' | 'qr_scan'>
}

// Default CAV token configuration
const DEFAULT_CAV_CONFIG = {
  tokenAddress: '0xe787A01BafC3276D0B3fEB93159F60dbB99b889F',
  chainId: 44787, // Celo Alfajores
  decimals: 18
}

export default function UnifiedCAVPayment({
  paymentRequest,
  onPaymentInitiated,
  onPaymentCompleted,
  onPaymentFailed,
  className = '',
  compact = false,
  showMethods = ['web3', 'qr', 'qr_scan']
}: UnifiedCAVPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<'web3' | 'qr' | 'qr_scan' | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(paymentRequest.amount || '')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    shouldShowWeb3Features,
    shouldShowQRFeatures,
    canScanQR,
    getSmartPaymentSuggestion,
    onboardingMessage,
    upgradeToWeb3
  } = useHybridWallet()

  const { isConnected, walletAddress, connect } = useWallet()

  // Auto-select best payment method
  useEffect(() => {
    if (!selectedMethod) {
      const suggestions = getSmartPaymentSuggestion(paymentAmount)
      const availableSuggestion = suggestions.find(s => showMethods.includes(s.method as any))
      
      if (availableSuggestion) {
        setSelectedMethod(availableSuggestion.method as any)
      }
    }
  }, [selectedMethod, getSmartPaymentSuggestion, paymentAmount, showMethods])

  // Payment method configurations
  const paymentMethods = [
    {
      id: 'web3' as const,
      title: '🌐 Web3 Wallet',
      description: 'Pay directly with your connected wallet',
      available: shouldShowWeb3Features() && showMethods.includes('web3'),
      requiresConnection: true
    },
    {
      id: 'qr' as const,
      title: '📱 QR Code',
      description: 'Generate QR code for wallet scanning',
      available: shouldShowQRFeatures() && showMethods.includes('qr'),
      requiresConnection: false
    },
    {
      id: 'qr_scan' as const,
      title: '📷 Scan QR',
      description: 'Scan payment QR code with camera',
      available: canScanQR && showMethods.includes('qr_scan'),
      requiresConnection: false
    }
  ].filter(method => method.available)

  // Execute Web3 payment
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
      // Mock Web3 transaction - in production this would use actual Web3 calls
      onPaymentInitiated?.('web3', {
        from: walletAddress,
        to: paymentRequest.recipientAddress,
        amount: paymentAmount,
        token: paymentRequest.tokenAddress || DEFAULT_CAV_CONFIG.tokenAddress
      })

      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      
      setPaymentStatus('success')
      onPaymentCompleted?.(mockTxHash)
      
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
      tokenAddress: paymentRequest.tokenAddress || DEFAULT_CAV_CONFIG.tokenAddress
    })
  }

  // Handle payment method selection
  const selectPaymentMethod = async (method: 'web3' | 'qr' | 'qr_scan') => {
    setSelectedMethod(method)
    setPaymentStatus('idle')
    setErrorMessage('')

    if (method === 'web3' && !isConnected) {
      try {
        await connect()
      } catch (error: any) {
        setErrorMessage('Failed to connect wallet')
        setPaymentStatus('error')
      }
    }
  }

  // Handle QR scan results
  const handleQRScan = (paymentData: PaymentQRData) => {
    console.log('QR payment detected:', paymentData)
    
    // Auto-fill payment form with scanned data
    if (paymentData.amount) {
      setPaymentAmount(paymentData.amount)
    }
    
    // Process payment automatically or show confirmation
    if (paymentData.address && paymentData.amount) {
      onPaymentInitiated?.('qr', {
        scannedFrom: paymentRequest.recipientAddress,
        scannedTo: paymentData.address,
        amount: paymentData.amount,
        memo: paymentData.memo
      })
      setPaymentStatus('success')
    } else {
      setErrorMessage('Incomplete payment information in QR code')
      setPaymentStatus('error')
    }
  }

  const handleWalletAddressScan = (address: string) => {
    console.log('Wallet address scanned:', address)
    // Could update recipient address or show options
    alert(`Wallet address scanned: ${address.substring(0, 10)}...\nFeature to send to this address coming soon!`)
  }

  // Execute selected payment method
  const executePayment = () => {
    switch (selectedMethod) {
      case 'web3':
        executeWeb3Payment()
        break
      case 'qr':
        generateQRPayment()
        break
      case 'qr_scan':
        setShowQRScanner(true)
        break
    }
  }

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <span className="text-sm font-medium text-gray-900">💰 Quick Pay</span>
          <div className="flex gap-1 flex-wrap">
            {paymentMethods.slice(0, 2).map((method) => (
              <button
                key={method.id}
                onClick={() => selectPaymentMethod(method.id)}
                className={`text-xs px-2 py-1 rounded touch-manipulation ${
                  selectedMethod === method.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
                }`}
              >
                {method.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Amount..."
          />
          <button
            onClick={executePayment}
            disabled={!selectedMethod || !paymentAmount || isProcessing}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 touch-manipulation min-h-[44px]"
          >
            {isProcessing ? '...' : 'Pay'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          💰 Pay with CAV
        </h3>
        {paymentRequest.recipientName && (
          <p className="text-gray-600 text-sm sm:text-base">
            To: <span className="font-medium break-words">{paymentRequest.recipientName}</span>
          </p>
        )}
        <div className="text-sm text-gray-500 mt-2">
          {onboardingMessage}
        </div>
      </div>

      {/* Payment Amount */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount (CAV)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
          placeholder="Enter amount..."
        />
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Payment Method
        </label>
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => selectPaymentMethod(method.id)}
              disabled={method.requiresConnection && !isConnected && method.id !== 'web3'}
              className={`w-full p-3 border rounded-lg text-left transition-colors ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{method.title}</div>
                  <div className="text-sm text-gray-600">{method.description}</div>
                </div>
                {selectedMethod === method.id && (
                  <div className="text-blue-600">✓</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {paymentStatus === 'error' && errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm">❌ {errorMessage}</div>
        </div>
      )}

      {/* Success Display */}
      {paymentStatus === 'success' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-800 text-sm">✅ Payment initiated successfully!</div>
        </div>
      )}

      {/* QR Code Display */}
      {selectedMethod === 'qr' && showQRCode && paymentAmount && (
        <div className="mb-6 space-y-4">
          <div className="text-center">
            <h4 className="font-medium text-gray-900 mb-3">Payment QR Code</h4>
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
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="font-medium text-blue-900 mb-2">📱 How to pay:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Open your Celo-compatible wallet app</li>
              <li>• Scan this QR code with your wallet's camera</li>
              <li>• Review the payment details and confirm</li>
              <li>• Wait for transaction confirmation</li>
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {selectedMethod === 'web3' && (
          <button
            onClick={executePayment}
            disabled={!paymentAmount || isProcessing || !isConnected}
            className="flex-1 px-4 py-3 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation font-medium min-h-[44px]"
          >
            {isProcessing ? 'Processing...' : `Pay ${paymentAmount || '0'} CAV`}
          </button>
        )}
        
        {selectedMethod === 'qr' && !showQRCode && (
          <button
            onClick={generateQRPayment}
            disabled={!paymentAmount}
            className="flex-1 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 touch-manipulation font-medium min-h-[44px]"
          >
            Generate QR Code
          </button>
        )}

        {selectedMethod === 'qr_scan' && (
          <button
            onClick={() => setShowQRScanner(true)}
            className="flex-1 px-4 py-3 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 touch-manipulation font-medium min-h-[44px]"
          >
            📷 Open QR Scanner
          </button>
        )}

        {!shouldShowWeb3Features() && (
          <button
            onClick={upgradeToWeb3}
            className="px-4 py-3 sm:py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 active:bg-purple-800 touch-manipulation font-medium min-h-[44px]"
          >
            Get Web3 Wallet
          </button>
        )}
      </div>

      {/* QR Scanner Modal */}
      <CAVQRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onPaymentDetected={handleQRScan}
        onWalletAddressDetected={handleWalletAddressScan}
        title="Scan CAV Payment QR Code"
      />
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
  className = ''
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
        memo
      }}
      onPaymentInitiated={onPayment}
      compact={true}
      className={className}
      showMethods={['web3', 'qr']}
    />
  )
}