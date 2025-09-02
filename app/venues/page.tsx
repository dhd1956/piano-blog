'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'

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
}

const VENUE_TYPES = ['Cafe', 'Restaurant', 'Bar', 'Club', 'Community Center']

export default function VenueList() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'verified' | 'pianos' | 'jams'>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [error, setError] = useState<string>('')

  const { getAllVenues } = useWallet()

  // Load venues from blockchain
  const loadVenues = async () => {
    try {
      setLoading(true)
      setError('')

      const result = await getAllVenues()

      if (result.success && result.venues) {
        setVenues(result.venues)
      } else {
        setError(result.error || 'Failed to load venues from blockchain')
      }
    } catch (error: any) {
      console.error('Error loading venues:', error)
      setError('Failed to load venues: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter venues based on selected filters
  const filteredVenues = venues.filter((venue) => {
    if (filter === 'verified' && !venue.verified) return false
    if (filter === 'pianos' && !venue.hasPiano) return false
    if (cityFilter !== 'all' && venue.city !== cityFilter) return false
    return true
  })

  // Get unique cities for filter dropdown
  const uniqueCities = Array.from(new Set(venues.map((venue) => venue.city))).sort()

  // Load venues on component mount
  useEffect(() => {
    loadVenues()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading venues from blockchain...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-4 text-red-600">❌ {error}</div>
          <button
            onClick={loadVenues}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">🎹 Piano Venues Directory</h1>
          <p className="text-gray-600">
            Discover venues with pianos and jam sessions in your area. All venues are
            community-submitted and manually verified.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {filteredVenues.length} of {venues.length} venues shown
            </span>
            <button
              onClick={loadVenues}
              className="text-sm text-blue-600 underline hover:text-blue-800"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Filter by Type</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Venues</option>
                <option value="verified">Verified Only</option>
                <option value="pianos">With Piano</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Filter by City</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        {filteredVenues.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl text-gray-400">🎹</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">No venues found</h3>
            <p className="mb-4 text-gray-600">
              {venues.length === 0
                ? 'No venues have been submitted yet. Be the first to add one!'
                : 'Try adjusting your filters or check back later for new venues.'}
            </p>
            <a
              href="/submit"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Submit First Venue
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVenues.map((venue) => (
              <div key={venue.id} className="overflow-hidden rounded-lg bg-white shadow-md">
                {/* Venue Header */}
                <div className="p-6 pb-4">
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="truncate text-lg font-semibold text-gray-900">{venue.name}</h3>
                    {venue.verified ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mb-3 text-sm text-gray-600">📍 {venue.city}</div>

                  {/* Features */}
                  <div className="mb-4 flex gap-2">
                    {venue.hasPiano && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        🎹 Piano Available
                      </span>
                    )}
                  </div>

                  {/* Submission Info */}
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>Submitted: {venue.submissionDate.toLocaleDateString()}</div>
                    <div className="font-mono">By: {venue.submittedBy.substring(0, 8)}...</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <a
                      href={`/venueDetails/${venue.id}`}
                      className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
                    >
                      View Details
                    </a>
                    {venue.verified && (
                      <button className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700">
                        Visit Venue
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-12 rounded-lg bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">{venues.length}</div>
              <div className="text-sm text-gray-600">Total Venues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {venues.filter((v) => v.verified).length}
              </div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {venues.filter((v) => v.hasPiano).length}
              </div>
              <div className="text-sm text-gray-600">With Piano</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{venues.length}</div>
              <div className="text-sm text-gray-600">Total Venues</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
