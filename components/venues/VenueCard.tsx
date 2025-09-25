'use client'

import React, { useState } from 'react'
import { QuickCAVPayment } from '@/components/payments/UnifiedCAVPayment'

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
  // Extended properties for CAV integration
  isPartner?: boolean
  paymentAddress?: string
  totalCAVReceived?: number
}

interface VenueCardProps {
  venue: Venue
  showQRCode?: boolean
  onPayment?: (venueId: number, amount: string) => void
}

export default function VenueCard({ venue, showQRCode = true, onPayment }: VenueCardProps) {
  const [selectedAmount, setSelectedAmount] = useState('10')
  
  // Use venue's payment address or fallback to submitter
  const paymentAddress = venue.paymentAddress || venue.submittedBy

  const handlePayment = (amount: string) => {
    onPayment?.(venue.id, amount)
    // In production, this might trigger a Web3 transaction
  }

  const getVenueIcon = () => {
    if (venue.hasPiano) return '🎹'
    return '🏢'
  }

  const getStatusBadge = () => {
    if (venue.verified) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Verified
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        ⏳ Pending
      </span>
    )
  }

  const getPartnerBadge = () => {
    if (venue.isPartner) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          💎 CAV Partner
        </span>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getVenueIcon()}</span>
              <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
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
          <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            #{venue.id}
          </div>
        </div>
      </div>

      {/* CAV Payment Section (for partner venues) */}
      {venue.isPartner && showQRCode && (
        <div className="px-6 pb-4">
          <QuickCAVPayment
            recipientAddress={paymentAddress}
            recipientName={venue.name}
            amount={selectedAmount}
            memo={`Payment to ${venue.name} - ${venue.city}`}
            onPayment={(details) => {
              console.log('Payment initiated:', details)
              onPayment?.(venue.id, details.amount || selectedAmount)
            }}
          />
          
          {/* Payment Stats */}
          {venue.totalCAVReceived && venue.totalCAVReceived > 0 && (
            <div className="mt-3 text-center text-sm text-gray-600">
              💼 Total CAV received: {venue.totalCAVReceived.toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Added {venue.submissionDate.toLocaleDateString()}
        </div>
        
        <div className="flex gap-2">
          {/* Web3 Payment Button (for verified venues) */}
          {venue.verified && (
            <button
              onClick={() => handlePayment(selectedAmount || '10')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
            >
              🌐 Web3 Pay
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/venues/${venue.id}`
              navigator.share?.({ 
                title: venue.name, 
                text: `Check out ${venue.name} in ${venue.city}`, 
                url 
              }).catch(() => {
                navigator.clipboard.writeText(url)
              })
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
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
export function CompactVenueCard({ venue, onSelect }: { 
  venue: Venue
  onSelect?: (venue: Venue) => void 
}) {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(venue)}
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
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
              CAV
            </span>
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