'use client'

import { useState, useEffect } from 'react'
import { newKit } from '@celo/contractkit'

const VENUE_REGISTRY_ADDRESS = '0x7AaafaF53A972Bd11f0912049C0268dAE492D175'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Minimal ABI for reading venues
const VENUE_REGISTRY_ABI = [
  {
    "inputs": [],
    "name": "venueCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "venueId", "type": "uint256"}],
    "name": "getVenueById",
    "outputs": [
      {
        "components": [
          {"name": "hasPiano", "type": "bool"},
          {"name": "hasJamSession", "type": "bool"},
          {"name": "verified", "type": "bool"},
          {"name": "venueType", "type": "uint8"},
          {"name": "submissionTimestamp", "type": "uint32"},
          {"name": "verificationTimestamp", "type": "uint32"},
          {"name": "submittedBy", "type": "address"},
          {"name": "name", "type": "string"},
          {"name": "city", "type": "string"},
          {"name": "contactType", "type": "string"},
          {"name": "ipfsHash", "type": "string"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "city", "type": "string"}],
    "name": "getVenuesWithPianos",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
]

interface Venue {
  id: number
  name: string
  city: string
  hasPiano: boolean
  hasJamSession: boolean
  verified: boolean
  venueType: number
  contactType: string
  ipfsHash: string
  submittedBy: string
  submissionDate: Date
  verificationDate?: Date
}

const VENUE_TYPES = ['Cafe', 'Restaurant', 'Bar', 'Club', 'Community Center']

export default function VenueList() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'verified' | 'pianos' | 'jams'>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [error, setError] = useState<string>('')

  // Load venues from blockchain
  const loadVenues = async () => {
    try {
      setLoading(true)
      const kit = newKit(CELO_TESTNET_RPC)
      const contract = new kit.web3.eth.Contract(VENUE_REGISTRY_ABI, VENUE_REGISTRY_ADDRESS)
      
      // Get total venue count
      const count = await contract.methods.venueCount().call()
      const totalVenues = Number(count)
      
      if (totalVenues === 0) {
        setVenues([])
        setLoading(false)
        return
      }

      // Fetch all venues
      const venuePromises = []
      for (let i = 0; i < totalVenues; i++) {
        venuePromises.push(contract.methods.getVenueById(i).call())
      }
      
      const venueData = await Promise.all(venuePromises)
      
      // Process venue data
      const processedVenues: Venue[] = venueData.map((venue: any, index: number) => ({
        id: index,
        name: venue.name,
        city: venue.city,
        hasPiano: venue.hasPiano,
        hasJamSession: venue.hasJamSession,
        verified: venue.verified,
        venueType: Number(venue.venueType),
        contactType: venue.contactType,
        ipfsHash: venue.ipfsHash,
        submittedBy: venue.submittedBy,
        submissionDate: new Date(Number(venue.submissionTimestamp) * 1000),
        verificationDate: venue.verificationTimestamp > 0 
          ? new Date(Number(venue.verificationTimestamp) * 1000) 
          : undefined
      }))
      
      setVenues(processedVenues)
      
    } catch (error) {
      console.error('Error loading venues:', error)
      setError('Failed to load venues from blockchain')
    } finally {
      setLoading(false)
    }
  }

  // Filter venues based on selected filters
  const filteredVenues = venues.filter(venue => {
    if (filter === 'verified' && !venue.verified) return false
    if (filter === 'pianos' && !venue.hasPiano) return false
    if (filter === 'jams' && !venue.hasJamSession) return false
    if (cityFilter !== 'all' && venue.city !== cityFilter) return false
    return true
  })

  // Get unique cities for filter dropdown
  const uniqueCities = Array.from(new Set(venues.map(venue => venue.city))).sort()

  // Load venues on component mount
  useEffect(() => {
    loadVenues()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading venues from blockchain...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <button 
            onClick={loadVenues}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎹 Piano Venues Directory
          </h1>
          <p className="text-gray-600">
            Discover venues with pianos and jam sessions in your area. All venues are community-submitted and manually verified.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {filteredVenues.length} of {venues.length} venues shown
            </span>
            <button
              onClick={loadVenues}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Venues</option>
                <option value="verified">Verified Only</option>
                <option value="pianos">With Piano</option>
                <option value="jams">With Jam Sessions</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by City
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        {filteredVenues.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎹</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
            <p className="text-gray-600 mb-4">
              {venues.length === 0 
                ? "No venues have been submitted yet. Be the first to add one!" 
                : "Try adjusting your filters or check back later for new venues."}
            </p>
            <a
              href="/submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
            >
              Submit First Venue
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <div key={venue.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Venue Header */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {venue.name}
                    </h3>
                    {venue.verified ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    📍 {venue.city} • {VENUE_TYPES[venue.venueType]}
                  </div>

                  {/* Features */}
                  <div className="flex gap-2 mb-4">
                    {venue.hasPiano && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        🎹 Piano
                      </span>
                    )}
                    {venue.hasJamSession && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        🎵 Jam Sessions
                      </span>
                    )}
                  </div>

                  {/* Submission Info */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      Submitted: {venue.submissionDate.toLocaleDateString()}
                    </div>
                    {venue.verificationDate && (
                      <div>
                        Verified: {venue.verificationDate.toLocaleDateString()}
                      </div>
                    )}
                    <div className="font-mono">
                      By: {venue.submittedBy.substring(0, 8)}...
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <div className="flex justify-between items-center">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                    {venue.verified && (
                      <button className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700">
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
        <div className="mt-12 bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{venues.length}</div>
              <div className="text-sm text-gray-600">Total Venues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {venues.filter(v => v.verified).length}
              </div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {venues.filter(v => v.hasPiano).length}
              </div>
              <div className="text-sm text-gray-600">With Piano</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {venues.filter(v => v.hasJamSession).length}
              </div>
              <div className="text-sm text-gray-600">Jam Sessions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
