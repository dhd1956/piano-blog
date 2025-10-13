'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { usePermissions } from '@/components/web3/WorkingWeb3Provider'
import WalletConnection from '@/components/web3/WalletConnection'

interface Venue {
  id: number
  slug: string
  name: string
  city: string
  contactInfo: string
  hasPiano: boolean
  verified: boolean
  submittedBy: string
  description?: string
  address?: string
  phone?: string
  amenities: string[]
  tags: string[]
  rating: number
  reviewCount: number
  createdAt: Date
}

const VENUE_TYPES = ['Cafe', 'Restaurant', 'Bar', 'Club', 'Community Center']

export default function CuratorDashboard() {
  const { isConnected, walletAddress, connect } = useWallet()

  const { isBlogOwner, isAuthorizedCurator, canAccessCurator } = usePermissions()

  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  // Form states
  const [verificationNotes, setVerificationNotes] = useState('')
  const [existingCuratorNotes, setExistingCuratorNotes] = useState<any>(null)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    contactInfo: '',
    hasPiano: false,
    description: '',
    address: '',
    updateNotes: '',
    // Operational details
    operatingHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '', close: '', closed: true },
    },
    accessibility: {
      wheelchairAccessible: false,
      elevatorAccess: false,
      accessibleParking: false,
      accessibleRestroom: false,
    },
    ambiance: [] as string[],
  })

  // Load venues from PostgreSQL (simplified for curator dashboard)
  const loadVenues = async () => {
    try {
      setLoading(true)
      setError('')

      console.log('🔄 Loading venues from PostgreSQL...')

      // Use simplified query for curator dashboard - no heavy relations
      const response = await fetch('/api/venues?limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to load venues: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📊 Received data:', {
        success: data.success,
        venueCount: data.venues?.length,
        totalCount: data.totalCount,
      })

      if (data.success && data.venues) {
        // Convert date strings to Date objects
        const processedVenues = data.venues.map((venue: any) => ({
          id: venue.id,
          slug: venue.slug,
          name: venue.name,
          city: venue.city,
          contactInfo: venue.contactInfo,
          hasPiano: venue.hasPiano,
          verified: venue.verified,
          submittedBy: venue.submittedBy,
          description: venue.description,
          address: venue.address,
          phone: venue.phone,
          amenities: venue.amenities || [],
          tags: venue.tags || [],
          rating: venue.rating || 0,
          reviewCount: venue.reviewCount || 0,
          createdAt: new Date(venue.createdAt),
        }))

        console.log('✅ Processed venues:', processedVenues.length)
        setVenues(processedVenues)
      } else {
        console.warn('⚠️ No venues found or invalid response')
        setError(data.error || 'No venues found')
        setVenues([])
      }
    } catch (error: any) {
      console.error('❌ Error loading venues:', error)
      setError('Failed to load venues: ' + error.message)
      setVenues([])
    } finally {
      setLoading(false)
    }
  }

  // Handle venue verification (PostgreSQL)
  const handleVerifyVenue = async (venueId: number, approved: boolean) => {
    if (!canAccessCurator) {
      setError('You are not authorized to verify venues')
      return
    }

    try {
      setError('')
      setLoading(true)

      console.log('🎯 Verifying venue:', { venueId, approved })

      // Call PUT API to update verified status
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified: approved,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.venue) {
        throw new Error(result.message || result.error || 'Failed to verify venue')
      }

      console.log('✅ Venue verified successfully:', result)
      setSuccessMessage(`Venue ${approved ? 'approved' : 'rejected'} successfully!`)
      setSelectedVenue(null)
      setVerificationNotes('')

      // Reload venues list
      await loadVenues()
    } catch (error: any) {
      console.error('❌ Verification failed:', error)
      setError('Verification failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle venue deletion
  const handleDeleteVenue = async () => {
    if (!selectedVenue || !canAccessCurator) {
      setError('Not authorized to delete venues')
      return
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${selectedVenue.name}"? This action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setLoading(true)

      console.log('🗑️ Deleting venue:', {
        venueId: selectedVenue.id,
        name: selectedVenue.name,
      })

      // Call DELETE API with wallet authentication
      const response = await fetch(`/api/venues/${selectedVenue.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress || '',
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to delete venue')
      }

      console.log('✅ Venue deleted successfully:', result)
      setSuccessMessage(`Venue "${selectedVenue.name}" deleted successfully`)
      setSelectedVenue(null)

      // Reload venues
      await loadVenues()
    } catch (error: any) {
      console.error('Error deleting venue:', error)
      setError('Delete failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle venue update (PostgreSQL)
  const handleUpdateVenue = async () => {
    if (!selectedVenue || !canAccessCurator) {
      setError('Not authorized to update venues')
      return
    }

    if (!editForm.name || !editForm.contactInfo) {
      setError('Name and contact info are required')
      return
    }

    try {
      setError('')
      setLoading(true)

      console.log('🔧 Updating venue:', {
        venueId: selectedVenue.id,
        name: editForm.name,
        contactInfo: editForm.contactInfo,
        hasPiano: editForm.hasPiano,
      })

      // Call PUT API to update venue in PostgreSQL
      const response = await fetch(`/api/venues/${selectedVenue.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          contactInfo: editForm.contactInfo,
          hasPiano: editForm.hasPiano,
          description: editForm.description,
          address: editForm.address,
          operatingHours: editForm.operatingHours,
          accessibility: editForm.accessibility,
          ambiance: editForm.ambiance,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.venue) {
        throw new Error(result.message || result.error || 'Failed to update venue')
      }

      console.log('✅ Venue updated successfully:', result)
      setSuccessMessage('Venue updated successfully!')
      setIsEditing(false)

      // Update selectedVenue with the changes
      setSelectedVenue({
        ...selectedVenue,
        ...result.venue,
        createdAt: new Date(result.venue.createdAt),
      })

      // Reload venues list
      await loadVenues()
    } catch (error: any) {
      console.error('Error updating venue:', error)
      setError('Update failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Load existing curator notes and update notes for a venue
  const loadCuratorNotes = async (venueId: number) => {
    setLoadingNotes(true)
    setExistingCuratorNotes(null)

    try {
      let notes: any = null

      // Load update notes from localStorage
      const updateStorageKey = `update_notes_${venueId}`
      const storedUpdateNotes = localStorage.getItem(updateStorageKey)
      if (storedUpdateNotes) {
        const updateNotes = JSON.parse(storedUpdateNotes)
        console.log('📝 Loaded update notes:', updateNotes.length, 'entries')
        notes = { updates: updateNotes }
      }

      setExistingCuratorNotes(notes)
    } catch (error) {
      console.error('Error loading curator notes:', error)
    } finally {
      setLoadingNotes(false)
    }
  }

  // Handle venue selection for review
  const selectVenueForReview = (venue: Venue) => {
    setSelectedVenue(venue)
    loadCuratorNotes(venue.id)
  }

  // Start editing venue
  const startEditing = (venue: Venue) => {
    setEditForm({
      name: venue.name,
      contactInfo: venue.contactInfo,
      hasPiano: venue.hasPiano,
      description: venue.description || '',
      address: venue.address || '',
      updateNotes: '',
      operatingHours: (venue as any).operatingHours || {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '', close: '', closed: true },
      },
      accessibility: (venue as any).accessibility || {
        wheelchairAccessible: false,
        elevatorAccess: false,
        accessibleParking: false,
        accessibleRestroom: false,
      },
      ambiance: (venue as any).ambiance || [],
    })
    setIsEditing(true)
  }

  // Load venues when connected and authorized
  useEffect(() => {
    if (canAccessCurator) {
      loadVenues()
    }
  }, [canAccessCurator])

  // Clear messages after delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Not connected - show connection prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">🎹 Curator Dashboard</h1>
          <p className="mb-8 text-gray-600">
            Connect your wallet to access curator tools for venue verification and management.
          </p>
          <div className="mx-auto max-w-sm">
            <WalletConnection size="lg" showNetworkStatus={true} />
          </div>
        </div>
      </div>
    )
  }

  // Connected but not authorized
  if (!canAccessCurator) {
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">🚫 Not Authorized</h1>
          <p className="mb-8 text-gray-600">
            Your wallet ({walletAddress?.substring(0, 8)}...) is not authorized as a curator. Only
            the blog owner can access curator tools.
          </p>

          <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Authorization Status:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Your Address:</span>
                <code className="text-xs">{walletAddress?.substring(0, 12)}...</code>
              </div>
              <div className="flex justify-between">
                <span>Blog Owner:</span>
                <code className="text-xs">{blogOwnerAddress?.substring(0, 12)}...</code>
              </div>
              <div className="flex justify-between">
                <span>Match:</span>
                <span
                  className={
                    walletAddress?.toLowerCase() === blogOwnerAddress?.toLowerCase()
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {walletAddress?.toLowerCase() === blogOwnerAddress?.toLowerCase() ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-4 text-sm text-gray-600">
              If you should have access, please ensure you're connected with the correct wallet.
            </p>
            <WalletConnection showFullAddress={true} showNetworkStatus={true} />
          </div>
        </div>
      </div>
    )
  }

  // Authorized and connected - show dashboard
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">🎹 Curator Dashboard</h1>
          <div className="mb-4 flex items-center gap-6 text-sm text-gray-600">
            <span>Total Venues: {venues.length}</span>
            <span>Pending: {venues.filter((v) => !v.verified).length}</span>
            <span>Verified: {venues.filter((v) => v.verified).length}</span>
          </div>

          <div className="flex items-center gap-4">
            <WalletConnection
              showFullAddress={false}
              showNetworkStatus={true}
              showPermissions={true}
            />
            <button
              onClick={loadVenues}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              🔄 Refresh Venues
            </button>
          </div>
        </div>

        {/* Debug: Permission Status */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="text-sm">
            <div className="mb-2 font-semibold text-blue-900">🔍 Permission Debug:</div>
            <div className="space-y-1 font-mono text-xs text-blue-800">
              <div>Connected Wallet: {walletAddress || 'None'}</div>
              <div>
                Blog Owner Address: {process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS || 'Not Set'}
              </div>
              <div>Is Blog Owner: {isBlogOwner ? '✅ YES' : '❌ NO'}</div>
              <div>Is Authorized Curator: {isAuthorizedCurator ? '✅ YES' : '❌ NO'}</div>
              <div>Can Access Curator: {canAccessCurator ? '✅ YES' : '❌ NO'}</div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="text-green-800">✅ {successMessage}</div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-red-800">❌ {error}</div>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Venues List */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">Venue Management</h2>
            <p className="mt-1 text-sm text-gray-600">
              Review, verify, and manage submitted venues
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading venues...</p>
            </div>
          ) : venues.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No venues found in the contract.</div>
          ) : (
            <div className="divide-y">
              {venues.map((venue) => (
                <div key={venue.id} className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{venue.name}</h3>
                        {venue.verified ? (
                          <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-gray-600">
                        <p className="break-words">📍 {venue.city}</p>
                        <p className="break-words">📞 {venue.contactInfo}</p>
                        {venue.hasPiano && <p>🎹 Has Piano Available</p>}
                        {venue.description && (
                          <p className="line-clamp-3 text-sm break-words">{venue.description}</p>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-gray-500">
                        <p>
                          Submitted:{' '}
                          {venue.createdAt instanceof Date && !isNaN(venue.createdAt.getTime())
                            ? venue.createdAt.toLocaleDateString()
                            : new Date(venue.createdAt).toLocaleDateString()}
                        </p>
                        <p className="break-all">By: {venue.submittedBy.substring(0, 8)}...</p>
                        <p>ID: {venue.id}</p>
                        {venue.rating > 0 && (
                          <p>
                            ⭐ {venue.rating.toFixed(1)} ({venue.reviewCount} reviews)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2 sm:ml-4">
                      <button
                        onClick={() => selectVenueForReview(venue)}
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Venue Review Modal */}
        {selectedVenue && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
            <div className="max-h-screen w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <h2 className="text-xl font-semibold">
                    {isEditing ? 'Edit Venue' : 'Review Venue'}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedVenue(null)
                      setIsEditing(false)
                      setExistingCuratorNotes(null)
                      setVerificationNotes('')
                      setError('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {isEditing ? (
                  /* Edit Form */
                  <div className="space-y-4">
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Changes will be visible immediately on the
                        blockchain.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Venue Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Contact Info</label>
                      <input
                        type="text"
                        value={editForm.contactInfo}
                        onChange={(e) => setEditForm({ ...editForm, contactInfo: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Piano Availability</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.hasPiano}
                          onChange={(e) => setEditForm({ ...editForm, hasPiano: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          🎹 This venue has a piano available
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Add venue description..."
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Address</label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Street address"
                      />
                    </div>

                    {/* Operational Details Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h4 className="mb-3 text-sm font-semibold text-gray-900">
                        Operational Details (Optional)
                      </h4>

                      {/* Operating Hours */}
                      <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium">Operating Hours</label>
                        <div className="space-y-2">
                          {[
                            'monday',
                            'tuesday',
                            'wednesday',
                            'thursday',
                            'friday',
                            'saturday',
                            'sunday',
                          ].map((day) => (
                            <div key={day} className="flex items-center gap-2">
                              <span className="w-24 text-sm capitalize">{day}:</span>
                              <input
                                type="checkbox"
                                checked={!editForm.operatingHours[day].closed}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    operatingHours: {
                                      ...editForm.operatingHours,
                                      [day]: {
                                        ...editForm.operatingHours[day],
                                        closed: !e.target.checked,
                                      },
                                    },
                                  })
                                }
                                className="h-4 w-4"
                              />
                              <span className="text-sm">Open</span>
                              {!editForm.operatingHours[day].closed && (
                                <>
                                  <input
                                    type="time"
                                    value={editForm.operatingHours[day].open}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        operatingHours: {
                                          ...editForm.operatingHours,
                                          [day]: {
                                            ...editForm.operatingHours[day],
                                            open: e.target.value,
                                          },
                                        },
                                      })
                                    }
                                    className="rounded border px-2 py-1 text-sm"
                                  />
                                  <span className="text-sm">to</span>
                                  <input
                                    type="time"
                                    value={editForm.operatingHours[day].close}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        operatingHours: {
                                          ...editForm.operatingHours,
                                          [day]: {
                                            ...editForm.operatingHours[day],
                                            close: e.target.value,
                                          },
                                        },
                                      })
                                    }
                                    className="rounded border px-2 py-1 text-sm"
                                  />
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Accessibility Features */}
                      <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium">
                          Accessibility Features
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.accessibility.wheelchairAccessible}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  accessibility: {
                                    ...editForm.accessibility,
                                    wheelchairAccessible: e.target.checked,
                                  },
                                })
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Wheelchair Accessible</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.accessibility.elevatorAccess}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  accessibility: {
                                    ...editForm.accessibility,
                                    elevatorAccess: e.target.checked,
                                  },
                                })
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Elevator Access</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.accessibility.accessibleParking}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  accessibility: {
                                    ...editForm.accessibility,
                                    accessibleParking: e.target.checked,
                                  },
                                })
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Accessible Parking</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.accessibility.accessibleRestroom}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  accessibility: {
                                    ...editForm.accessibility,
                                    accessibleRestroom: e.target.checked,
                                  },
                                })
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Accessible Restroom</span>
                          </label>
                        </div>
                      </div>

                      {/* Ambiance Tags */}
                      <div>
                        <label className="mb-2 block text-sm font-medium">Ambiance</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            'cozy',
                            'elegant',
                            'casual',
                            'modern',
                            'intimate',
                            'spacious',
                            'quiet',
                            'lively',
                          ].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                const currentAmbiance = editForm.ambiance || []
                                const newAmbiance = currentAmbiance.includes(tag)
                                  ? currentAmbiance.filter((t) => t !== tag)
                                  : [...currentAmbiance, tag]
                                setEditForm({ ...editForm, ambiance: newAmbiance })
                              }}
                              className={`rounded-full px-3 py-1 text-sm ${
                                (editForm.ambiance || []).includes(tag)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Update Notes (optional)
                      </label>
                      <textarea
                        value={editForm.updateNotes}
                        onChange={(e) => setEditForm({ ...editForm, updateNotes: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Explain what changes were made..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateVenue}
                        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                      >
                        Update Venue
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Review Form */
                  <div className="space-y-4">
                    {/* Venue Details */}
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="text-lg font-semibold">{selectedVenue.name}</h3>
                      <div className="mt-2 space-y-2">
                        <p className="text-gray-600">📍 {selectedVenue.city}</p>
                        <p className="text-gray-600">📞 {selectedVenue.contactInfo}</p>
                        {selectedVenue.hasPiano && (
                          <p className="text-blue-600">🎹 Has Piano Available</p>
                        )}
                        {selectedVenue.description && (
                          <p className="text-sm text-gray-600">{selectedVenue.description}</p>
                        )}
                        {selectedVenue.address && (
                          <p className="text-sm text-gray-600">📮 {selectedVenue.address}</p>
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          <p>
                            Submitted:{' '}
                            {selectedVenue.createdAt instanceof Date &&
                            !isNaN(selectedVenue.createdAt.getTime())
                              ? selectedVenue.createdAt.toLocaleDateString()
                              : new Date(selectedVenue.createdAt).toLocaleDateString()}
                          </p>
                          <p>By: {selectedVenue.submittedBy}</p>
                          <p>Status: {selectedVenue.verified ? 'Verified' : 'Pending'}</p>
                          {selectedVenue.rating > 0 && (
                            <p>
                              ⭐ {selectedVenue.rating.toFixed(1)} ({selectedVenue.reviewCount}{' '}
                              reviews)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Existing Curator Notes */}
                    {loadingNotes ? (
                      <div className="rounded-lg bg-blue-50 p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                          <p className="text-sm text-blue-800">Loading existing curator notes...</p>
                        </div>
                      </div>
                    ) : existingCuratorNotes ? (
                      <div className="space-y-3">
                        {/* Verification Notes */}
                        {existingCuratorNotes.verification && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <h4 className="mb-2 font-medium text-amber-800">
                              📝 Previous Verification Notes
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p>
                                <strong>Notes:</strong>{' '}
                                {existingCuratorNotes.verification.verificationNotes}
                              </p>
                              <p>
                                <strong>Status:</strong>{' '}
                                {existingCuratorNotes.verification.verificationStatus}
                              </p>
                              <p>
                                <strong>Verified by:</strong>{' '}
                                {existingCuratorNotes.verification.verifiedBy?.substring(0, 12)}...
                              </p>
                              <p>
                                <strong>Date:</strong>{' '}
                                {new Date(
                                  existingCuratorNotes.verification.verificationDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Update Notes */}
                        {existingCuratorNotes.updates &&
                          existingCuratorNotes.updates.length > 0 && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                              <h4 className="mb-2 font-medium text-green-800">
                                ✏️ Previous Update Notes
                              </h4>
                              <div className="space-y-2">
                                {existingCuratorNotes.updates.slice(-2).map((update, index) => (
                                  <div
                                    key={index}
                                    className="border-l-2 border-green-300 pl-3 text-sm"
                                  >
                                    <p>
                                      <strong>Notes:</strong> {update.updateNotes}
                                    </p>
                                    <p>
                                      <strong>Updated by:</strong>{' '}
                                      {update.updatedBy?.substring(0, 12)}...
                                    </p>
                                    <p>
                                      <strong>Date:</strong>{' '}
                                      {new Date(update.updateDate).toLocaleDateString()}
                                    </p>
                                    {update.changes && (
                                      <div className="mt-1 text-xs text-gray-600">
                                        <p>Changes made:</p>
                                        {update.changes.name && (
                                          <p>
                                            • Name: {update.changes.name.from} →{' '}
                                            {update.changes.name.to}
                                          </p>
                                        )}
                                        {update.changes.contactInfo && (
                                          <p>
                                            • Contact: {update.changes.contactInfo.from} →{' '}
                                            {update.changes.contactInfo.to}
                                          </p>
                                        )}
                                        {update.changes.hasPiano && (
                                          <p>
                                            • Piano:{' '}
                                            {update.changes.hasPiano.from
                                              ? 'Available'
                                              : 'Not Available'}{' '}
                                            →{' '}
                                            {update.changes.hasPiano.to
                                              ? 'Available'
                                              : 'Not Available'}
                                          </p>
                                        )}
                                        {update.changes.hasJamSession && (
                                          <p>
                                            • Jam Sessions:{' '}
                                            {update.changes.hasJamSession.from
                                              ? 'Available'
                                              : 'Not Available'}{' '}
                                            →{' '}
                                            {update.changes.hasJamSession.to
                                              ? 'Available'
                                              : 'Not Available'}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {existingCuratorNotes.updates.length > 2 && (
                                  <p className="text-xs text-gray-500">
                                    Showing latest 2 of {existingCuratorNotes.updates.length} update
                                    notes
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : null}

                    {/* Curator Notes */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        {existingCuratorNotes ? 'Add Additional Notes' : 'Curator Notes'}
                      </label>
                      <textarea
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder={
                          existingCuratorNotes
                            ? 'Add additional verification notes (optional)...'
                            : 'Add verification notes (optional)...'
                        }
                      />
                      {existingCuratorNotes && (
                        <p className="mt-1 text-xs text-gray-500">
                          Note: Previous curator notes are preserved above. These will be added as
                          additional notes.
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {!selectedVenue.verified && (
                        <>
                          <button
                            onClick={() => handleVerifyVenue(selectedVenue.id, true)}
                            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                            disabled={loading}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleVerifyVenue(selectedVenue.id, false)}
                            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                            disabled={loading}
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => startEditing(selectedVenue)}
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        disabled={loading}
                      >
                        ✏️ Edit Info
                      </button>
                      {isBlogOwner && (
                        <button
                          onClick={handleDeleteVenue}
                          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                          disabled={loading}
                        >
                          🗑️ Delete Venue
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
