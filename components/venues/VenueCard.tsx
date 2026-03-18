'use client'

import React from 'react'

interface Venue {
  id: number
  name: string
  city: string
  contactInfo: string
  hasPiano: boolean
  verified: boolean
  submittedBy: string
  timestamp: number
  submissionDate: Date
  isPartner?: boolean
}

interface VenueCardProps {
  venue: Venue
}

export default function VenueCard({ venue }: VenueCardProps) {
  const getVenueIcon = () => {
    if (venue.hasPiano) return '🎹'
    return '🏢'
  }

  const getStatusBadge = () => {
    if (venue.verified) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          ✅ Verified
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
        ⏳ Pending
      </span>
    )
  }

  const getPartnerBadge = () => {
    if (venue.isPartner) {
      return (
        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
          💎 PXP Partner
        </span>
      )
    }
    return null
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">{getVenueIcon()}</span>
              <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
            </div>

            <div className="mb-3 flex items-center gap-2">
              {getStatusBadge()}
              {getPartnerBadge()}
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <p>📍 {venue.city}</p>
              <p>📞 {venue.contactInfo}</p>
              {venue.hasPiano && <p>🎹 Piano available</p>}
            </div>
          </div>

          {/* Venue ID */}
          <div className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-400">#{venue.id}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between bg-gray-50 px-6 py-4">
        <div className="text-xs text-gray-500">
          Added {venue.submissionDate.toLocaleDateString()}
        </div>

        <div className="flex gap-2">
          {/* Share Button */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/venues/${venue.id}`
              navigator
                .share?.({
                  title: venue.name,
                  text: `Check out ${venue.name} in ${venue.city}`,
                  url,
                })
                .catch(() => {
                  navigator.clipboard.writeText(url)
                })
            }}
            className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors hover:bg-blue-200"
          >
            📤 Share
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Simplified venue card for list views
 */
export function CompactVenueCard({
  venue,
  onSelect,
}: {
  venue: Venue
  onSelect?: (venue: Venue) => void
}) {
  return (
    <div
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
      onClick={() => onSelect?.(venue)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(venue)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Select venue ${venue.name}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{venue.hasPiano ? '🎹' : '🏢'}</span>
          <div>
            <h3 className="font-medium text-gray-900">{venue.name}</h3>
            <p className="text-sm text-gray-600">{venue.city}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {venue.isPartner && (
            <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">PXP</span>
          )}
          {venue.verified ? (
            <span className="text-green-600">✅</span>
          ) : (
            <span className="text-yellow-600">⏳</span>
          )}
        </div>
      </div>
    </div>
  )
}
