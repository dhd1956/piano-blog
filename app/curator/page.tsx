'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { usePermissions } from '@/components/web3/WorkingWeb3Provider'
import WalletConnection from '@/components/web3/WalletConnection'

interface Venue {
  id: number
  name: string
  city: string
  contactInfo: string
  hasPiano: boolean
  hasJamSession: boolean
  verified: boolean
  submittedBy: string
  timestamp: number
  submissionDate: Date
}

const VENUE_TYPES = ['Cafe', 'Restaurant', 'Bar', 'Club', 'Community Center']

export default function CuratorDashboard() {
  const {
    isConnected,
    walletAddress,
    getAllVenues,
    updateVenue,
    verifyVenue,
    getCuratorNotes,
    hasAnyPermissions,
    connect,
  } = useWallet()

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
    hasJamSession: false,
    updateNotes: '',
  })

  // Load venues from blockchain
  const loadVenues = async () => {
    try {
      setLoading(true)
      setError('')

      const result = await getAllVenues()

      if (result.success && result.venues) {
        setVenues(result.venues)
      } else {
        setError(result.error || 'Failed to load venues')
      }
    } catch (error: any) {
      console.error('Error loading venues:', error)
      setError('Failed to load venues: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle venue verification
  const handleVerifyVenue = async (venueId: number, approved: boolean) => {
    console.log('🚀 Starting venue verification process...')
    console.log('📊 Initial state check:', {
      canAccessCurator,
      isConnected,
      walletAddress: walletAddress ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(-4)}` : 'null',
      venueId,
      approved,
      notesLength: verificationNotes.length
    })

    if (!canAccessCurator) {
      console.error('❌ Authorization failed: User cannot access curator functions')
      setError('You are not authorized to verify venues')
      return
    }

    try {
      setError('')
      setLoading(true)
      
      console.log('🎯 About to call verifyVenue with:', { 
        venueId, 
        approved, 
        notes: verificationNotes.substring(0, 50) + (verificationNotes.length > 50 ? '...' : ''),
        fullNotesLength: verificationNotes.length
      })

      // Check wallet connection state before verification
      if (!isConnected || !walletAddress) {
        console.error('❌ Pre-verification check failed:', { isConnected, hasWalletAddress: !!walletAddress })
        setError('Wallet not connected. Please connect your wallet and try again.')
        setLoading(false)
        return
      }

      console.log('✅ Pre-verification checks passed, calling verifyVenue...')
      const result = await verifyVenue(venueId, approved, verificationNotes)
      
      console.log('🔄 Verify venue result:', {
        success: result.success,
        hasTransactionHash: !!result.transactionHash,
        hasIpfsHash: !!result.ipfsHash,
        error: result.error,
        transactionHash: result.transactionHash ? `${result.transactionHash.substring(0, 10)}...` : 'none',
        ipfsHash: result.ipfsHash ? `${result.ipfsHash.substring(0, 10)}...` : 'none'
      })

      if (result.success) {
        let successMsg = `Venue ${approved ? 'approved' : 'rejected'} successfully!`
        if (result.ipfsHash) {
          successMsg += ` Curator notes saved to IPFS: ${result.ipfsHash.substring(0, 12)}...`
        }
        console.log('✅ Verification successful:', successMsg)
        setSuccessMessage(successMsg)
        setSelectedVenue(null)
        setVerificationNotes('')
        await loadVenues()
      } else {
        console.error('❌ Verification failed:', result.error)
        setError(result.error || 'Failed to verify venue')
      }
    } catch (error: any) {
      console.error('❌ Exception during verification:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack?.substring(0, 200) + '...'
      })
      setError('Verification failed: ' + error.message)
    } finally {
      setLoading(false)
      console.log('🏁 Verification process completed')
    }
  }

  // Handle venue update
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

      console.log('🔧 Updating venue with notes:', {
        venueId: selectedVenue.id,
        name: editForm.name,
        contactInfo: editForm.contactInfo,
        updateNotes: editForm.updateNotes,
        updateNotesLength: editForm.updateNotes.length
      })

      // Save update notes to localStorage if provided
      if (editForm.updateNotes && editForm.updateNotes.trim()) {
        console.log('🔧 Saving update notes to localStorage...')
        const updateMetadata = {
          updateNotes: editForm.updateNotes.trim(),
          updatedBy: walletAddress,
          updateDate: new Date().toISOString(),
          updateType: 'venue_edit',
          changes: {
            name: editForm.name !== selectedVenue.name ? { from: selectedVenue.name, to: editForm.name } : null,
            contactInfo: editForm.contactInfo !== selectedVenue.contactInfo ? { from: selectedVenue.contactInfo, to: editForm.contactInfo } : null,
            hasPiano: editForm.hasPiano !== selectedVenue.hasPiano ? { from: selectedVenue.hasPiano, to: editForm.hasPiano } : null,
            hasJamSession: editForm.hasJamSession !== selectedVenue.hasJamSession ? { from: selectedVenue.hasJamSession, to: editForm.hasJamSession } : null
          }
        }

        const storageKey = `update_notes_${selectedVenue.id}`
        const existingNotes = localStorage.getItem(storageKey)
        let allNotes = []
        
        if (existingNotes) {
          allNotes = JSON.parse(existingNotes)
        }
        
        allNotes.push(updateMetadata)
        localStorage.setItem(storageKey, JSON.stringify(allNotes))
        console.log('✅ Update notes saved to localStorage')
      }

      // Handle piano status change (since contract doesn't support it)
      if (editForm.hasPiano !== selectedVenue.hasPiano) {
        console.log('🔧 Piano status changed, saving to localStorage...', {
          venueId: selectedVenue.id,
          from: selectedVenue.hasPiano,
          to: editForm.hasPiano
        })
        
        const pianoStorageKey = `venue_piano_${selectedVenue.id}`
        const pianoUpdate = {
          hasPiano: editForm.hasPiano,
          updatedBy: walletAddress,
          updateDate: new Date().toISOString(),
          previousValue: selectedVenue.hasPiano
        }
        
        localStorage.setItem(pianoStorageKey, JSON.stringify(pianoUpdate))
        console.log('✅ Piano status saved to localStorage with key:', pianoStorageKey)
        console.log('✅ Saved data:', pianoUpdate)
        
        // Verify it was saved
        const verification = localStorage.getItem(pianoStorageKey)
        console.log('✅ Verification - data in localStorage:', verification)
      } else {
        console.log('ℹ️ No piano status change detected', {
          venueId: selectedVenue.id,
          editFormHasPiano: editForm.hasPiano,
          selectedVenueHasPiano: selectedVenue.hasPiano
        })
      }

      // Handle jam session status change (since contract doesn't support it)
      if (editForm.hasJamSession !== selectedVenue.hasJamSession) {
        console.log('🔧 Jam session status changed, saving to localStorage...', {
          venueId: selectedVenue.id,
          from: selectedVenue.hasJamSession,
          to: editForm.hasJamSession
        })
        
        const jamSessionStorageKey = `venue_jam_session_${selectedVenue.id}`
        const jamSessionUpdate = {
          hasJamSession: editForm.hasJamSession,
          updatedBy: walletAddress,
          updateDate: new Date().toISOString(),
          previousValue: selectedVenue.hasJamSession
        }
        
        localStorage.setItem(jamSessionStorageKey, JSON.stringify(jamSessionUpdate))
        console.log('✅ Jam session status saved to localStorage with key:', jamSessionStorageKey)
        console.log('✅ Saved data:', jamSessionUpdate)
        
        // Verify it was saved
        const verification = localStorage.getItem(jamSessionStorageKey)
        console.log('✅ Verification - data in localStorage:', verification)
      } else {
        console.log('ℹ️ No jam session status change detected', {
          venueId: selectedVenue.id,
          editFormHasJamSession: editForm.hasJamSession,
          selectedVenueHasJamSession: selectedVenue.hasJamSession
        })
      }

      const result = await updateVenue(selectedVenue.id, editForm.name, editForm.contactInfo)

      if (result.success) {
        let successMsg = 'Venue updated successfully!'
        const changes = []
        
        if (editForm.updateNotes.trim()) {
          changes.push('update notes saved')
        }
        
        if (editForm.hasPiano !== selectedVenue.hasPiano) {
          changes.push(`piano status changed to ${editForm.hasPiano ? 'available' : 'not available'}`)
        }
        
        if (editForm.hasJamSession !== selectedVenue.hasJamSession) {
          changes.push(`jam session status changed to ${editForm.hasJamSession ? 'available' : 'not available'}`)
        }
        
        if (changes.length > 0) {
          successMsg += ' (' + changes.join(', ') + ')'
        }
        
        setSuccessMessage(successMsg)
        setIsEditing(false)
        
        // Update selectedVenue with the changes to reflect them immediately
        const updatedVenue = {
          ...selectedVenue,
          name: editForm.name,
          contactInfo: editForm.contactInfo,
          hasPiano: editForm.hasPiano,
          hasJamSession: editForm.hasJamSession
        }
        console.log('🔧 Updating selectedVenue state with changes:', updatedVenue)
        setSelectedVenue(updatedVenue)
        
        await loadVenues()
      } else {
        setError(result.error || 'Failed to update venue')
      }
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
      // Load curator verification notes
      const result = await getCuratorNotes(venueId)
      let notes = null
      
      if (result.success && result.notes) {
        notes = { verification: result.notes }
        console.log('📝 Loaded curator notes:', result.notes)
      } else {
        console.log('ℹ️ No curator notes found for venue', venueId)
      }

      // Also load update notes
      const updateStorageKey = `update_notes_${venueId}`
      const storedUpdateNotes = localStorage.getItem(updateStorageKey)
      if (storedUpdateNotes) {
        const updateNotes = JSON.parse(storedUpdateNotes)
        console.log('📝 Loaded update notes:', updateNotes.length, 'entries')
        if (!notes) notes = {}
        notes.updates = updateNotes
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
      hasJamSession: venue.hasJamSession || false,
      updateNotes: '',
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                        <p>📍 {venue.city}</p>
                        <p>📞 {venue.contactInfo}</p>
                        {venue.hasPiano && <p>🎹 Has Piano Available</p>}
                        {venue.hasJamSession && <p>🎵 Hosts Jam Sessions</p>}
                      </div>

                      <div className="mt-2 text-sm text-gray-500">
                        <p>Submitted: {venue.submissionDate.toLocaleDateString()}</p>
                        <p>By: {venue.submittedBy.substring(0, 8)}...</p>
                        <p>ID: {venue.id}</p>
                      </div>
                    </div>

                    <div className="ml-4 flex gap-2">
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
                        <span className="text-sm text-gray-700">🎹 This venue has a piano available</span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Jam Session Availability</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.hasJamSession}
                          onChange={(e) => setEditForm({ ...editForm, hasJamSession: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">🎵 This venue hosts jam sessions</span>
                      </div>
                    </div>


                    <div>
                      <label className="mb-1 block text-sm font-medium">Update Notes</label>
                      <textarea
                        value={editForm.updateNotes}
                        onChange={(e) => setEditForm({ ...editForm, updateNotes: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        rows={3}
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
                        {selectedVenue.hasJamSession && (
                          <p className="text-purple-600">🎵 Hosts Jam Sessions</p>
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Submitted: {selectedVenue.submissionDate.toLocaleDateString()}</p>
                          <p>By: {selectedVenue.submittedBy}</p>
                          <p>Status: {selectedVenue.verified ? 'Verified' : 'Pending'}</p>
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
                          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                            <h4 className="font-medium text-amber-800 mb-2">📝 Previous Verification Notes</h4>
                            <div className="text-sm space-y-1">
                              <p><strong>Notes:</strong> {existingCuratorNotes.verification.verificationNotes}</p>
                              <p><strong>Status:</strong> {existingCuratorNotes.verification.verificationStatus}</p>
                              <p><strong>Verified by:</strong> {existingCuratorNotes.verification.verifiedBy?.substring(0, 12)}...</p>
                              <p><strong>Date:</strong> {new Date(existingCuratorNotes.verification.verificationDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Update Notes */}
                        {existingCuratorNotes.updates && existingCuratorNotes.updates.length > 0 && (
                          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                            <h4 className="font-medium text-green-800 mb-2">✏️ Previous Update Notes</h4>
                            <div className="space-y-2">
                              {existingCuratorNotes.updates.slice(-2).map((update, index) => (
                                <div key={index} className="text-sm border-l-2 border-green-300 pl-3">
                                  <p><strong>Notes:</strong> {update.updateNotes}</p>
                                  <p><strong>Updated by:</strong> {update.updatedBy?.substring(0, 12)}...</p>
                                  <p><strong>Date:</strong> {new Date(update.updateDate).toLocaleDateString()}</p>
                                  {update.changes && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      <p>Changes made:</p>
                                      {update.changes.name && <p>• Name: {update.changes.name.from} → {update.changes.name.to}</p>}
                                      {update.changes.contactInfo && <p>• Contact: {update.changes.contactInfo.from} → {update.changes.contactInfo.to}</p>}
                                      {update.changes.hasPiano && <p>• Piano: {update.changes.hasPiano.from ? 'Available' : 'Not Available'} → {update.changes.hasPiano.to ? 'Available' : 'Not Available'}</p>}
                                      {update.changes.hasJamSession && <p>• Jam Sessions: {update.changes.hasJamSession.from ? 'Available' : 'Not Available'} → {update.changes.hasJamSession.to ? 'Available' : 'Not Available'}</p>}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {existingCuratorNotes.updates.length > 2 && (
                                <p className="text-xs text-gray-500">Showing latest 2 of {existingCuratorNotes.updates.length} update notes</p>
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
                        placeholder={existingCuratorNotes 
                          ? "Add additional verification notes (optional)..." 
                          : "Add verification notes (optional)..."
                        }
                      />
                      {existingCuratorNotes && (
                        <p className="mt-1 text-xs text-gray-500">
                          Note: Previous curator notes are preserved above. These will be added as additional notes.
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!selectedVenue.verified && (
                        <>
                          <button
                            onClick={() => handleVerifyVenue(selectedVenue.id, true)}
                            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleVerifyVenue(selectedVenue.id, false)}
                            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => startEditing(selectedVenue)}
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        ✏️ Edit Info
                      </button>
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
