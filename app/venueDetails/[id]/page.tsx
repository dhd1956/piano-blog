'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import {
  checkVenuePermissions,
  getClientPermissions,
  formatAddress,
  PermissionCheck,
} from '@/utils/permissions'
import {
  VENUE_REGISTRY_ABI,
  VENUE_REGISTRY_ADDRESS,
  CELO_TESTNET_RPC,
  createReadOnlyContract,
  switchToCeloNetwork,
} from '@/utils/contract'
import { Venue, VenueMetadata, VenueUpdateForm } from '@/types/venue'
import VenueDetailsView from '@/components/VenueDetailsView'
import VenueEditForm from '@/components/VenueEditForm'
import { IPFSService } from '@/utils/ipfs'
import Web3 from 'web3'

export default function VenueDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const venueId = params.id ? parseInt(params.id as string, 10) : null
  const { getVenueById, isConnected, walletAddress, connect, updateVenueWithMetadata } = useWallet()

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
      
      const result = await getVenueById(venueId)
      
      if (result.success && result.venue) {
        // Convert the venue data to match our Venue type
        const processedVenue: Venue = {
          id: result.venue.id,
          name: result.venue.name,
          city: result.venue.city,
          fullAddress: '', // Not available in simplified contract
          hasPiano: result.venue.hasPiano,
          hasJamSession: result.venue.hasJamSession || false,
          verified: result.venue.verified,
          venueType: result.venue.venueType || 0,
          contactType: result.venue.contactType || 'email',
          contactInfo: result.venue.contactInfo || '',
          ipfsHash: result.venue.ipfsHash || '',
          submittedBy: result.venue.submittedBy,
          verifiedBy: '', // Not available in simplified contract
          lastUpdatedBy: result.venue.submittedBy, // Default to submitter
          submissionDate: result.venue.submissionDate,
          verificationDate: undefined, // Not available in simplified contract
          lastUpdatedDate: result.venue.submissionDate, // Default to submission date
          curatorNotes: '', // Not available in simplified contract
        }
        
        setVenue(processedVenue)
        
        console.log('🔍 Venue IPFS hash:', processedVenue.ipfsHash)
        
        // Load extended data from IPFS
        if (processedVenue.ipfsHash && processedVenue.ipfsHash.trim() !== '') {
          console.log('🔄 Loading extended data for IPFS hash:', processedVenue.ipfsHash)
          await loadExtendedData(processedVenue.ipfsHash)
        } else {
          console.log('⚠️ No IPFS hash found for venue, skipping extended data load')
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
          canEdit: true, // Temporarily allow any connected wallet to edit for testing
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

  // Load extended data from IPFS via blockchain-stored hash
  const loadExtendedData = async (ipfsHash: string) => {
    console.log('🔍 Loading extended data for venue ID:', venue?.id)
    
    if (!ipfsHash || ipfsHash.trim() === '') {
      console.log('No IPFS hash available, using default extended data')
      return
    }

    try {
      console.log('🔍 Loading extended data from IPFS:', ipfsHash)
      const { success, metadata, error } = await IPFSService.getMetadata(ipfsHash)
      
      if (success && metadata) {
        console.log('✅ Extended data loaded from IPFS')
        console.log('📄 Raw IPFS metadata:', metadata)
        // Convert IPFS metadata to VenueMetadata format
        const convertedData: VenueMetadata = {
          venueDetails: {
            fullName: venue?.name || '',
            description: metadata.description || '',
            fullAddress: metadata.fullAddress || venue?.fullAddress || '',
            city: venue?.city || '',
            contactInfo: venue?.contactInfo,
            contactType: venue?.contactType,
            website: metadata.website || '',
            socialMedia: {
              facebook: metadata.facebook,
              instagram: metadata.instagram,
              twitter: metadata.twitter,
            }
          },
          musicalInfo: {
            hasPiano: venue?.hasPiano || false,
            hasJamSession: venue?.hasJamSession || false,
            pianoType: metadata.pianoType || undefined,
            pianoCondition: metadata.pianoCondition || undefined,
            pianoBrand: metadata.pianoBrand || undefined,
            lastTuned: metadata.lastTuned || undefined,
            jamSchedule: metadata.jamSchedule || undefined,
            jamFrequency: metadata.jamFrequency || undefined,
            jamGenres: metadata.jamGenres || [],
          },
          operationalInfo: {
            operatingHours: metadata.operatingHours ? {
              notes: metadata.operatingHours
            } : undefined,
            accessibility: {
              wheelchairAccessible: metadata.wheelchairAccessible || false,
              parkingAvailable: metadata.parkingAvailable || false,
              publicTransportNear: metadata.publicTransportNear || false,
            },
            ambiance: {
              atmosphere: metadata.specialNotes || undefined,
            },
          },
          submissionInfo: {
            submittedBy: venue?.submittedBy || '',
            submissionDate: venue?.submissionDate.toISOString() || '',
            verified: venue?.verified || false,
            version: metadata.version || 1,
            lastUpdated: metadata.lastUpdated || new Date().toISOString(),
          },
          curatorInfo: {
            curatorNotes: metadata.curatorNotes || metadata.specialNotes || '',
            curatorRating: metadata.curatorRating || undefined,
            followUpNeeded: metadata.followUpNeeded || false,
          }
        }
        console.log('🔄 Setting extended data:', convertedData)
        setExtendedData(convertedData)
      } else {
        console.warn('Failed to load IPFS data:', error)
        // Keep default extended data structure
      }
    } catch (error) {
      console.error('Error loading extended data from IPFS:', error)
    }
  }

  // Connect wallet (using the hook's connect function)
  const connectWallet = async () => {
    await connect()
  }

  // Venue update function with IPFS metadata storage
  const updateVenue = async (updateData: VenueUpdateForm) => {
    if (!isConnected || !walletAddress || !venue) {
      throw new Error('Wallet not connected')
    }

    if (!permissions.canEdit) {
      throw new Error('Not authorized to edit this venue')
    }

    setIsSubmitting(true)
    try {
      console.log('🔄 Updating venue with data:', updateData)
      console.log('🔄 Current venue data:', venue)
      
      // Debug: Check what fields have actually changed
      console.log('🔍 Field changes:', {
        name: `${venue.name} -> ${updateData.name}`,
        contactInfo: `${venue.contactInfo} -> ${updateData.contactInfo}`,
        fullAddress: `${venue.fullAddress} -> ${updateData.fullAddress}`,
        curatorNotes: `${venue.curatorNotes || 'empty'} -> ${updateData.curatorNotes || 'empty'}`
      })
      
      // Separate basic updates (blockchain) from extended updates (IPFS)
      const basicUpdates = {
        name: updateData.name !== venue.name ? updateData.name : undefined,
        contactInfo: updateData.contactInfo !== venue.contactInfo ? updateData.contactInfo : undefined,
      }

      const extendedUpdates = {
        description: updateData.description,
        fullAddress: updateData.fullAddress,
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
      }

      // Filter out undefined values from extended updates
      const filteredExtendedUpdates = Object.fromEntries(
        Object.entries(extendedUpdates).filter(([_, value]) => value !== undefined)
      )

      console.log('🔍 Debug update data:', {
        basicUpdates,
        extendedUpdates,
        filteredExtendedUpdates,
        hasExtendedUpdates: Object.keys(filteredExtendedUpdates).length > 0
      })

      // Use the IPFS-integrated update function
      console.log('🚀 Calling updateVenueWithMetadata with:', {
        venueId: venue.id,
        basicUpdates,
        filteredExtendedUpdates
      })
      
      const result = await updateVenueWithMetadata(
        venue.id,
        basicUpdates,
        filteredExtendedUpdates
      )

      console.log('📊 Update result:', result)

      if (result.success) {
        console.log('✅ Venue updated successfully!')
        if (result.transactionHash) {
          console.log('📍 Blockchain transaction hash:', result.transactionHash)
        }
        if (result.ipfsHash) {
          console.log('📍 IPFS metadata hash:', result.ipfsHash)
        }

        // Enhanced contract now properly stores IPFS hash on blockchain
        console.log('✅ IPFS metadata properly stored on blockchain via enhanced contract')

        // Wait a moment for transaction to be mined and IPFS to propagate
        setTimeout(async () => {
          console.log('🔄 Reloading venue data...')
          await loadVenueData()
          console.log('✅ Venue data reloaded')
        }, 2000)
        
        // Exit edit mode
        setIsEditing(false)
      } else {
        throw new Error(result.error || 'Update failed')
      }

      return result.transactionHash
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
