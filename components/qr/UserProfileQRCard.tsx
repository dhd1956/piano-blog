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
  'Connect with me! Scan to view my profile, venues discovered, and piano journey.'

export default function UserProfileQRCard({
  userData,
  config: initialConfig,
  onExport,
  className = '',
}: UserProfileQRCardProps) {
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

  // Convert badge strings to UserBadge array
  const convertBadges = (): any[] => {
    if (!userData.badges || userData.badges.length === 0) return []

    return userData.badges.map((badgeId) => {
      // Map badge IDs to badge data
      const badgeMap: Record<string, any> = {
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
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const profileIdentifier = userData.profileSlug || userData.walletAddress
    const baseUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/profile/${profileIdentifier}`
        : `${APP_URL}/profile/${profileIdentifier}`

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
          verificationsCompleted: userData.reviewCount || 0,
        },
        badges: convertBadges(),
        profileDescription: config.includeDescription ? PROFILE_DESCRIPTION : undefined,
        publicProfile: true,
      } as any,
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

  // Convert rgb(a) to hex (used in onclone callback)
  const rgbToHex = (color: string): string => {
    // Already hex
    if (color.startsWith('#')) return color

    // Parse oklch - fallback to black
    if (color.includes('oklch')) {
      console.warn('oklch color detected, using fallback', color)
      return '#000000'
    }

    // Parse rgb/rgba
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
    if (match) {
      const r = parseInt(match[1])
      const g = parseInt(match[2])
      const b = parseInt(match[3])
      return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
    }

    return color // Return as-is if can't parse
  }

  // Convert to print-friendly data URL
  const handleExport = async (format: 'png' | 'pdf') => {
    if (!cardRef.current) {
      console.error('Card reference not available')
      alert('QR card not ready. Please try again.')
      return
    }

    try {
      console.log('Starting profile QR code export...')

      // Dynamically import html2canvas to reduce bundle size
      const html2canvas = (await import('html2canvas')).default
      console.log('html2canvas loaded successfully')

      // Ensure backgroundColor is hex
      const bgColor = config.theme.backgroundColor.startsWith('#')
        ? config.theme.backgroundColor
        : '#ffffff'

      // Capture the card as a canvas at high resolution
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // 3x resolution for better quality
        backgroundColor: bgColor,
        logging: true, // Enable logging to debug
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        // Use onclone to convert oklch colors in the cloned DOM before rendering
        onclone: (clonedDoc, clonedElement) => {
          console.log('=== ONCLONE CALLBACK START ===')

          // NUCLEAR OPTION: Remove all external stylesheets from cloned document
          // This prevents html2canvas from reading oklch values from CSS files
          const styleSheets = clonedDoc.querySelectorAll('link[rel="stylesheet"], style')
          console.log(`Removing ${styleSheets.length} stylesheets from cloned document`)
          styleSheets.forEach((sheet) => sheet.remove())

          // Get all elements in the cloned DOM
          const allElements = [
            clonedElement,
            ...Array.from(clonedElement.querySelectorAll('*')),
          ] as HTMLElement[]

          console.log(`Processing ${allElements.length} elements...`)

          // Apply inline styles based on current computed styles (before removing sheets)
          // We need to capture these from the ORIGINAL document, not cloned
          const originalElement = cardRef.current
          if (originalElement) {
            const allOriginalElements = [
              originalElement,
              ...Array.from(originalElement.querySelectorAll('*')),
            ] as HTMLElement[]

            allOriginalElements.forEach((originalEl, index) => {
              const clonedEl = allElements[index]
              if (!clonedEl) return

              const computed = window.getComputedStyle(originalEl)

              // Copy critical styles as inline styles
              const criticalProps = [
                'color',
                'backgroundColor',
                'borderColor',
                'borderTopColor',
                'borderRightColor',
                'borderBottomColor',
                'borderLeftColor',
                'fontSize',
                'fontWeight',
                'fontFamily',
                'padding',
                'margin',
                'width',
                'height',
                'display',
                'textAlign',
              ]

              criticalProps.forEach((prop) => {
                let value = computed.getPropertyValue(prop)
                if (!value || value === '' || value === 'none') return

                // Convert oklch to white/black, rgb to hex
                if (value.includes('oklch')) {
                  value = prop.includes('background') ? '#ffffff' : '#000000'
                  console.warn(`Converting oklch in ${prop} to ${value}`)
                } else if (value.includes('rgb')) {
                  value = rgbToHex(value)
                }

                clonedEl.style.setProperty(prop, value, 'important')
              })
            })
          }

          console.log('=== ONCLONE CALLBACK END ===')
        },
      })

      console.log('Canvas created:', canvas.width, 'x', canvas.height)

      const username = userData.username || userData.walletAddress.slice(0, 8)

      if (format === 'pdf') {
        // Generate actual PDF using jsPDF
        const { jsPDF } = await import('jspdf')
        console.log('jsPDF loaded successfully')

        // Get dimensions based on layout
        const dimensions = QR_CARD_SIZES[config.layout]

        // Create PDF with proper dimensions (jsPDF uses mm by default)
        // Convert inches to mm (1 inch = 25.4mm)
        const widthMm = dimensions.width * 25.4
        const heightMm = dimensions.height * 25.4

        const pdf = new jsPDF({
          orientation: widthMm > heightMm ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [widthMm, heightMm],
        })

        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png', 1.0)

        // Add image to PDF (fill the entire page)
        pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm)

        // Save the PDF
        pdf.save(`${username}-profile-qr-${config.layout}.pdf`)
        console.log('PDF download triggered successfully')

        // Call optional callback
        onExport?.(imgData)
      } else {
        // PNG export - use blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.error('Failed to create blob from canvas')
              alert('Failed to create image. Please try again.')
              return
            }

            console.log('Blob created successfully, size:', blob.size, 'bytes')

            // Create download link
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.download = `${username}-profile-qr-${config.layout}.png`
            link.href = url
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            console.log('PNG download triggered successfully')

            // Call optional callback
            onExport?.(url)
          },
          'image/png',
          0.95
        )
      }
    } catch (error) {
      console.error('Failed to export QR code:', error)
      if (error instanceof Error) {
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        alert(
          `Failed to download QR code: ${error.message}\n\nPlease check the browser console for more details.`
        )
      } else {
        alert('Failed to download QR code. Please check the browser console for details.')
      }
    }
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
          {userData.displayName || userData.username || 'GlobalPiano User'}
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
          data={qrData.url}
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
          {qrData.data.badges.slice(0, isBadge ? 3 : 5).map((badge: any) => (
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
          GlobalPiano.Network - Piano Community
        </div>
      )}
    </div>
  )
}
