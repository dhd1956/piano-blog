'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import VenueDetailsView from '@/components/VenueDetailsView'
import VenueEditForm from '@/components/VenueEditForm'
import { useHybridWallet } from '@/hooks/useHybridWallet'
import { Venue, VenueMetadata, VenueUpdateForm } from '@/types/venue'

interface PermissionCheck {
  isBlogOwner: boolean
  isVenueCurator: boolean
  canEdit: boolean
  canUpdateCurator: boolean
}

// Simple permission checking functions for simplified architecture
function formatAddress(address: string | null): string {
  if (!address) return 'Not connected'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getClientPermissions(walletAddress: string) {
  const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS
  const isBlogOwner =
    blogOwnerAddress && walletAddress?.toLowerCase() === blogOwnerAddress.toLowerCase()

  return {
    isBlogOwner: Boolean(isBlogOwner),
  }
}

async function checkVenuePermissions(
  walletAddress: string,
  venueId: number
): Promise<PermissionCheck> {
  const clientPerms = getClientPermissions(walletAddress)

  return {
    isBlogOwner: clientPerms.isBlogOwner,
    isVenueCurator: false, // Simplified: no curator system yet
    canEdit: clientPerms.isBlogOwner, // Only blog owner can edit
    canUpdateCurator: clientPerms.isBlogOwner,
  }
}

export default function VenueDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const venueId = params.id ? parseInt(params.id as string, 10) : null
  const { isConnected, walletAddress, connectWallet } = useHybridWallet()

  const [venue, setVenue] = useState<Venue | null>(null)
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
  const [permissions, setPermissions] = useState<PermissionCheck>({
    isBlogOwner: false,
    isVenueCurator: false,
    canEdit: false,
    canUpdateCurator: false,
  })

  // Load venue data
  const loadVenueData = async () => {
    if (venueId === null || venueId < 0) {
      setError('Invalid venue ID')
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch venue from simplified PostgreSQL API
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
          fullAddress: venueData.fullAddress || '',
          hasPiano: venueData.hasPiano,
          hasJamSession: venueData.hasJamSession || false,
          verified: venueData.verified,
          venueType: venueData.venueType || 0,
          contactType: venueData.contactType || 'email',
          contactInfo: venueData.contactInfo || '',
          ipfsHash: venueData.ipfsHash || '',
          submittedBy: venueData.submittedBy,
          verifiedBy: venueData.verifiedBy || '',
          lastUpdatedBy: venueData.lastUpdatedBy || venueData.submittedBy,
          submissionDate: new Date(venueData.submissionDate),
          verificationDate: venueData.verificationDate
            ? new Date(venueData.verificationDate)
            : undefined,
          lastUpdatedDate: new Date(venueData.lastUpdatedDate || venueData.submissionDate),
          curatorNotes: venueData.curatorNotes || '',
        }

        setVenue(processedVenue)

        console.log('🔍 Venue loaded from database:', processedVenue.name)

        // Load extended data from venue metadata if available
        if (venueData.description || venueData.website) {
          setExtendedData({
            venueDetails: {
              fullName: venueData.name,
              description: venueData.description || '',
              fullAddress: venueData.fullAddress || '',
              city: venueData.city,
              contactInfo: venueData.contactInfo,
              contactType: venueData.contactType,
              website: venueData.website || '',
              socialMedia: {
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
              operatingHours: venueData.operatingHours
                ? {
                    notes: venueData.operatingHours,
                  }
                : undefined,
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
        }
      } else {
        setError(result.error || 'Venue not found')
      }

      // Check permissions if wallet is connected
      if (isConnected && walletAddress) {
        const venuePermissions = await checkVenuePermissions(walletAddress, venueId)
        setPermissions(venuePermissions)
      } else {
        // Set client-side permissions for blog owner check
        const clientPerms = getClientPermissions(walletAddress || '')
        setPermissions({
          isBlogOwner: clientPerms.isBlogOwner,
          isVenueCurator: false,
          canEdit: clientPerms.isBlogOwner, // Only blog owner can edit
          canUpdateCurator: clientPerms.isBlogOwner,
        })
      }
    } catch (error) {
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

      // Send update to simplified PostgreSQL API
      const response = await fetch(`/api/venues/${venue.id}`, {
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

        // Reload venue data
        await loadVenueData()

        // Exit edit mode
        setIsEditing(false)
      } else {
        throw new Error(result.error || 'Update failed')
      }

      return 'database-update'
    } catch (error) {
      console.error('Error updating venue:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load venue data when venueId or wallet connection changes
  useEffect(() => {
    loadVenueData()
  }, [venueId, isConnected, walletAddress])

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
            onClick={loadVenueData}
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

            {/* Wallet Connection & Edit Controls */}
            <div className="flex items-center gap-4">
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 rounded-lg px-3 py-1 text-sm text-white"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatAddress(walletAddress)}
                  </span>
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
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Either View or Edit Mode */}
        {isEditing && permissions.canEdit ? (
          <VenueEditForm
            venue={venue}
            permissions={permissions}
            onSave={updateVenue}
            onCancel={() => setIsEditing(false)}
            isSubmitting={isSubmitting}
          />
        ) : (
          <VenueDetailsView venue={venue} extendedData={extendedData} isLoading={loading} />
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
