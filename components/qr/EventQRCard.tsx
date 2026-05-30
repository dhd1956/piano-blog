'use client'

import React, { useState, useRef } from 'react'
import QRCode from 'qrcode'
import QRCodeGenerator from './QRCodeGenerator'
import {
  EventQRData,
  QRCardLayout,
  QRCardConfig,
  QR_CARD_SIZES,
  DEFAULT_THEMES,
} from '@/types/qr-profile'

const EVENT_TYPE_LABELS: Record<string, string> = {
  JAM_SESSION: '🎸 Jam Session',
  GIG: '🎤 Gig',
  CONCERT: '🎵 Concert',
  RECITAL: '🎹 Recital',
  OPEN_MIC: '🎙️ Open Mic',
  WORKSHOP: '📚 Workshop',
  MASTERCLASS: '🎓 Masterclass',
  REHEARSAL: '🎼 Rehearsal',
  MEETUP: '👥 Meetup',
  OTHER: '📌 Event',
}

const APP_DESCRIPTION =
  'Discover piano events, venues, and musicians on Global Piano Network. Scan to learn more and RSVP!'

export interface EventQRCardProps {
  eventData: {
    id: number
    title: string
    eventType: string
    startDate: string
    endDate: string
    venueName: string
    venueCity: string
    organizerName?: string
    isFree: boolean
    price?: number | null
    description?: string
  }
  config?: Partial<QRCardConfig>
  onExport?: (dataUrl: string) => void
  className?: string
}

