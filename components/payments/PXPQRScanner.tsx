'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCodeScanner, { QRScanResult, useQRScanner } from '@/components/qr/QRCodeScanner'
import {
  BaseQRData,
  VenueQRData,
  UserProfileQRData,
  isValidVenueQRData,
  isValidUserProfileQRData,
} from '@/types/qr-profile'

export interface PaymentQRData {
  address: string
  amount?: string
  tokenAddress?: string
  memo?: string
  chainId?: number
}

export interface PXPQRScannerProps {
  onPaymentDetected: (payment: PaymentQRData) => void
  onWalletAddressDetected?: (address: string) => void
  onVenueDetected?: (venueData: VenueQRData) => void
  onUserProfileDetected?: (userData: UserProfileQRData) => void
  onError?: (error: string) => void
  className?: string
  showInstructions?: boolean
  autoNavigate?: boolean // If true, automatically navigate to venue/user pages
}

export default function PXPQRScanner({
  onPaymentDetected,
  onWalletAddressDetected,
  onVenueDetected,
  onUserProfileDetected,
  onError,
  className = '',
  showInstructions = true,
  autoNavigate = false,
}: PXPQRScannerProps) {
  const [scanHistory, setScanHistory] = useState<QRScanResult[]>([])
  const [lastScanResult, setLastScanResult] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const { hasPermission, isSupported, requestPermission } = useQRScanner()

  // Parse Celo payment URI
  const parseCeloPaymentURI = (uri: string): PaymentQRData | null => {
    try {
      // Handle Celo payment URIs like: celo:pay?address=0x...&amount=100&token=0x...&memo=Payment
      if (uri.startsWith('celo:pay?')) {
        const url = new URL(uri)
        const params = url.searchParams

        return {
          address: params.get('address') || '',
          amount: params.get('amount') ?? undefined,
          tokenAddress: params.get('token') ?? undefined,
          memo: params.get('memo') ?? undefined,
          chainId: params.get('chainId') ? parseInt(params.get('chainId')!) : undefined,
        }
      }

      // Handle ethereum: URIs (EIP-681)
      if (uri.startsWith('ethereum:')) {
        const match = uri.match(/^ethereum:([^@?]+)(?:@(\d+))?(?:\?(.+))?$/)
        if (match) {
          const [, address, chainId, queryString] = match
          const params = new URLSearchParams(queryString || '')

          return {
            address,
            amount: params.get('value') || params.get('amount') || undefined,
            tokenAddress: params.get('token') ?? undefined,
            memo: params.get('memo') || params.get('data') || undefined,
            chainId: chainId ? parseInt(chainId) : undefined,
          }
        }
      }

      return null
    } catch (error) {
      console.warn('Error parsing payment URI:', error)
      return null
    }
  }

  // Check if string is a valid Ethereum address
  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // Handle QR scan result
  const handleScan = (result: QRScanResult) => {
    if (isProcessing) return

    setIsProcessing(true)
    setLastScanResult(result.data)
    setScanHistory((prev) => [result, ...prev.slice(0, 4)]) // Keep last 5 scans

    try {
      // Try to parse as JSON (new QR profile format)
      try {
        const jsonData = JSON.parse(result.data)

        // Check if it's a VenueQRData
        if (isValidVenueQRData(jsonData)) {
          console.log('Venue QR detected:', jsonData)
          onVenueDetected?.(jsonData)

          // Auto-navigate to venue page if enabled
          if (autoNavigate && jsonData.data.slug) {
            router.push(`/venues/${jsonData.data.slug}`)
          }

          // Check for embedded payment data
          if (jsonData.payment) {
            onPaymentDetected({
              address: jsonData.payment.address,
              amount: jsonData.payment.amount?.toString(),
              memo: `Venue: ${jsonData.data.name}`,
            })
          }

          setIsProcessing(false)
          return
        }

        // Check if it's a UserProfileQRData
        if (isValidUserProfileQRData(jsonData)) {
          console.log('User profile QR detected:', jsonData)
          onUserProfileDetected?.(jsonData)

          // Auto-navigate to user profile page if enabled
          if (autoNavigate && jsonData.data.walletAddress) {
            const profileSlug = jsonData.data.username || jsonData.data.walletAddress
            router.push(`/profile/${profileSlug}`)
          }

          // Check for embedded payment data
          if (jsonData.payment) {
            onPaymentDetected({
              address: jsonData.payment.address,
              amount: jsonData.payment.amount?.toString(),
              memo: `Tip for ${jsonData.data.username || 'user'}`,
            })
          }

          setIsProcessing(false)
          return
        }

        // Check for deep links in JSON
        if (jsonData.url) {
          console.log('Deep link detected:', jsonData.url)
          if (autoNavigate) {
            // Extract path from URL
            const url = new URL(jsonData.url)
            router.push(url.pathname)
          }
        }
      } catch (jsonError) {
        // Not JSON, continue with other parsing methods
      }

      // Try to parse as payment URI
      const paymentData = parseCeloPaymentURI(result.data)

      if (paymentData && paymentData.address) {
        console.log('Payment QR detected:', paymentData)
        onPaymentDetected(paymentData)
        setIsProcessing(false)
        return
      }

      // Handle deep link URIs (pianostyle://venue/{slug} or pianostyle://user/{address})
      if (result.data.startsWith('pianostyle://')) {
        const deepLinkMatch = result.data.match(/^pianostyle:\/\/(venue|user)\/(.+)$/)
        if (deepLinkMatch) {
          const [, type, identifier] = deepLinkMatch
          console.log('Deep link detected:', type, identifier)

          if (autoNavigate) {
            if (type === 'venue') {
              router.push(`/venues/${identifier}`)
            } else if (type === 'user') {
              router.push(`/profile/${identifier}`)
            }
          }

          setIsProcessing(false)
          return
        }
      }

      // Check if it's a plain wallet address
      if (isValidEthereumAddress(result.data)) {
        console.log('Wallet address detected:', result.data)
        onWalletAddressDetected?.(result.data)
        setIsProcessing(false)
        return
      }

      // Try to extract address from longer strings
      const addressMatch = result.data.match(/0x[a-fA-F0-9]{40}/)
      if (addressMatch) {
        console.log('Address extracted from QR:', addressMatch[0])
        onWalletAddressDetected?.(addressMatch[0])
        setIsProcessing(false)
        return
      }

      // Not a recognized format
      const errorMsg =
        'QR code does not contain a valid payment, wallet address, venue, or user profile'
      onError?.(errorMsg)
      console.warn('Unrecognized QR format:', result.data)
    } catch (error: any) {
      console.error('Error processing QR scan:', error)
      onError?.(error.message)
    }

    setTimeout(() => setIsProcessing(false), 1000) // Allow re-scanning after 1 second
  }

  const handleScanError = (error: string) => {
    console.error('QR scanner error:', error)
    onError?.(error)
  }

  const handlePermissionDenied = () => {
    const errorMsg = 'Camera permission is required to scan QR codes'
    onError?.(errorMsg)
  }

  // Request permission if not already granted
  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (!granted) {
      handlePermissionDenied()
    }
  }

  if (!isSupported) {
    return (
      <div className={`rounded-lg bg-gray-50 p-6 text-center ${className}`}>
        <div className="mb-4 text-gray-600">📷 Camera scanning is not supported on this device</div>
        <div className="text-sm text-gray-500">
          Please use a device with camera support or manually enter payment details
        </div>
      </div>
    )
  }

  if (hasPermission === false) {
    return (
      <div
        className={`rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center ${className}`}
      >
        <div className="mb-4 text-yellow-800">📷 Camera Permission Required</div>
        <div className="mb-4 text-sm text-yellow-700">
          Allow camera access to scan PXP payment QR codes
        </div>
        <button
          onClick={handleRequestPermission}
          className="rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
        >
          Grant Camera Permission
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      {showInstructions && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 font-medium text-blue-900">📱 QR Code Scanner</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Point your camera at any PianoStyle QR code</li>
            <li>• Supports venue profiles, user profiles, and payments</li>
            <li>• Scanner will automatically detect and process codes</li>
            <li>• Ensure good lighting for best results</li>
          </ul>
        </div>
      )}

      {/* QR Scanner */}
      <div className="flex justify-center">
        <QRCodeScanner
          onScan={handleScan}
          onError={handleScanError}
          onPermissionDenied={handlePermissionDenied}
          width={300}
          height={300}
          facingMode="environment"
          scanDelay={500}
          showViewfinder={true}
          showTorch={true}
        />
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="text-center text-sm text-blue-600">🔍 Processing QR code...</div>
      )}

      {/* Last scan result */}
      {lastScanResult && (
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="mb-1 text-sm font-medium text-gray-700">Last Scanned:</div>
          <div className="font-mono text-xs break-all text-gray-600">
            {lastScanResult.length > 100
              ? `${lastScanResult.substring(0, 100)}...`
              : lastScanResult}
          </div>
        </div>
      )}

      {/* Scan history */}
      {scanHistory.length > 0 && (
        <details className="rounded-lg bg-gray-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Scan History ({scanHistory.length})
          </summary>
          <div className="mt-2 space-y-2">
            {scanHistory.map((scan, index) => (
              <div key={index} className="text-xs text-gray-600">
                <div className="font-mono break-all">
                  {scan.data.length > 80 ? `${scan.data.substring(0, 80)}...` : scan.data}
                </div>
                <div className="text-gray-400">{new Date(scan.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Troubleshooting */}
      <details className="text-sm text-gray-600">
        <summary className="cursor-pointer hover:text-gray-800">
          Troubleshooting Scanner Issues
        </summary>
        <div className="mt-2 space-y-1 text-xs">
          <div>• Ensure adequate lighting</div>
          <div>• Hold device steady</div>
          <div>• Clean camera lens</div>
          <div>• Try different distances from QR code</div>
          <div>• Check camera permissions in browser settings</div>
        </div>
      </details>
    </div>
  )
}

/**
 * Modal wrapper for QR scanner
 */
export function PXPQRScannerModal({
  isOpen,
  onClose,
  onPaymentDetected,
  onWalletAddressDetected,
  onVenueDetected,
  onUserProfileDetected,
  title = 'Scan QR Code',
  autoNavigate = true,
}: {
  isOpen: boolean
  onClose: () => void
  onPaymentDetected: (payment: PaymentQRData) => void
  onWalletAddressDetected?: (address: string) => void
  onVenueDetected?: (venueData: VenueQRData) => void
  onUserProfileDetected?: (userData: UserProfileQRData) => void
  title?: string
  autoNavigate?: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-screen w-full max-w-md overflow-y-auto rounded-lg bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-4">
          <PXPQRScanner
            onPaymentDetected={(payment) => {
              onPaymentDetected(payment)
              onClose()
            }}
            onWalletAddressDetected={(address) => {
              onWalletAddressDetected?.(address)
              onClose()
            }}
            onVenueDetected={(venueData) => {
              onVenueDetected?.(venueData)
              onClose()
            }}
            onUserProfileDetected={(userData) => {
              onUserProfileDetected?.(userData)
              onClose()
            }}
            onError={(error) => {
              console.error('Scanner error:', error)
              // Keep modal open on error
            }}
            showInstructions={true}
            autoNavigate={autoNavigate}
          />
        </div>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
