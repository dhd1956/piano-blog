'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import VenueDetailsView from '@/components/VenueDetailsView'
import VenueEditForm from '@/components/VenueEditForm'
import VenueQRCard from '@/components/qr/VenueQRCard'
import VenueEvents from '@/components/venue/VenueEvents'
import TipButton from '@/components/tips/TipButton'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuth } from '@/context/AuthContext'
import { Venue, VenueMetadata, VenueUpdateForm } from '@/types/venue'

interface PermissionCheck {
  isBlogOwner: boolean
  isVenueCurator: boolean
  canEdit: boolean
  canUpdateCurator: boolean
}

export default function VenueDetailsPage() {
  // Require authentication to access this page
  const { isLoading: authLoading } = useRequireAuth()

  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const venueId = params.id ? parseInt(params.id as string, 10) : null
  const { user, isAuthenticated } = useAuth()
  const walletAddress = user?.walletAddress || null
  const isConnected = isAuthenticated

  const isBlogOwner = user?.role === 'BLOG_OWNER'

  const [venue, setVenue] = useState<Venue | null>(null)
  const [submitterName, setSubmitterName] = useState<string | null>(null)

  // Curator assignment state
  interface CuratorEntry {
    user: {
      id: number
      displayName: string | null
      username: string | null
      avatar: string | null
      profileSlug: string | null
      walletAddress: string | null
    }
    assignedAt: string
  }
  const [curators, setCurators] = useState<CuratorEntry[]>([])
  const [curatorInput, setCuratorInput] = useState('')
  const [curatorLoading, setCuratorLoading] = useState(false)
  const [curatorError, setCuratorError] = useState<string | null>(null)
  const [extendedData, setExtendedData] = useState<VenueMetadata>(() => ({
    venueDetails: {
      fullName: '',
      description: '',
      fullAddress: '',
      city: '',
    },
    musicalInfo: {
      hasPiano: false,
      hasJamSession: false,
    },
    operationalInfo: {},
    submissionInfo: {
      submittedBy: '',
      submissionDate: '',
      verified: false,
      version: 1,
      lastUpdated: '',
    },
  }))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)

  const isAssignedCurator = curators.some((c) => c.user.id === user?.id)
  const canEdit = isBlogOwner || isAssignedCurator
  const permissions: PermissionCheck = {
    isBlogOwner,
    isVenueCurator: isAssignedCurator,
    canEdit,
    canUpdateCurator: isBlogOwner,
  }

  // Load venue data
  const loadVenueData = async (signal?: AbortSignal) => {
    if (venueId === null || venueId < 0) {
      setError('Invalid venue ID')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      // Fetch venue from simplified PostgreSQL API
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('Venue not found')
        } else {
          setError(`Failed to load venue: ${response.statusText}`)
        }
        setLoading(false)
        return
      }

      const result = await response.json()

      if (result.venue) {
        const venueData = result.venue

        // Convert the venue data to match our Venue type
        const processedVenue: Venue = {
          id: venueData.id,
          name: venueData.name,
          city: venueData.city,
          province: venueData.province || null,
          country: venueData.country || null,
          fullAddress: venueData.fullAddress || venueData.address || '',
          hasPiano: venueData.hasPiano,
          hasJamSession: venueData.hasJamSession || false,
          isVirtual: venueData.isVirtual || false,
          streamingLink: venueData.streamingLink || null,
          verified: venueData.verified,
          venueType: venueData.venueType || 0,
          contactType: venueData.contactType || 'email',
          contactInfo: venueData.contactInfo || '',
          ipfsHash: venueData.ipfsHash || '',
          submittedBy: venueData.submittedBy,
          verifiedBy: '', // Field removed from schema
          lastUpdatedBy: venueData.submittedBy, // Default to submitter
          submissionDate: new Date(venueData.createdAt || venueData.submissionDate),
          verificationDate:
            venueData.verifiedAt || venueData.verificationDate
              ? new Date(venueData.verifiedAt || venueData.verificationDate)
              : undefined,
          lastUpdatedDate: new Date(
            venueData.updatedAt || venueData.lastUpdatedDate || venueData.createdAt
          ),
          curatorNotes: venueData.curatorNotes || '',
          // Rejection tracking
          rejectedAt: venueData.rejectedAt ? new Date(venueData.rejectedAt) : null,
          rejectedBy: venueData.rejectedBy || null,
          rejectionReason: venueData.rejectionReason || null,
        }

        setVenue(processedVenue)

        // Fetch submitter's display name for the TipButton label
        if (processedVenue.submittedBy && /^0x[a-fA-F0-9]{40}$/.test(processedVenue.submittedBy)) {
          fetch(`/api/profile/${processedVenue.submittedBy}`)
            .then((r) => r.json())
            .then((d) => setSubmitterName(d?.profile?.displayName || null))
            .catch(() => {})
        }

        console.log('🔍 Venue loaded from database:', processedVenue.name)

        // Always load extended data (not just when description/website/phone exist)
        setExtendedData({
          venueDetails: {
            fullName: venueData.name,
            description: venueData.description || '',
            fullAddress: venueData.fullAddress || venueData.address || '',
            city: venueData.city,
            contactInfo: venueData.contactInfo,
            contactType: venueData.contactType,
            phone: venueData.phone || '',
            website: venueData.website || '',
            streamingLink: venueData.streamingLink || '',
            socialMedia: venueData.socialLinks || {
              facebook: venueData.facebook,
              instagram: venueData.instagram,
              twitter: venueData.twitter,
            },
          },
          musicalInfo: {
            hasPiano: venueData.hasPiano,
            hasJamSession: venueData.hasJamSession || false,
            pianoType: venueData.pianoType,
            pianoCondition: venueData.pianoCondition,
            pianoBrand: venueData.pianoBrand,
            lastTuned: venueData.lastTuned,
            jamSchedule: venueData.jamSchedule,
            jamFrequency: venueData.jamFrequency,
            jamGenres: venueData.jamGenres || [],
          },
          operationalInfo: {
            operatingHours: venueData.operatingHours,
            accessibility: {
              wheelchairAccessible: venueData.wheelchairAccessible || false,
              parkingAvailable: venueData.parkingAvailable || false,
              publicTransportNear: venueData.publicTransportNear || false,
            },
            ambiance: {
              atmosphere: venueData.specialNotes || undefined,
            },
          },
          submissionInfo: {
            submittedBy: venueData.submittedBy,
            submissionDate: venueData.submissionDate,
            verified: venueData.verified,
            version: 1,
            lastUpdated: venueData.lastUpdatedDate || venueData.submissionDate,
          },
          curatorInfo: {
            curatorNotes: venueData.curatorNotes || '',
            curatorRating: venueData.curatorRating,
            followUpNeeded: venueData.followUpNeeded || false,
          },
        })
      } else {
        setError(result.error || 'Venue not found')
      }
    } catch (error) {
      // Don't set error state if request was aborted (component unmounted)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Venue fetch aborted')
        return
      }
      console.error('Error loading venue:', error)
      setError('Failed to load venue data')
    } finally {
      setLoading(false)
    }
  }

  // Venue update function using simplified PostgreSQL API
  const updateVenue = async (updateData: VenueUpdateForm) => {
    if (!venue) {
      throw new Error('No venue data available')
    }

    if (!permissions.canEdit) {
      throw new Error('Not authorized to edit this venue')
    }

    setIsSubmitting(true)
    try {
      console.log('🔄 Updating venue with data:', updateData)

      // Send update to simplified PostgreSQL API with wallet authentication
      const apiUrl = walletAddress
        ? `/api/venues/${venue.id}?address=${walletAddress}`
        : `/api/venues/${venue.id}`

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updateData.name,
          description: updateData.description,
          fullAddress: updateData.fullAddress,
          contactInfo: updateData.contactInfo,
          website: updateData.website,
          pianoType: updateData.pianoType,
          pianoCondition: updateData.pianoCondition,
          pianoBrand: updateData.pianoBrand,
          lastTuned: updateData.lastTuned,
          jamSchedule: updateData.jamSchedule,
          jamFrequency: updateData.jamFrequency,
          jamGenres: updateData.jamGenres,
          operatingHours: updateData.operatingHours,
          wheelchairAccessible: updateData.wheelchairAccessible,
          parkingAvailable: updateData.parkingAvailable,
          publicTransportNear: updateData.publicTransportNear,
          facebook: updateData.facebook,
          instagram: updateData.instagram,
          twitter: updateData.twitter,
          curatorNotes: updateData.curatorNotes,
          curatorRating: updateData.curatorRating,
          followUpNeeded: updateData.followUpNeeded,
          specialNotes: updateData.specialNotes,
          lastUpdatedBy: walletAddress || 'anonymous',
        }),
      })

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.venue) {
        console.log('✅ Venue updated successfully!')

        // Exit edit mode and navigate back immediately
        setIsEditing(false)
        setIsSubmitting(false)

        // Navigate back to venues list
        router.push('/venues')
      } else {
        throw new Error(result.error || 'Update failed')
      }
    } catch (error) {
      console.error('Error updating venue:', error)
      setIsSubmitting(false)
      alert(`Failed to update venue: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const fetchCurators = async () => {
    if (!venueId) return
    try {
      const res = await fetch(`/api/venues/${venueId}/curators`)
      if (res.ok) {
        const data = await res.json()
        setCurators(data.curators ?? [])
      }
    } catch {
      // Non-critical — silently ignore
    }
  }

  const handleAssignCurator = async () => {
    if (!curatorInput.trim() || !venueId) return
    setCuratorLoading(true)
    setCuratorError(null)
    try {
      const res = await fetch(`/api/venues/${venueId}/curators`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdentifier: curatorInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign curator')
      setCuratorInput('')
      await fetchCurators()
    } catch (err: any) {
      setCuratorError(err.message)
    } finally {
      setCuratorLoading(false)
    }
  }

  const handleRemoveCurator = async (userId: number) => {
    if (!venueId) return
    try {
      await fetch(`/api/venues/${venueId}/curators`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      await fetchCurators()
    } catch {
      // Silent fail
    }
  }

  // Load venue data when venueId changes (auth-independent — venue GET is public)
  useEffect(() => {
    const abortController = new AbortController()
    loadVenueData(abortController.signal)
    fetchCurators()
    return () => {
      abortController.abort()
    }
  }, [venueId])

  // Auto-open edit mode when linked with ?edit=1, once permission is known
  useEffect(() => {
    if (searchParams.get('edit') === '1' && canEdit) {
      setIsEditing(true)
    }
  }, [searchParams, canEdit])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl text-center">
          <div className="border-primary-600 dark:border-primary-400 mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl text-center">
          <div className="border-primary-600 dark:border-primary-400 mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading venue details...</p>
        </div>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 text-red-600 dark:text-red-400">❌ {error || 'Venue not found'}</div>
          <button
            onClick={() => router.back()}
            className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 mr-4 rounded-lg px-4 py-2 text-white"
          >
            Go Back
          </button>
          <button
            onClick={() => loadVenueData()}
            className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-start justify-between">
            <button
              onClick={() => router.back()}
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-2"
            >
              ← Back to Venues
            </button>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {!isEditing &&
                venue.submittedBy &&
                /^0x[a-fA-F0-9]{40}$/.test(venue.submittedBy) &&
                venue.submittedBy.toLowerCase() !== walletAddress?.toLowerCase() && (
                  <TipButton
                    recipientAddress={venue.submittedBy}
                    recipientName={submitterName || `${venue.name} scout`}
                  />
                )}
              {permissions.canEdit && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`rounded-lg px-3 py-1 text-sm ${
                    isEditing
                      ? 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400'
                      : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500'
                  }`}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Venue'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Either View or Edit Mode */}
        {isEditing && permissions.canEdit ? (
          <VenueEditForm
            venue={venue}
            extendedData={extendedData}
            permissions={permissions}
            onSave={updateVenue}
            onCancel={() => setIsEditing(false)}
            isSubmitting={isSubmitting}
          />
        ) : (
          <>
            <VenueDetailsView
              venue={venue}
              extendedData={extendedData}
              isLoading={loading}
              submitterName={submitterName}
            />

            {/* Events Section */}
            <div className="mt-8">
              <VenueEvents
                venueId={venue.id}
                venueName={venue.name}
                venueProvince={venue.province}
                venueCountry={venue.country}
              />
            </div>

            {/* Curators Section */}
            {(curators.length > 0 || isBlogOwner) && (
              <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                  🎯 Assigned Curators
                </h2>

                {curators.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No curators assigned yet.
                  </p>
                ) : (
                  <ul className="mb-4 space-y-2">
                    {curators.map((c) => (
                      <li
                        key={c.user.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {c.user.displayName || c.user.username || 'Unknown'}
                          {c.user.username && (
                            <span className="ml-1 text-gray-400">@{c.user.username}</span>
                          )}
                        </span>
                        {isBlogOwner && (
                          <button
                            onClick={() => handleRemoveCurator(c.user.id)}
                            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {isBlogOwner && (
                  <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      Assign a curator by username, email, or wallet address. They must already have
                      the Curator role.
                    </p>
                    {curatorError && <p className="mb-2 text-xs text-red-500">{curatorError}</p>}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={curatorInput}
                        onChange={(e) => setCuratorInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAssignCurator()}
                        placeholder="username, email, or 0x…"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={handleAssignCurator}
                        disabled={!curatorInput.trim() || curatorLoading}
                        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {curatorLoading ? 'Assigning…' : 'Assign'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Marketing Materials Section */}
            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🎨 Marketing Materials
                </h2>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  📱 Generate QR Code
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400">
                Create custom QR codes for this venue that visitors can scan to view details and
                leave tips. Perfect for table tents, posters, or business cards!
              </p>
            </div>
          </>
        )}

        {/* QR Code Modal */}
        {showQRModal && venue && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
            <div className="max-h-screen w-full max-w-4xl overflow-y-auto rounded-lg bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  QR Code for {venue.name}
                </h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <VenueQRCard
                  venueData={{
                    id: venue.id,
                    slug: `${venue.id}`, // TODO: Add slug field to venue
                    name: venue.name,
                    city: venue.city,
                    address: venue.fullAddress,
                    description: extendedData.venueDetails?.description,
                    hasPiano: venue.hasPiano,
                    pianoType: extendedData.musicalInfo?.pianoType,
                    phone: extendedData.venueDetails?.contactInfo,
                    website: extendedData.venueDetails?.website,
                    socialLinks: extendedData.venueDetails?.socialMedia,
                    submittedBy: venue.submittedBy,
                  }}
                />
              </div>

              <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permission Debug (remove in production) */}
        {process.env.NODE_ENV === 'development' && isConnected && (
          <div className="mt-4 rounded-lg bg-gray-100 p-4">
            <div className="text-xs text-gray-600">
              <div>Permissions: {JSON.stringify(permissions, null, 2)}</div>
              <div>Wallet: {walletAddress}</div>
              <div>Blog Owner: {process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
