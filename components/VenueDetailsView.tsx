import React, { useState } from 'react'
import { Venue, VenueMetadata, VENUE_TYPES } from '@/types/venue'
import { formatAddress } from '@/utils/permissions'

interface VenueDetailsViewProps {
  venue: Venue
  extendedData?: VenueMetadata
  isLoading?: boolean
  submitterName?: string | null
}

export default function VenueDetailsView({
  venue,
  extendedData,
  isLoading = false,
  submitterName,
}: VenueDetailsViewProps) {
  if (isLoading) {
    return <VenueDetailsViewSkeleton />
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-900">
      {/* Header Section */}
      <VenueHeader venue={venue} />

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-2">
        {/* Left Column - Venue Details */}
        <div className="space-y-6">
          <VenueInformation venue={venue} />
          <ExtendedInformation extendedData={extendedData} />
          <OperationalDetails extendedData={extendedData} />
        </div>

        {/* Right Column - Meta Information */}
        <div className="space-y-6">
          <VerificationDetails venue={venue} />
          <MusicalInformation venue={venue} extendedData={extendedData} />
          <CuratorNotes venue={venue} extendedData={extendedData} />
          <ContactInformation venue={venue} extendedData={extendedData} />
        </div>
      </div>

      {/* Footer with additional metadata */}
      <VenueMetaFooter venue={venue} />
    </div>
  )
}

function VenueHeader({ venue }: { venue: Venue }) {
  return (
    <div className="from-primary-50 to-primary-100 border-b border-gray-200 bg-gradient-to-r p-8 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700">
      <div className="mb-4 flex items-start justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{venue.name}</h1>
        <div className="flex items-center gap-3">
          {venue.verified ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              ✓ Verified
            </span>
          ) : (venue as any).rejectedAt ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
              ✗ Rejected
            </span>
          ) : (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Pending Verification
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 text-lg text-gray-600 dark:text-gray-300">
        📍 {venue.city} • {VENUE_TYPES[venue.venueType] || 'Cafe'}
      </div>

      {/* Features */}
      <div className="mb-6 flex gap-3">
        {venue.hasPiano && (
          <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full px-3 py-1 text-sm">
            🎹 Piano Available
          </span>
        )}
        {venue.hasJamSession && (
          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            🎵 Jam Sessions
          </span>
        )}
      </div>
    </div>
  )
}

function VenueInformation({ venue }: { venue: Venue }) {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Venue Information
      </h3>
      <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <InfoRow label="Type" value={VENUE_TYPES[venue.venueType] || 'Cafe'} />
        <InfoRow label="City" value={venue.city} />
      </div>
    </div>
  )
}

function ExtendedInformation({ extendedData }: { extendedData?: VenueMetadata }) {
  if (!extendedData?.venueDetails) return null

  const details = extendedData.venueDetails

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        About This Venue
      </h3>
      <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        {details.description && (
          <div>
            <p className="text-sm leading-relaxed break-words text-gray-900 dark:text-gray-100">
              {details.description}
            </p>
          </div>
        )}
        {details.socialMedia && Object.keys(details.socialMedia).length > 0 && (
          <SocialMediaLinks socialMedia={details.socialMedia} />
        )}
      </div>
    </div>
  )
}

function OperationalDetails({ extendedData }: { extendedData?: VenueMetadata }) {
  const operational = extendedData?.operationalInfo
  if (!operational) return null

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Operational Details
      </h3>
      <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        {operational.operatingHours && (
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Operating Hours:</span>
            <OperatingHoursDisplay hours={operational.operatingHours} />
          </div>
        )}
        {operational.accessibility && (
          <AccessibilityInfo accessibility={operational.accessibility} />
        )}
        {operational.ambiance && <AmbianceInfo ambiance={operational.ambiance} />}
      </div>
    </div>
  )
}