export default function EventQRCard({
  eventData,
  config: initialConfig,
  onExport,
  className = '',
}: EventQRCardProps) {
  const defaultConfig: QRCardConfig = {
    layout: 'business-card',
    theme: DEFAULT_THEMES.elegant,
    includeDescription: true,
    includePayment: false,
    qrCodeSize: 150,
    errorCorrectionLevel: 'H',
    printMarks: { showBleed: false, showCropMarks: false, showColorBars: false },
  }

  const [config, setConfig] = useState<QRCardConfig>({ ...defaultConfig, ...initialConfig })
  const [showCustomization, setShowCustomization] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const generateQRData = (): EventQRData => {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/preview/event/${eventData.id}`
        : `${APP_URL}/preview/event/${eventData.id}`

    return {
      type: 'event',
      version: '1.0',
      url,
      timestamp: Date.now(),
      data: {
        eventId: eventData.id,
        title: eventData.title,
        eventType: eventData.eventType,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        venueName: eventData.venueName,
        venueCity: eventData.venueCity,
        organizerName: eventData.organizerName,
        isFree: eventData.isFree,
        price: eventData.price,
        description: eventData.description,
        appDescription: config.includeDescription ? APP_DESCRIPTION : undefined,
      },
    }
  }

  const qrData = generateQRData()
  const dimensions = QR_CARD_SIZES[config.layout]

  // Download bare QR code PNG (no card, no branding)
  const handleDownloadQROnly = async () => {
    try {
      const dataURL = await QRCode.toDataURL(qrData.url, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#FFFFFF' },
      })
      const link = document.createElement('a')
      link.download = `event-${eventData.id}-qr.png`
      link.href = dataURL
      link.click()
    } catch (err) {
      console.error('Failed to download QR code:', err)
    }
  }

  const rgbToHex = (color: string): string => {
    if (color.startsWith('#')) return color
    if (color.includes('oklch')) return '#000000'
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
    if (match) {
      const [, r, g, b] = match
      return '#' + [r, g, b].map((x) => parseInt(x).toString(16).padStart(2, '0')).join('')
    }
    return color
  }

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!cardRef.current) {
      alert('QR card not ready. Please try again.')
      return
    }

    try {
      const html2canvas = (await import('html2canvas')).default
      const bgColor = config.theme.backgroundColor.startsWith('#')
        ? config.theme.backgroundColor
        : '#ffffff'

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: bgColor,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        onclone: (_clonedDoc, clonedElement) => {
          const allElements = [
            clonedElement,
            ...Array.from(clonedElement.querySelectorAll('*')),
          ] as HTMLElement[]

          const originalElement = cardRef.current
          if (!originalElement) return
          const allOriginalElements = [
            originalElement,
            ...Array.from(originalElement.querySelectorAll('*')),
          ] as HTMLElement[]

          allOriginalElements.forEach((originalEl, index) => {
            const clonedEl = allElements[index]
            if (!clonedEl) return
            const computed = window.getComputedStyle(originalEl)
            const props = [
              'color',
              'backgroundColor',
              'borderColor',
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
            props.forEach((prop) => {
              let value = computed.getPropertyValue(prop)
              if (!value || value === '' || value === 'none') return
              if (value.includes('oklch')) {
                value = prop.includes('background') ? '#ffffff' : '#000000'
              } else if (value.includes('rgb')) {
                value = rgbToHex(value)
              }
              clonedEl.style.setProperty(prop, value, 'important')
            })
          })
        },
      })

      const filename = eventData.title.replace(/\s+/g, '-').toLowerCase()

      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf')
        const widthMm = dimensions.width * 25.4
        const heightMm = dimensions.height * 25.4
        const pdf = new jsPDF({
          orientation: widthMm > heightMm ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [widthMm, heightMm],
        })
        const imgData = canvas.toDataURL('image/png', 1.0)
        pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm)
        pdf.save(`${filename}-qr-${config.layout}.pdf`)
        onExport?.(imgData)
      } else {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              alert('Failed to create image. Please try again.')
              return
            }
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.download = `${filename}-qr-${config.layout}.png`
            link.href = url
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            onExport?.(url)
          },
          'image/png',
          0.95
        )
      }
    } catch (error) {
      console.error('Failed to export event QR code:', error)
      alert('Failed to download QR code. Please check the browser console for details.')
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
          <span>⚙️ Customize QR Card</span>
          <span className="text-gray-500">{showCustomization ? '▲' : '▼'}</span>
        </button>

        {showCustomization && (
          <div className="mt-4 space-y-4">
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
                    style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
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

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeDescription}
                  onChange={(e) => setConfig({ ...config, includeDescription: e.target.checked })}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Include app description</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* QR Card Preview */}
      <div
        ref={cardRef}
        className="mx-auto overflow-hidden rounded-lg border-2 border-gray-300 shadow-lg"
        style={{
          width: `${dimensions.width * 96}px`,
          backgroundColor: config.theme.backgroundColor,
        }}
      >
        <EventQRCardContent eventData={eventData} qrData={qrData} config={config} />
      </div>

      {/* Export Buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          onClick={handleDownloadQROnly}
          className="flex-1 rounded-md bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-700 sm:flex-initial sm:px-6"
          title="Square PNG of just the QR code — ready to upload to other apps"
        >
          ⬛ QR Code only
        </button>
        <button
          onClick={() => handleExport('png')}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 sm:flex-initial sm:px-6"
        >
          💾 Download card PNG
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="flex-1 rounded-md border border-blue-600 bg-white px-4 py-2 font-medium text-blue-600 hover:bg-blue-50 sm:flex-initial sm:px-6"
        >
          📄 Download PDF
        </button>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
        <h4 className="mb-2 font-medium text-blue-900">📋 How to Use</h4>
        <ul className="space-y-1 text-blue-800">
          <li>• Download and print for flyers, posters, or table cards</li>
          <li>• Print at 300 DPI for best quality</li>
          <li>• Anyone who scans can view the event and sign up to RSVP</li>
        </ul>
      </div>
    </div>
  )
}

function EventQRCardContent({
  eventData,
  qrData,
  config,
}: {
  eventData: EventQRCardProps['eventData']
  qrData: EventQRData
  config: QRCardConfig
}) {
  const { theme } = config
  const isSmall = config.layout === 'business-card' || config.layout === 'sticker'

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })

  const typeLabel = EVENT_TYPE_LABELS[eventData.eventType] || '📌 Event'

  return (
    <div
      className="p-6"
      style={{ color: theme.textColor, fontFamily: theme.fontFamily || 'system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="mb-4 text-center">
        <div className="mb-1 text-xs font-medium" style={{ color: theme.secondaryColor }}>
          {typeLabel}
        </div>
        <h2 className="text-xl leading-tight font-bold" style={{ color: theme.primaryColor }}>
          {eventData.title}
        </h2>
        {!isSmall && (
          <p className="mt-1 text-sm" style={{ color: theme.secondaryColor }}>
            📍 {eventData.venueName}, {eventData.venueCity}
          </p>
        )}
        {!isSmall && (
          <p className="mt-1 text-sm font-medium">
            📅 {formatDate(eventData.startDate)} · {formatTime(eventData.startDate)}
          </p>
        )}
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

      {/* Admission */}
      {!isSmall && (
        <div className="mt-3 text-center text-sm font-medium">
          {eventData.isFree ? (
            <span style={{ color: '#16a34a' }}>Free Entry</span>
          ) : eventData.price ? (
            <span>${eventData.price} CAD</span>
          ) : null}
        </div>
      )}

      {/* Description */}
      {config.includeDescription && !isSmall && qrData.data.appDescription && (
        <div className="mt-4 text-center text-xs leading-relaxed opacity-80">
          {qrData.data.appDescription}
        </div>
      )}

      {/* Branding */}
      {theme.showBranding && (
        <div className="mt-4 border-t pt-2 text-center text-xs opacity-70">
          GlobalPiano.Network — Piano Community
        </div>
      )}
    </div>
  )
}
