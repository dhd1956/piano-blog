'use client'

import React, { useState, useRef } from 'react'
import QRCodeGenerator from './QRCodeGenerator'
import {
  VenueQRData,
  QRCardLayout,
  QRCardTheme,
  QRCardConfig,
  QR_CARD_SIZES,
  DEFAULT_THEMES,
  generateDeepLink,
} from '@/types/qr-profile'

export interface VenueQRCardProps {
  venueData: {
    id: number
    slug: string
    name: string
    city: string
    address?: string
    description?: string
    hasPiano: boolean
    pianoType?: string
    phone?: string
    website?: string
    socialLinks?: any
    submittedBy: string
  }
  config?: Partial<QRCardConfig>
  onExport?: (dataUrl: string) => void
  className?: string
}

const APP_DESCRIPTION =
  'Discover piano-friendly venues and connect with the piano community. Scan to explore, share experiences, and earn PXP tokens!'

export default function VenueQRCard({
  venueData,
  config: initialConfig,
  onExport,
  className = '',
}: VenueQRCardProps) {
  // Default configuration
  const defaultConfig: QRCardConfig = {
    layout: 'business-card',
    theme: DEFAULT_THEMES.piano,
    includeDescription: true,
    includePayment: false,
    qrCodeSize: 150,
    errorCorrectionLevel: 'H',
    printMarks: {
      showBleed: false,
      showCropMarks: false,
      showColorBars: false,
    },
  }

  const [config, setConfig] = useState<QRCardConfig>({
    ...defaultConfig,
    ...initialConfig,
  })

  const [showCustomization, setShowCustomization] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Generate QR data
  const generateQRData = (): VenueQRData => {
    const baseUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/venues/${venueData.slug}`
        : `https://pianostyle.app/venues/${venueData.slug}`

    const qrData: VenueQRData = {
      type: 'venue',
      version: '1.0',
      url: baseUrl,
      timestamp: Date.now(),
      data: {
        venueId: venueData.id,
        slug: venueData.slug,
        name: venueData.name,
        city: venueData.city,
        address: venueData.address,
        description: venueData.description,
        appDescription: config.includeDescription ? APP_DESCRIPTION : undefined,
        pianoInfo: {
          hasPiano: venueData.hasPiano,
          pianoType: venueData.pianoType,
        },
        contactInfo: venueData.phone,
        website: venueData.website,
        socialLinks: venueData.socialLinks,
      },
    }

    if (config.includePayment && config.defaultPaymentAmount) {
      qrData.payment = {
        address: venueData.submittedBy,
        amount: config.defaultPaymentAmount,
        token: 'PXP',
      }
    }

    return qrData
  }

  const qrData = generateQRData()
  const deepLink = generateDeepLink(qrData)
  const dimensions = QR_CARD_SIZES[config.layout]

  // Convert to print-friendly data URL
  const handleExport = async (format: 'png' | 'pdf') => {
    if (!cardRef.current) return

    // For now, we'll use html2canvas or similar library in production
    // This is a placeholder for the export functionality
    console.log('Exporting as', format)
    onExport?.(deepLink)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Customization Panel */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <button
          onClick={() => setShowCustomization(!showCustomization)}
          className="flex w-full items-center justify-between text-left font-medium text-gray-900"
        >
          <span>⚙️ Customize QR Card</span>
          <span className="text-gray-500">{showCustomization ? '▲' : '▼'}</span>
        </button>

        {showCustomization && (
          <div className="mt-4 space-y-4">
            {/* Layout Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Layout Size</label>
              <select
                value={config.layout}
                onChange={(e) => setConfig({ ...config, layout: e.target.value as QRCardLayout })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="business-card">Business Card (3.5" × 2")</option>
                <option value="postcard">Postcard (4" × 6")</option>
                <option value="poster">Poster (8.5" × 11")</option>
                <option value="sticker">Sticker (3" × 3")</option>
                <option value="table-tent">Table Tent (4" × 6")</option>
                <option value="badge">Badge (3" × 4")</option>
              </select>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Color Theme</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(DEFAULT_THEMES).map(([name, theme]) => (
                  <button
                    key={name}
                    onClick={() => setConfig({ ...config, theme })}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      config.theme === theme
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      backgroundColor: theme.backgroundColor,
                      color: theme.textColor,
                    }}
                  >
                    <div
                      className="mb-1 h-2 w-full rounded"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <div className="text-xs font-medium capitalize">{name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeDescription}
                  onChange={(e) => setConfig({ ...config, includeDescription: e.target.checked })}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Include app description</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includePayment}
                  onChange={(e) => setConfig({ ...config, includePayment: e.target.checked })}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Enable PXP payments</span>
              </label>

              {config.includePayment && (
                <div className="ml-6">
                  <label className="block text-sm text-gray-600">Default tip amount (PXP)</label>
                  <input
                    type="number"
                    min="1"
                    value={config.defaultPaymentAmount || 10}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultPaymentAmount: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Card Preview */}
      <div
        ref={cardRef}
        className="mx-auto overflow-hidden rounded-lg border-2 border-gray-300 bg-white shadow-lg"
        style={{
          width: `${dimensions.width * 96}px`, // 96 DPI for screen preview
          backgroundColor: config.theme.backgroundColor,
        }}
      >
        <VenueQRCardContent venueData={venueData} qrData={qrData} config={config} />
      </div>

      {/* Export Buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          onClick={() => handleExport('png')}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 sm:flex-initial sm:px-6"
        >
          💾 Download PNG
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="flex-1 rounded-md border border-blue-600 bg-white px-4 py-2 font-medium text-blue-600 hover:bg-blue-50 sm:flex-initial sm:px-6"
        >
          📄 Download PDF
        </button>
      </div>

      {/* Usage Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
        <h4 className="mb-2 font-medium text-blue-900">📋 How to Use</h4>
        <ul className="space-y-1 text-blue-800">
          <li>• Download the QR code in your preferred format</li>
          <li>• Print at 300 DPI for best quality</li>
          <li>• Display at your venue entrance or near the piano</li>
          <li>• Visitors can scan to learn about your venue and leave tips</li>
        </ul>
      </div>
    </div>
  )
}

// Separate component for card content (easier to style for print)
function VenueQRCardContent({
  venueData,
  qrData,
  config,
}: {
  venueData: VenueQRCardProps['venueData']
  qrData: VenueQRData
  config: QRCardConfig
}) {
  const { theme } = config
  const isSmall = config.layout === 'business-card' || config.layout === 'sticker'

  return (
    <div
      className="p-6"
      style={{
        color: theme.textColor,
        fontFamily: theme.fontFamily || 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold" style={{ color: theme.primaryColor }}>
          {venueData.name}
        </h2>
        <p className="text-sm" style={{ color: theme.secondaryColor }}>
          📍 {venueData.city}
        </p>
        {venueData.hasPiano && (
          <p className="mt-1 text-sm font-medium">🎹 {venueData.pianoType || 'Piano'} Available</p>
        )}
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <QRCodeGenerator
          data={JSON.stringify(qrData)}
          size={config.qrCodeSize || 150}
          errorCorrectionLevel={config.errorCorrectionLevel}
          color={theme.qrForegroundColor || '#000000'}
          backgroundColor={theme.qrBackgroundColor || '#FFFFFF'}
          showCopyButton={false}
          allowDownload={false}
        />
      </div>

      {/* Description */}
      {config.includeDescription && !isSmall && (
        <div className="mt-4 text-center text-xs leading-relaxed">{qrData.data.appDescription}</div>
      )}

      {/* Venue Details */}
      {!isSmall && venueData.address && (
        <div className="mt-3 text-center text-xs">{venueData.address}</div>
      )}

      {/* Payment Info */}
      {config.includePayment && qrData.payment && (
        <div
          className="mt-4 rounded-md p-2 text-center text-xs font-medium"
          style={{
            backgroundColor: `${theme.primaryColor}20`,
            color: theme.primaryColor,
          }}
        >
          💎 Scan to leave a {qrData.payment.amount} PXP tip
        </div>
      )}

      {/* Footer/Branding */}
      {theme.showBranding && (
        <div className="mt-4 border-t pt-2 text-center text-xs opacity-70">
          PianoStyle.app - Discover Piano Venues
        </div>
      )}
    </div>
  )
}
