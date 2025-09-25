'use client'

import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export interface QRCodeGeneratorProps {
  /** The data to encode in the QR code */
  data: string
  /** Size of the QR code in pixels (default: 200) */
  size?: number
  /** Error correction level (default: 'M') */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  /** Foreground color (default: '#000000') */
  color?: string
  /** Background color (default: '#FFFFFF') */
  backgroundColor?: string
  /** CSS class name for styling */
  className?: string
  /** Alt text for accessibility */
  alt?: string
  /** Whether to show a copy button */
  showCopyButton?: boolean
  /** Whether to allow download as PNG */
  allowDownload?: boolean
  /** Download filename (without extension) */
  downloadFilename?: string
  /** Callback when QR code is copied */
  onCopy?: () => void
  /** Callback when QR code is downloaded */
  onDownload?: () => void
}

export interface CeloPaymentURIProps {
  /** Recipient wallet address */
  address: string
  /** Amount in CAV tokens (will be converted to wei) */
  amount?: string | number
  /** CAV token contract address */
  tokenAddress?: string
  /** Optional memo/description */
  memo?: string
  /** Chain ID (default: 44787 for Celo Alfajores) */
  chainId?: number
}

/**
 * Generates Celo payment URI following EIP-681 standard
 * Format: celo:pay?address={address}&amount={amount}&token={tokenAddress}&memo={memo}
 */
export function generateCeloPaymentURI({
  address,
  amount,
  tokenAddress,
  memo,
  chainId = 44787
}: CeloPaymentURIProps): string {
  const params = new URLSearchParams()
  
  params.set('address', address)
  
  if (amount) {
    // Convert amount to wei (18 decimals)
    const amountInWei = (parseFloat(amount.toString()) * 1e18).toString()
    params.set('amount', amountInWei)
  }
  
  if (tokenAddress) {
    params.set('token', tokenAddress)
  }
  
  if (memo) {
    params.set('memo', encodeURIComponent(memo))
  }
  
  params.set('chainId', chainId.toString())
  
  return `celo:pay?${params.toString()}`
}

/**
 * Reusable QR Code Generator Component
 * Supports both generic data and Celo payment URIs
 */
export default function QRCodeGenerator({
  data,
  size = 200,
  errorCorrectionLevel = 'M',
  color = '#000000',
  backgroundColor = '#FFFFFF',
  className = '',
  alt = 'QR Code',
  showCopyButton = true,
  allowDownload = false,
  downloadFilename = 'qrcode',
  onCopy,
  onDownload
}: QRCodeGeneratorProps) {
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)

  // Generate QR code whenever data changes
  useEffect(() => {
    generateQRCode()
  }, [data, size, errorCorrectionLevel, color, backgroundColor])

  const generateQRCode = async () => {
    if (!data) {
      setError('No data provided')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const dataURL = await QRCode.toDataURL(data, {
        width: size,
        margin: 2,
        color: {
          dark: color,
          light: backgroundColor
        },
        errorCorrectionLevel
      })

      setQRCodeDataURL(dataURL)
    } catch (err) {
      console.error('QR Code generation failed:', err)
      setError('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data)
      setCopied(true)
      onCopy?.()
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleDownload = () => {
    if (!qrCodeDataURL) return

    const link = document.createElement('a')
    link.download = `${downloadFilename}.png`
    link.href = qrCodeDataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    onDownload?.()
  }

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center p-4">
          <div className="text-red-600 text-sm font-medium">❌ Error</div>
          <div className="text-red-500 text-xs mt-1">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* QR Code Image */}
      <div className={`inline-block rounded-lg overflow-hidden shadow-md ${className}`}>
        <img
          src={qrCodeDataURL}
          alt={alt}
          width={size}
          height={size}
          className="block max-w-full h-auto"
          style={{ 
            imageRendering: 'pixelated',
            maxWidth: 'min(100%, 90vw)', // Ensure it fits on small screens
            maxHeight: '70vh'
          }}
        />
      </div>

      {/* Action Buttons */}
      {(showCopyButton || allowDownload) && (
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className={`px-3 py-2 text-sm rounded-md transition-colors touch-manipulation ${
                copied 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:bg-gray-300'
              }`}
            >
              {copied ? '✅ Copied!' : '📋 Copy Data'}
            </button>
          )}
          
          {allowDownload && (
            <button
              onClick={handleDownload}
              className="px-3 py-2 text-sm rounded-md bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 active:bg-blue-300 transition-colors touch-manipulation"
            >
              💾 Download PNG
            </button>
          )}
        </div>
      )}

      {/* Data Preview (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono break-all">
          {data.slice(0, 100)}
          {data.length > 100 && '...'}
        </div>
      )}
    </div>
  )
}

/**
 * Specialized component for Celo payment QR codes
 */
export function CeloPaymentQRCode({
  address,
  amount,
  tokenAddress,
  memo,
  chainId,
  size = 200,
  className = '',
  showDetails = true,
  ...props
}: CeloPaymentURIProps & Omit<QRCodeGeneratorProps, 'data'> & {
  showDetails?: boolean
}) {
  const paymentURI = generateCeloPaymentURI({
    address,
    amount,
    tokenAddress,
    memo,
    chainId
  })

  return (
    <div className="space-y-3">
      <QRCodeGenerator
        data={paymentURI}
        size={size}
        className={className}
        alt={`Payment QR code for ${amount ? `${amount} CAV to ` : ''}${address.slice(0, 8)}...`}
        downloadFilename={`celo-payment-${address.slice(0, 8)}`}
        {...props}
      />
      
      {showDetails && (
        <div className="text-center space-y-1 px-2">
          {amount && (
            <div className="text-sm sm:text-base font-medium text-gray-900">
              💰 {amount} CAV
            </div>
          )}
          <div className="text-xs sm:text-sm text-gray-600 font-mono break-all">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          {memo && (
            <div className="text-xs sm:text-sm text-gray-500 italic break-words">
              "{memo}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}