function VerificationDetails({ venue }: { venue: any }) {
  // Handle date - might be submissionDate or createdAt
  const submissionDate = venue.submissionDate || venue.createdAt

  let dateStr = 'Unknown'
  if (submissionDate) {
    const dateObj = new Date(submissionDate)
    dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : 'Unknown'
  }

  // Determine status - only show for rejected venues
  const isRejected = venue.rejectedAt !== null && venue.rejectedAt !== undefined

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Verification Details
      </h3>
      <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <InfoRow
          label="Submitted"
          value={
            <div>
              <div>{dateStr}</div>
              <div className="text-xs text-gray-500">
                by {submitterName || formatAddress(venue.submittedBy)}
              </div>
            </div>
          }
        />

        {/* Show rejection details if rejected */}
        {isRejected && venue.rejectedAt && (
          <>
            <InfoRow label="Rejected On" value={new Date(venue.rejectedAt).toLocaleDateString()} />
            {venue.rejectedBy && (
              <InfoRow label="Rejected By" value={formatAddress(venue.rejectedBy)} />
            )}
          </>
        )}
      </div>

      {/* Rejection Reason Section */}
      {isRejected && venue.rejectionReason && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <h4 className="mb-2 font-semibold text-red-900 dark:text-red-200">Rejection Reason</h4>
          <p className="text-sm leading-relaxed text-red-800 dark:text-red-300">
            {venue.rejectionReason}
          </p>
        </div>
      )}
    </div>
  )
}

