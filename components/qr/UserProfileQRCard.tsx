'use client'

import React, { useState, useRef } from 'react'
import QRCodeGenerator from './QRCodeGenerator'
import {
  UserProfileQRData,
  QRCardLayout,
  QRCardTheme,
  QRCardConfig,
  QR_CARD_SIZES,
  DEFAULT_THEMES,
  generateDeepLink,
  UserBadge,
} from '@/types/qr-profile'

export interface UserProfileQRCardProps {
  userData: {
    walletAddress: string
    username?: string
    displayName?: string
    bio?: string
    title?: string
    location?: string
    skills?: string[]
    socialLinks?: any
    badges?: string[]
    totalPXPEarned: number
    venuesDiscovered?: number
    reviewCount?: number
    profileSlug?: string
  }
  config?: Partial<QRCardConfig>
  onExport?: (dataUrl: string) => void
  className?: string
}

const PROFILE_DESCRIPTION =
  'Connect with me on PianoStyle! Scan to view my profile, venues discovered, and piano journey.'

export default function UserProfileQRCard({
  userData,
  config: initialConfig,
  onExport,
  className = '',
}: UserProfileQRCardProps) {
  // Default configuration
  const defaultConfig: QRCardConfig = {
    layout: 'business-card',
    theme: DEFAULT_THEMES.professional,
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

  // Convert badge strings to UserBadge objects
  const convertBadges = (): UserBadge[] => {
    if (!userData.badges || userData.badges.length === 0) return []

    return userData.badges.map((badgeId) => {
      // Map badge IDs to badge data
      const badgeMap: Record<string, UserBadge> = {
        'first-venue': {
          id: 'first-venue',
          name: 'First Discovery',
          icon: '🎯',
          description: 'Discovered first venue',
          earnedAt: Date.now(),
        },
        'venue-scout': {
          id: 'venue-scout',
          name: 'Venue Scout',
          icon: '🔍',
          description: 'Submitted 5+ venues',
          earnedAt: Date.now(),
        },
        curator: {
          id: 'curator',
          name: 'Curator',
          icon: '✅',
          description: 'Authorized venue verifier',
          earnedAt: Date.now(),
        },
        'pxp-earner': {
          id: 'pxp-earner',
          name: 'PXP Earner',
          icon: '💎',
          description: 'Earned 100+ PXP',
          earnedAt: Date.now(),
        },
        'community-contributor': {
          id: 'community-contributor',
          name: 'Community Contributor',
          icon: '🌟',
          description: 'Active community member',
          earnedAt: Date.now(),
        },
        'piano-enthusiast': {
          id: 'piano-enthusiast',
          name: 'Piano Enthusiast',
          icon: '🎹',
          description: 'Visited 10+ piano venues',
          earnedAt: Date.now(),
        },
        reviewer: {
          id: 'reviewer',
          name: 'Reviewer',
          icon: '📝',
          description: 'Left 5+ venue reviews',
          earnedAt: Date.now(),
        },
      }

      return (
        badgeMap[badgeId] || {
          id: badgeId,
          name: badgeId,
          icon: '🏆',
          description: 'Special achievement',
          earnedAt: Date.now(),
        }
      )
    })
  }

  // Generate QR data
  const generateQRData = (): UserProfileQRData => {
    const profileIdentifier = userData.profileSlug || userData.walletAddress
    const baseUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/profile/${profileIdentifier}`
        : `https://pianostyle.app/profile/${profileIdentifier}`

    const qrData: UserProfileQRData = {
      type: 'user',
      version: '1.0',
      url: baseUrl,
      timestamp: Date.now(),
      data: {
        walletAddress: userData.walletAddress,
        username: userData.username,
        displayName: userData.displayName,
        bio: userData.bio,
        title: userData.title,
        location: userData.location,
        skills: userData.skills || [],
        socialLinks: userData.socialLinks,
        stats: {
          totalPXPEarned: userData.totalPXPEarned || 0,
          venuesDiscovered: userData.venuesDiscovered || 0,
          reviewCount: userData.reviewCount || 0,
        },
        badges: convertBadges(),
        profileDescription: config.includeDescription ? PROFILE_DESCRIPTION : undefined,
      },
    }

    if (config.includePayment && config.defaultPaymentAmount) {
      qrData.payment = {
        address: userData.walletAddress,
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
          <span>⚙️ Customize Profile QR Card</span>
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
                <span className="text-sm text-gray-700">Include profile description</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includePayment}
                  onChange={(e) => setConfig({ ...config, includePayment: e.target.checked })}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Enable PXP tips</span>
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
        <UserProfileQRCardContent userData={userData} qrData={qrData} config={config} />
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
          <li>• Download your profile QR code in your preferred format</li>
          <li>• Print at 300 DPI for best quality</li>
          <li>• Share at events, conferences, or on business cards</li>
          <li>• Others can scan to view your profile and send PXP tips</li>
        </ul>
      </div>
    </div>
  )
}

// Separate component for card content (easier to style for print)
function UserProfileQRCardContent({
  userData,
  qrData,
  config,
}: {
  userData: UserProfileQRCardProps['userData']
  qrData: UserProfileQRData
  config: QRCardConfig
}) {
  const { theme } = config
  const isSmall = config.layout === 'business-card' || config.layout === 'sticker'
  const isBadge = config.layout === 'badge'

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
          {userData.displayName || userData.username || 'PianoStyle User'}
        </h2>
        {userData.title && (
          <p className="text-sm font-medium" style={{ color: theme.secondaryColor }}>
            {userData.title}
          </p>
        )}
        {userData.location && <p className="mt-1 text-xs">📍 {userData.location}</p>}
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

      {/* Stats */}
      {!isSmall && (
        <div className="mt-4 flex justify-center gap-4 text-center text-xs">
          <div>
            <div className="font-bold" style={{ color: theme.primaryColor }}>
              {userData.totalPXPEarned.toLocaleString()}
            </div>
            <div className="text-xs opacity-70">PXP Earned</div>
          </div>
          {userData.venuesDiscovered !== undefined && userData.venuesDiscovered > 0 && (
            <div>
              <div className="font-bold" style={{ color: theme.primaryColor }}>
                {userData.venuesDiscovered}
              </div>
              <div className="text-xs opacity-70">Venues</div>
            </div>
          )}
        </div>
      )}

      {/* Badges */}
      {!isSmall && qrData.data.badges && qrData.data.badges.length > 0 && (
        <div className="mt-3 flex justify-center gap-1">
          {qrData.data.badges.slice(0, isBadge ? 3 : 5).map((badge) => (
            <span key={badge.id} className="text-lg" title={badge.name}>
              {badge.icon}
            </span>
          ))}
        </div>
      )}

      {/* Skills */}
      {!isSmall && userData.skills && userData.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1">
          {userData.skills.slice(0, isBadge ? 3 : 4).map((skill) => (
            <span
              key={skill}
              className="rounded-full px-2 py-1 text-xs"
              style={{
                backgroundColor: `${theme.primaryColor}20`,
                color: theme.primaryColor,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Bio */}
      {config.includeDescription && !isSmall && userData.bio && (
        <div className="mt-4 text-center text-xs leading-relaxed opacity-80">
          {userData.bio.length > 120 ? `${userData.bio.substring(0, 120)}...` : userData.bio}
        </div>
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
          💎 Scan to send {qrData.payment.amount} PXP tip
        </div>
      )}

      {/* Footer/Branding */}
      {theme.showBranding && (
        <div className="mt-4 border-t pt-2 text-center text-xs opacity-70">
          PianoStyle.app - Piano Community
        </div>
      )}
    </div>
  )
}
