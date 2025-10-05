'use client'

import { useState, useEffect } from 'react'
import { VenueService } from '@/lib/database'
import { QuickPXPPayment } from '@/components/payments/UnifiedPXPPayment'
import { useHybridWallet } from '@/hooks/useHybridWallet'
import { VENUE_TYPES as VENUE_TYPE_LABELS } from '@/types/venue'
import Link from 'next/link'

interface Venue {
  id: number
  blockchainId?: number | null
  name: string
  slug: string
  city: string
  contactInfo: string
  hasPiano: boolean
  hasJamSession: boolean
  venueType: number
  verified: boolean
  description?: string | null
  address?: string | null
  phone?: string | null
  website?: string | null
  amenities: string[]
  tags: string[]
  priceRange?: string | null
  rating?: number | null
  reviewCount: number
  syncStatus: string
  submittedBy: string
  createdAt: Date
  isPartner: boolean
  paymentAddress?: string | null
  totalCAVReceived: number
  _count: {
    reviews: number
    payments: number
  }
}

const VENUE_TYPES = ['All', 'Cafe', 'Restaurant', 'Bar', 'Club', 'Community Center']
const CITIES = ['All', 'San Francisco', 'New York', 'Austin', 'Chicago', 'Los Angeles']

export default function HybridVenueList() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Filters
  const [filter, setFilter] = useState<'all' | 'verified' | 'pianos' | 'jams'>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'createdAt'>('createdAt')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const itemsPerPage = 12

  const { userType, canUseWeb3, canUseQR, onboardingMessage } = useHybridWallet()

  // Load venues from PostgreSQL
  const loadVenues = async (page = 1, append = false) => {
    try {
      setLoading(true)
      setError('')

      // Build filter options
      const options = {
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        orderBy: sortBy,
        orderDirection: sortBy === 'rating' ? 'desc' : sortBy === 'createdAt' ? 'desc' : 'asc',
      } as any

      // Apply filters
      if (filter === 'verified') options.verified = true
      if (filter === 'pianos') options.hasPiano = true
      if (filter === 'jams') {
        options.hasPiano = true
        // We'll filter hasJamSession in the component since it's not in VenueService yet
      }

      if (cityFilter !== 'all') options.city = cityFilter
      if (searchQuery.trim()) options.search = searchQuery.trim()

      const result = await VenueService.getVenues(options)

      // Filter jam sessions locally for now
      let filteredVenues = result.venues
      if (filter === 'jams') {
        filteredVenues = result.venues.filter((venue) => venue.hasJamSession)
      }

      if (append) {
        setVenues((prev) => [...prev, ...(filteredVenues as any)])
      } else {
        setVenues(filteredVenues as any)
      }

      setTotalCount(result.totalCount)
      setHasMore(result.hasMore)
    } catch (error: any) {
      console.error('Error loading venues:', error)
      setError('Failed to load venues: ' + error.message)
      setVenues([])
    } finally {
      setLoading(false)
    }
  }

  // Load venues on mount and when filters change
  useEffect(() => {
    loadVenues(1, false)
    setCurrentPage(1)
  }, [filter, cityFilter, searchQuery, sortBy])

  // Load more venues (pagination)
  const loadMoreVenues = () => {
    const nextPage = currentPage + 1
    loadVenues(nextPage, true)
    setCurrentPage(nextPage)
  }

  const getVenueIcon = (venue: Venue) => {
    if (venue.hasPiano && venue.hasJamSession) return '🎹🎵'
    if (venue.hasPiano) return '🎹'
    return '🏢'
  }

  const getStatusBadge = (venue: Venue) => {
    if (venue.verified) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          ✅ Verified
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
        {venue.syncStatus === 'COMPLETED' ? '⏳ Pending Review' : '🔄 Syncing'}
      </span>
    )
  }

  const getSyncStatusBadge = (venue: Venue) => {
    const statusColors = {
      COMPLETED: 'bg-green-50 text-green-700',
      PENDING: 'bg-yellow-50 text-yellow-700',
      FAILED: 'bg-red-50 text-red-700',
      PROCESSING: 'bg-blue-50 text-blue-700',
    }

    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[venue.syncStatus as keyof typeof statusColors] || 'bg-gray-50 text-gray-700'}`}
      >
        {venue.blockchainId ? `⛓️ Block #${venue.blockchainId}` : '📱 Local Only'}
      </span>
    )
  }

  if (loading && venues.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading venues from database...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-600 to-green-600 p-6 text-white">
          <h1 className="mb-2 text-3xl font-bold">🎹 Piano Venues Discovery</h1>
          <p className="text-blue-100">
            Hybrid PostgreSQL + Blockchain venue discovery with instant search and Web3 payments
          </p>
          <div className="mt-3 text-sm text-blue-200">{onboardingMessage}</div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                🔍 Search Venues
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Search by name, city, or tags..."
              />
            </div>

            {/* Filter by Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">🎯 Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Venues</option>
                <option value="verified">✅ Verified Only</option>
                <option value="pianos">🎹 Has Piano</option>
                <option value="jams">🎵 Jam Sessions</option>
              </select>
            </div>

            {/* Filter by City */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">📍 City</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city.toLowerCase()}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">📊 Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="createdAt">Latest Added</option>
                <option value="name">Name A-Z</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between border-t pt-4 text-sm text-gray-600">
            <div>
              Found {totalCount.toLocaleString()} venues
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                <span>PostgreSQL (Instant)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                <span>Blockchain Synced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-red-800">❌ {error}</div>
          </div>
        )}

        {/* Venue Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
            >
              {/* Venue Header */}
              <div className="p-6 pb-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-2xl">{getVenueIcon(venue)}</span>
                      <h3 className="line-clamp-1 text-lg font-semibold text-gray-900">
                        {venue.name}
                      </h3>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {getStatusBadge(venue)}
                      {getSyncStatusBadge(venue)}
                      {venue.isPartner && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                          💎 Partner
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Venue Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <span>📍</span> {venue.city} • {VENUE_TYPE_LABELS[venue.venueType] || 'Cafe'}
                  </p>
                  {venue.address && (
                    <p className="flex items-center gap-2">
                      <span>🏠</span> {venue.address}
                    </p>
                  )}
                  {venue.phone && (
                    <p className="flex items-center gap-2">
                      <span>📞</span> {venue.phone}
                    </p>
                  )}
                  {venue.hasPiano && (
                    <div className="flex items-center gap-2">
                      <span>🎹</span>
                      <span>Piano available{venue.hasJamSession && ' + Jam sessions'}</span>
                    </div>
                  )}
                  {venue.rating && (
                    <p className="flex items-center gap-2">
                      <span>⭐</span>
                      <span>
                        {venue.rating.toFixed(1)} ({venue.reviewCount} reviews)
                      </span>
                    </p>
                  )}
                </div>

                {/* Tags */}
                {venue.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {venue.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                    {venue.tags.length > 3 && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        +{venue.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* PXP Payment Section (for partners) */}
              {venue.isPartner && venue.verified && (
                <div className="px-6 pb-4">
                  <QuickPXPPayment
                    recipientAddress={venue.paymentAddress || venue.submittedBy}
                    recipientName={venue.name}
                    memo={`Payment to ${venue.name} - ${venue.city}`}
                    onPayment={(details) => {
                      console.log('Payment initiated from venue listing:', details)
                    }}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between bg-gray-50 px-6 py-4">
                <div className="text-xs text-gray-500">
                  <div>Added {new Date(venue.createdAt).toLocaleDateString()}</div>
                  {venue.totalCAVReceived > 0 && (
                    <div className="font-medium text-green-600">
                      💰 {venue.totalCAVReceived} PXP received
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/venues/${venue.slug}`}
                    className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors hover:bg-blue-200"
                  >
                    📖 Details
                  </Link>

                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/venues/${venue.slug}`
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
                    className="rounded bg-green-100 px-3 py-1 text-sm text-green-700 transition-colors hover:bg-green-200"
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMoreVenues}
              disabled={loading}
              className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? 'Loading...'
                : `Load More Venues (${venues.length.toLocaleString()} of ${totalCount.toLocaleString()})`}
            </button>
          </div>
        )}

        {/* Empty State */}
        {venues.length === 0 && !loading && (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">🎹</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">No venues found</h3>
            <p className="mb-6 text-gray-600">
              {searchQuery || cityFilter !== 'all' || filter !== 'all'
                ? 'Try adjusting your search filters'
                : 'Be the first to submit a venue to the platform!'}
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              ➕ Submit New Venue
            </Link>
          </div>
        )}

        {/* Performance Notice */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 font-medium text-blue-900">🚀 Hybrid Performance Benefits</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>✅ Instant search and filtering via PostgreSQL</li>
            <li>✅ Blockchain verification for trust and transparency</li>
            <li>✅ Real-time PXP payment integration</li>
            <li>✅ Offline-capable with QR code support</li>
            <li>✅ Progressive enhancement based on user capabilities</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
