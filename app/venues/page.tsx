'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Venue {
  id: number
  slug: string
  name: string
  city: string
  contactInfo: string
  hasPiano: boolean
  isVirtual: boolean
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
  rejectedAt?: string | null
  rejectedBy?: string | null
  rejectionReason?: string | null
}

export default function VenueList() {
  const { user, isAuthenticated } = useAuth()
  const isBlogOwner = user?.role === 'BLOG_OWNER'

  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'verified' | 'pianos' | 'jams'>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [error, setError] = useState<string>('')
  const [curatedVenueIds, setCuratedVenueIds] = useState<Set<number>>(new Set())

  // Load venues from PostgreSQL API
  const loadVenues = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/venues', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load venues: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.venues) {
        // Convert date strings to Date objects
        const processedVenues = data.venues.map((venue: any) => ({
          ...venue,
          createdAt: new Date(venue.createdAt),
        }))
        setVenues(processedVenues)
      } else {
        setError(data.error || 'Failed to load venues')
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

  // Curators (non-blog-owner) need to know which specific venues they're assigned to edit
  useEffect(() => {
    if (!isAuthenticated || isBlogOwner || user?.role !== 'CURATOR') {
      setCuratedVenueIds(new Set())
      return
    }

    const abortController = new AbortController()
    fetch('/api/venues?myCurated=true', {
      credentials: 'include',
      signal: abortController.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.venues) {
          setCuratedVenueIds(new Set(data.venues.map((v: Venue) => v.id)))
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error('Error loading curated venues:', err)
      })

    return () => abortController.abort()
  }, [isAuthenticated, isBlogOwner, user?.role])

  const canEditVenue = (venue: Venue) => isBlogOwner || curatedVenueIds.has(venue.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl text-center">
          <div className="border-primary-600 dark:border-primary-400 mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading venues...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-4 text-red-600 dark:text-red-400">❌ {error}</div>
          <button
            onClick={loadVenues}
            className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 rounded-lg px-4 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            🎹 Piano Venues Directory
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover venues with pianos and jam sessions in your area. All venues are
            community-submitted and manually verified.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredVenues.length} of {venues.length} venues shown
            </span>
            <button
              onClick={loadVenues}
              className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm underline"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="all">All Venues</option>
                <option value="verified">Verified Only</option>
                <option value="pianos">With Piano</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by City
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
            <div className="mb-4 text-6xl text-gray-400 dark:text-gray-600">🎹</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              No venues found
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              {venues.length === 0
                ? 'No venues have been submitted yet. Be the first to add one!'
                : 'Try adjusting your filters or check back later for new venues.'}
            </p>
            <a
              href="/submit"
              className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 inline-block rounded-lg px-6 py-3 text-white"
            >
              Submit First Venue
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800"
              >
                {/* Venue Header */}
                <div className="p-6 pb-4">
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {venue.name}
                    </h3>
                    {venue.verified ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓ Verified
                      </span>
                    ) : venue.rejectedAt ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
                        ✗ Rejected
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                    {venue.isVirtual ? '🌐 Virtual Venue' : `📍 ${venue.city}`}
                  </div>

                  {/* Features */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {venue.isVirtual && (
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        🌐 Online Only
                      </span>
                    )}
                    {venue.hasPiano && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        🎹 Piano Available
                      </span>
                    )}
                  </div>

                  {/* Venue Info */}
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {venue.description && (
                      <div className="line-clamp-2 text-gray-600 dark:text-gray-400">
                        {venue.description}
                      </div>
                    )}
                    <div>Added: {venue.createdAt.toLocaleDateString()}</div>
                    <div className="font-mono">By: {venue.submittedBy.substring(0, 8)}...</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <a
                        href={`/venueDetails/${venue.id}`}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium underline"
                      >
                        View Details
                      </a>
                      {canEditVenue(venue) && (
                        <a
                          href={`/venueDetails/${venue.id}?edit=1`}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium underline"
                        >
                          ✏️ Edit
                        </a>
                      )}
                    </div>
                    {venue.verified && !venue.isVirtual && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          [venue.name, venue.address, venue.city].filter(Boolean).join(', ')
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                      >
                        🗺️ Visit Venue
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer - Fixed duplicate */}
        <div className="mt-12 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <div className="text-primary-600 dark:text-primary-400 text-2xl font-bold">
                {venues.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Venues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {venues.filter((v) => v.verified).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {venues.filter((v) => v.hasPiano).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">With Piano</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {uniqueCities.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