function MusicalInformation({
  venue,
  extendedData,
}: {
  venue: Venue
  extendedData?: VenueMetadata
}) {
  const musical = extendedData?.musicalInfo

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Musical Information
      </h3>
      <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div className="flex gap-2">
          {venue.hasPiano && (
            <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">🎹 Piano</span>
          )}
          {venue.hasJamSession && (
            <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">🎵 Jams</span>
          )}
        </div>

        {musical?.pianoType && (
          <InfoRow label="Piano Type" value={musical.pianoType.replace('_', ' ')} />
        )}

        {musical?.pianoCondition && (
          <InfoRow
            label="Piano Condition"
            value={
              <span
                className={`capitalize ${
                  musical.pianoCondition === 'excellent'
                    ? 'text-green-600'
                    : musical.pianoCondition === 'good'
                      ? 'text-blue-600'
                      : musical.pianoCondition === 'fair'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                }`}
              >
                {musical.pianoCondition.replace('_', ' ')}
              </span>
            }
          />
        )}

        {musical?.pianoBrand && <InfoRow label="Piano Brand" value={musical.pianoBrand} />}

        {musical?.lastTuned && <InfoRow label="Last Tuned" value={musical.lastTuned} />}

        {musical?.jamSchedule && <InfoRow label="Jam Schedule" value={musical.jamSchedule} />}

        {musical?.jamGenres && musical.jamGenres.length > 0 && (
          <div>
            <span className="font-medium text-gray-600">Jam Genres:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {musical.jamGenres.map((genre, index) => (
                <span
                  key={index}
                  className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-800"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CuratorNotes({ venue, extendedData }: { venue: Venue; extendedData?: VenueMetadata }) {
  const curatorInfo = extendedData?.curatorInfo

  if (
    !curatorInfo ||
    (!curatorInfo.curatorNotes && !curatorInfo.curatorRating && !curatorInfo.followUpNeeded)
  ) {
    return null
  }

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Curator Notes</h3>
      <div className="space-y-3 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
        {curatorInfo.curatorNotes && (
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Notes:</span>
            <p className="mt-1 text-sm leading-relaxed text-gray-900 dark:text-gray-100">
              {curatorInfo.curatorNotes}
            </p>
          </div>
        )}

        {curatorInfo.curatorRating && curatorInfo.curatorRating > 0 && (
          <InfoRow
            label="Curator Rating"
            value={
              <div className="flex items-center gap-2">
                <span>{'⭐'.repeat(curatorInfo.curatorRating)}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({curatorInfo.curatorRating}/5)
                </span>
              </div>
            }
          />
        )}

        {curatorInfo.followUpNeeded && (
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Follow-up Required
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function ContactInformation({
  venue,
  extendedData,
}: {
  venue: Venue
  extendedData?: VenueMetadata
}) {
  // Get contact information from different sources
  const address = venue.fullAddress || extendedData?.venueDetails?.fullAddress

  // Helper function to detect if a string looks like a phone number
  const looksLikePhone = (str: string | null): boolean => {
    if (!str) return false
    // Phone number pattern: contains digits, parentheses, dashes, spaces, or plus
    const phonePattern = /^[\d\s\-()+.]+$/
    const hasEnoughDigits = (str.match(/\d/g) || []).length >= 7
    return phonePattern.test(str.trim()) && hasEnoughDigits
  }

  // Determine email - only from contactInfo if contactType is 'email' AND it looks like an email
  let email: string | null = null
  if (venue.contactType === 'email' && venue.contactInfo) {
    // Check if it's actually a phone number disguised as email
    if (looksLikePhone(venue.contactInfo)) {
      email = null // Don't use it as email
    } else {
      email = venue.contactInfo
    }
  }

  // Determine phone - from multiple sources with smart fallback
  let phone: string | null = null
  if (venue.contactType === 'phone') {
    phone = venue.contactInfo
  } else if (
    venue.contactType === 'email' &&
    venue.contactInfo &&
    looksLikePhone(venue.contactInfo)
  ) {
    // If contactType is email but contactInfo is actually a phone number, use it as phone
    phone = venue.contactInfo
  } else {
    // Fall back to extended data phone
    phone = extendedData?.venueDetails?.phone || null
  }

  const website = extendedData?.venueDetails?.website
  const otherContact =
    venue.contactType !== 'email' &&
    venue.contactType !== 'phone' &&
    venue.contactType !== 'website'
      ? venue.contactInfo
      : null

  // If no contact information at all, don't render the section
  if (!address && !email && !phone && !website && !otherContact) return null

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Contact Information
      </h3>
      <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        {/* Address */}
        {address && (
          <InfoRow
            label="Address"
            value={<span className="break-all text-gray-900 dark:text-gray-100">{address}</span>}
          />
        )}

        {/* Email */}
        {email && (
          <InfoRow
            label="Email"
            value={
              <a
                href={`mailto:${email}`}
                className="break-all text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {email}
              </a>
            }
          />
        )}

        {/* Phone number */}
        {phone && (
          <InfoRow
            label="Phone"
            value={
              <a
                href={`tel:${phone}`}
                className="break-all text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {phone}
              </a>
            }
          />
        )}

        {/* Website */}
        {website && (
          <InfoRow
            label="Website"
            value={
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {website}
              </a>
            }
          />
        )}

        {/* Other contact type */}
        {otherContact && (
          <InfoRow
            label={venue.contactType.charAt(0).toUpperCase() + venue.contactType.slice(1)}
            value={otherContact}
          />
        )}
      </div>
    </div>
  )
}

function VenueMetaFooter({ venue }: { venue: Venue }) {
  return (
    <div className="border-t bg-gray-50 px-8 py-4 text-xs text-gray-500">
      <div className="flex items-center justify-between">
        <div>
          Venue ID: {venue.id} • Added {venue.submissionDate.toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

// Helper components
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="mr-1 flex-shrink-0 font-medium text-gray-600 dark:text-gray-400">
        {label}:
      </span>
      <span className="min-w-0 flex-1 text-right break-words text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  )
}

function SocialMediaLinks({ socialMedia }: { socialMedia: any }) {
  const platforms = Object.entries(socialMedia).filter(([_, url]) => url)

  if (platforms.length === 0) return null

  return (
    <div>
      <span className="font-medium text-gray-600">Social Media:</span>
      <div className="mt-1 flex gap-2">
        {platforms.map(([platform, url]) => (
          <a
            key={platform}
            href={url as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 underline hover:text-blue-800"
          >
            {platform}
          </a>
        ))}
      </div>
    </div>
  )
}

function OperatingHoursDisplay({ hours }: { hours: any }) {
  // Handle if hours is a string
  if (typeof hours === 'string') {
    return <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{hours}</div>
  }

  // Handle if hours is not an object
  if (!hours || typeof hours !== 'object') {
    return null
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  // Check if it's the day-of-week format
  const hasDays = days.some((day) => day in hours)

  if (hasDays) {
    // Render day-of-week format
    return (
      <div className="mt-1 space-y-1 text-sm text-gray-900 dark:text-gray-100">
        {days.map((day) => {
          const dayHours = hours[day]
          if (!dayHours) return null

          // If dayHours is an object (e.g., {open, close, closed}), format it
          let displayHours: string
          if (typeof dayHours === 'object' && dayHours !== null) {
            if (dayHours.closed) {
              displayHours = 'Closed'
            } else if (dayHours.open && dayHours.close) {
              displayHours = `${dayHours.open} - ${dayHours.close}`
            } else {
              displayHours = JSON.stringify(dayHours)
            }
          } else {
            displayHours = String(dayHours)
          }

          return (
            <div key={day} className="flex justify-between">
              <span className="capitalize">{day}:</span>
              <span>{displayHours}</span>
            </div>
          )
        })}
        {hours.notes && (
          <div className="mt-2 text-xs text-gray-600 italic dark:text-gray-400">{hours.notes}</div>
        )}
      </div>
    )
  }

  // Handle other formats (open/close/closed, or just display as JSON)
  return (
    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
      {Object.entries(hours).map(([key, value]) => {
        // Skip if value is an object (can't render nested objects)
        if (typeof value === 'object') return null

        return (
          <div key={key} className="flex justify-between">
            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
            <span>{String(value)}</span>
          </div>
        )
      })}
    </div>
  )
}

function AccessibilityInfo({ accessibility }: { accessibility: any }) {
  return (
    <div>
      <span className="font-medium text-gray-600">Accessibility:</span>
      <div className="mt-1 space-y-1 text-sm text-gray-900">
        {accessibility.wheelchairAccessible && (
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>Wheelchair Accessible</span>
          </div>
        )}
        {accessibility.parkingAvailable && (
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>Parking Available</span>
          </div>
        )}
        {accessibility.publicTransportNear && (
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>Near Public Transport</span>
          </div>
        )}
        {accessibility.notes && (
          <div className="text-xs text-gray-600 italic">{accessibility.notes}</div>
        )}
      </div>
    </div>
  )
}

function AmbianceInfo({ ambiance }: { ambiance: any }) {
  return (
    <div>
      <span className="font-medium text-gray-600">Ambiance:</span>
      <div className="mt-1 space-y-1 text-sm text-gray-900">
        {ambiance.noiseLevel && <InfoRow label="Noise Level" value={ambiance.noiseLevel} />}
        {ambiance.lighting && <InfoRow label="Lighting" value={ambiance.lighting} />}
        {ambiance.atmosphere && (
          <div className="text-xs text-gray-600 italic">{ambiance.atmosphere}</div>
        )}
      </div>
    </div>
  )
}

function VenueDetailsViewSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg bg-white shadow-md">
      {/* Header skeleton */}
      <div className="border-b border-gray-200 p-8">
        <div className="mb-4 h-8 w-3/4 rounded bg-gray-200"></div>
        <div className="mb-4 h-4 w-1/2 rounded bg-gray-200"></div>
        <div className="flex gap-3">
          <div className="h-6 w-20 rounded bg-gray-200"></div>
          <div className="h-6 w-24 rounded bg-gray-200"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-2">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="mb-3 h-6 w-1/3 rounded bg-gray-200"></div>
              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <div className="h-4 rounded bg-gray-200"></div>
                <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-4 w-1/2 rounded bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="mb-3 h-6 w-1/3 rounded bg-gray-200"></div>
              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <div className="h-4 rounded bg-gray-200"></div>
                <div className="h-4 w-2/3 rounded bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
